"""Validate and update the local, evidence-backed Hindi reel production tracker.

This tool is deliberately offline: it never generates media, mutates Google Drive,
or claims a reel is delivered. It enforces durable local state before those stages.
"""

from __future__ import annotations

import argparse
import csv
import json
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT / "topic_registry.csv"
STATUS_PATH = ROOT / "progress" / "production_status.json"
FAILURES_PATH = ROOT / "progress" / "failures.json"
QUEUE_PATH = ROOT / "batch_001_queue.json"

ALLOWED_TRANSITIONS = {
    "planned": {"researching", "blocked", "failed"},
    "researching": {"researched", "blocked", "failed"},
    "researched": {"scripted", "blocked", "failed"},
    "scripted": {"media_in_progress", "blocked", "failed"},
    "media_in_progress": {"qc_pending", "blocked", "failed"},
    "qc_pending": {"verified", "blocked", "failed"},
    "verified": {"uploaded", "blocked", "failed"},
    "uploaded": set(),
    "blocked": {"researching", "media_in_progress", "failed"},
    "failed": {"researching", "media_in_progress", "blocked"},
}


@dataclass(frozen=True)
class ValidationResult:
    valid: bool
    errors: list[str]
    registry_count: int


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def load_registry() -> list[dict[str, str]]:
    with REGISTRY_PATH.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def validate_registry() -> ValidationResult:
    rows = load_registry()
    errors: list[str] = []
    reel_ids = [row.get("reel_id", "") for row in rows]
    duplicate_keys = [row.get("duplicate_key", "") for row in rows]
    if len(reel_ids) != len(set(reel_ids)):
        errors.append("duplicate reel_id found")
    if any(not key for key in duplicate_keys):
        errors.append("empty duplicate_key found")
    if len(duplicate_keys) != len(set(duplicate_keys)):
        errors.append("duplicate topic-angle key found")
    for row in rows:
        if row.get("status") not in ALLOWED_TRANSITIONS:
            errors.append(f"unsupported status for reel {row.get('reel_id')}")
    status = load_json(STATUS_PATH)
    if status.get("target_reels") != 3000:
        errors.append("target_reels must remain 3000")
    return ValidationResult(not errors, errors, len(rows))


def transition(reel_id: str, target_status: str, reason: str | None) -> None:
    rows = load_registry()
    matching = [row for row in rows if row["reel_id"] == reel_id]
    if len(matching) != 1:
        raise ValueError(f"expected exactly one registry row for reel {reel_id}")
    row = matching[0]
    current_status = row["status"]
    if target_status not in ALLOWED_TRANSITIONS[current_status]:
        raise ValueError(f"invalid transition {current_status} -> {target_status}")
    row["status"] = target_status
    with REGISTRY_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
    progress = load_json(STATUS_PATH)
    progress["current_reel"] = reel_id
    progress["current_stage"] = target_status
    progress["last_updated"] = datetime.now(UTC).isoformat()
    save_json(STATUS_PATH, progress)
    if target_status in {"blocked", "failed"}:
        failures = load_json(FAILURES_PATH)
        failures["failures"].append(
            {
                "reel_id": reel_id,
                "status": target_status,
                "reason": reason or "unspecified",
                "recorded_at": datetime.now(UTC).isoformat(),
            }
        )
        save_json(FAILURES_PATH, failures)


def sync_queue() -> int:
    rows = load_registry()
    fieldnames = list(rows[0].keys())
    existing_ids = {row["reel_id"] for row in rows}
    existing_keys = {row["duplicate_key"] for row in rows}
    queue = load_json(QUEUE_PATH)
    additions: list[dict[str, str]] = []
    for entry in queue["entries"]:
        duplicate_key = "|".join([entry["category_id"], entry["subtopic"], entry["angle_template"], entry["primary_claim_slug"]])
        if entry["reel_id"] in existing_ids:
            continue
        if duplicate_key in existing_keys:
            raise ValueError(f"duplicate topic-angle key queued for reel {entry['reel_id']}")
        additions.append(
            {
                "reel_id": entry["reel_id"],
                "batch_id": queue["batch_id"],
                "category_id": entry["category_id"],
                "subtopic": entry["subtopic"],
                "angle_template": entry["angle_template"],
                "primary_claim_slug": entry["primary_claim_slug"],
                "status": "planned",
                "duplicate_key": duplicate_key,
                "created_at": datetime.now(UTC).isoformat(),
            }
        )
        existing_keys.add(duplicate_key)
    if additions:
        rows.extend(additions)
        with REGISTRY_PATH.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
    return len(additions)


def next_reel() -> dict[str, str] | None:
    queued = [row for row in load_registry() if row["status"] == "planned"]
    return sorted(queued, key=lambda row: int(row["reel_id"]))[0] if queued else None


def main() -> int:
    parser = argparse.ArgumentParser(description="Maintain the Hindi reel production tracker.")
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("validate")
    subparsers.add_parser("sync-queue")
    subparsers.add_parser("next-reel")
    transition_parser = subparsers.add_parser("transition")
    transition_parser.add_argument("--reel", required=True)
    transition_parser.add_argument("--to", required=True, choices=sorted(ALLOWED_TRANSITIONS))
    transition_parser.add_argument("--reason")
    args = parser.parse_args()
    if args.command == "validate":
        result = validate_registry()
        print(json.dumps({"valid": result.valid, "errors": result.errors, "registry_count": result.registry_count}))
        return 0 if result.valid else 1
    if args.command == "sync-queue":
        print(json.dumps({"added": sync_queue()}))
        return 0
    if args.command == "next-reel":
        print(json.dumps({"next_reel": next_reel()}))
        return 0
    transition(args.reel, args.to, args.reason)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
