"""Create and record the authorized Drive hierarchy for the Hindi reel project.

The tool is idempotent: it first searches for each named folder under its expected
parent and creates only missing folders. It does not delete, overwrite, or share files.
"""

from __future__ import annotations

import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
STATE_PATH = ROOT / "progress" / "drive_structure.json"
FOLDER_MIME = "application/vnd.google-apps.folder"


def gws(*args: str) -> dict:
    completed = subprocess.run(["gws", *args], check=True, text=True, capture_output=True)
    return json.loads(completed.stdout)


def find_folder(name: str, parent_id: str | None = None) -> str | None:
    query = f"name = '{name}' and mimeType = '{FOLDER_MIME}' and trashed = false"
    if parent_id:
        query += f" and '{parent_id}' in parents"
    response = gws("drive", "files", "list", "--params", json.dumps({"q": query, "pageSize": 10, "fields": "files(id,name,parents)"}))
    files = response.get("files", [])
    return files[0]["id"] if files else None


def create_folder(name: str, parent_id: str | None = None) -> str:
    payload: dict[str, object] = {"name": name, "mimeType": FOLDER_MIME}
    if parent_id:
        payload["parents"] = [parent_id]
    response = gws("drive", "files", "create", "--json", json.dumps(payload))
    return response["id"]


def ensure_folder(name: str, parent_id: str | None = None) -> str:
    return find_folder(name, parent_id) or create_folder(name, parent_id)


def main() -> int:
    root_id = ensure_folder("3000_HINDI_RESEARCH_REELS")
    batches = {f"Batch_{index:03d}": ensure_folder(f"Batch_{index:03d}", root_id) for index in range(1, 101)}
    STATE_PATH.write_text(json.dumps({"root_folder_id": root_id, "batches": batches}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"root_folder_id": root_id, "batch_count": len(batches)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
