"""Create one bounded, read-only engineering continuation record.

The script intentionally does not commit, push, deploy, mutate application code,
open issues, or call external services. GitHub Actions uses its JSON output as
evidence for a reviewable scheduled maintenance cycle.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Sequence


MAX_CYCLES = 2400


@dataclass(frozen=True)
class CheckResult:
    name: str
    command: list[str]
    exit_code: int
    output_tail: str


def run_check(name: str, command: Sequence[str]) -> CheckResult:
    completed = subprocess.run(
        list(command),
        check=False,
        capture_output=True,
        text=True,
        timeout=180,
    )
    output = (completed.stdout + completed.stderr).strip()
    return CheckResult(
        name=name,
        command=list(command),
        exit_code=completed.returncode,
        output_tail=output[-2000:],
    )


def build_record(cycle: int, checks: Sequence[CheckResult], source_sha: str | None) -> dict[str, object]:
    successful = all(check.exit_code == 0 for check in checks)
    return {
        "schema_version": 1,
        "cycle": cycle,
        "cycle_limit": MAX_CYCLES,
        "status": "passed" if successful else "needs_review",
        "source_sha": source_sha or "unknown",
        "generated_at": datetime.now(UTC).isoformat(),
        "mutation_policy": "read_only_validation",
        "checks": [asdict(check) for check in checks],
        "next_action": "continue_on_next_schedule" if successful else "review_failed_checks_before_any_repair",
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run one bounded continuation validation cycle.")
    parser.add_argument("--cycle", type=int, required=True, help="The GitHub Actions workflow run number.")
    parser.add_argument("--output", type=Path, required=True, help="Path for the JSON cycle record.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.cycle < 1 or args.cycle > MAX_CYCLES:
        raise SystemExit(f"cycle must be between 1 and {MAX_CYCLES}")

    checks = [
        run_check("unit_tests", ["pnpm", "test", "--", "--maxWorkers=1", "--minWorkers=1"]),
        run_check("typecheck", ["pnpm", "check"]),
    ]
    record = build_record(args.cycle, checks, os.environ.get("GITHUB_SHA"))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(record, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return 0 if record["status"] == "passed" else 1


if __name__ == "__main__":
    raise SystemExit(main())
