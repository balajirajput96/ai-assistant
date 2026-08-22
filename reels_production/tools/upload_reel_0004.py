"""Idempotently deliver the QC-passed Reel 0004 artifact set to its Drive batch folder."""

from __future__ import annotations

import json
import mimetypes
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REEL_DIR = ROOT / "reels" / "Reel_0004_generation_effect"
DRIVE_STATE = ROOT / "progress" / "drive_structure.json"
UPLOAD_RECORD = REEL_DIR / "drive_upload.json"
FOLDER_MIME = "application/vnd.google-apps.folder"


def gws(*args: str) -> dict:
    completed = subprocess.run(["gws", *args], check=True, text=True, capture_output=True)
    return json.loads(completed.stdout)


def find_named(name: str, parent_id: str) -> str | None:
    query = f"name = '{name}' and '{parent_id}' in parents and trashed = false"
    response = gws("drive", "files", "list", "--params", json.dumps({"q": query, "pageSize": 10, "fields": "files(id,name,mimeType,size)"}))
    files = response.get("files", [])
    return files[0]["id"] if files else None


def ensure_folder(name: str, parent_id: str) -> str:
    existing = find_named(name, parent_id)
    if existing:
        return existing
    created = gws("drive", "files", "create", "--json", json.dumps({"name": name, "mimeType": FOLDER_MIME, "parents": [parent_id]}))
    return created["id"]


def upload_once(path: Path, parent_id: str) -> str:
    existing = find_named(path.name, parent_id)
    if existing:
        return existing
    if not path.is_file():
        raise FileNotFoundError(f"Missing local artifact that is not already present in Drive: {path}")
    mime_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    uploaded = gws("drive", "files", "create", "--upload", str(path), "--upload-content-type", mime_type, "--json", json.dumps({"name": path.name, "parents": [parent_id]}))
    return uploaded["id"]


def main() -> int:
    drive_state = json.loads(DRIVE_STATE.read_text(encoding="utf-8"))
    batch_id = drive_state["batches"]["Batch_001"]
    reel_folder_id = ensure_folder("Reel_0004_generation_effect", batch_id)
    artifacts = [
        REEL_DIR / "reel_0004.mp4",
        REEL_DIR / "narration_hi.wav",
        REEL_DIR / "script_hi.txt",
        REEL_DIR / "captions_hi.srt",
        REEL_DIR / "sources.json",
        REEL_DIR / "research_notes.md",
        REEL_DIR / "visual_brief.md",
        REEL_DIR / "generate_visuals.py",
        REEL_DIR / "reel_metadata.json",
        REEL_DIR / "qc.json",
        REEL_DIR / "delivery_verification.json",
    ]
    record = {
        "root_folder_id": drive_state["root_folder_id"],
        "batch_folder_id": batch_id,
        "reel_folder_id": reel_folder_id,
        "files": {path.name: upload_once(path, reel_folder_id) for path in artifacts},
        "status": "uploaded",
    }
    UPLOAD_RECORD.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(record, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
