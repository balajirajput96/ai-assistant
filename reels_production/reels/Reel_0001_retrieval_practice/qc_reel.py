"""Deterministic media and metadata checks for Reel 0001."""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent
VIDEO = ROOT / "reel_0001.mp4"
CAPTIONS = ROOT / "captions_hi.srt"
SOURCES = ROOT / "sources.json"


def probe(path: Path) -> dict:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height", "-of", "json", str(path)],
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


def srt_end_seconds(srt_text: str) -> float:
    matches = re.findall(r"-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})", srt_text)
    if not matches:
        raise ValueError("no subtitle timing found")
    hours, minutes, seconds, milliseconds = matches[-1]
    return int(hours) * 3600 + int(minutes) * 60 + int(seconds) + int(milliseconds) / 1000


def main() -> int:
    checks: dict[str, object] = {}
    checks["sources_json_valid"] = bool(json.loads(SOURCES.read_text(encoding="utf-8"))["sources"])
    caption_text = CAPTIONS.read_text(encoding="utf-8")
    checks["captions_present"] = "Retrieval practice" in caption_text and "00:00:52,000" in caption_text
    if not VIDEO.exists():
        checks["video_exists"] = False
        (ROOT / "qc.json").write_text(json.dumps({"status": "failed", "checks": checks}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        return 1
    info = probe(VIDEO)
    video_stream = next(stream for stream in info["streams"] if stream["codec_type"] == "video")
    duration = float(info["format"]["duration"])
    checks["video_exists"] = True
    checks["vertical_9_16"] = video_stream["width"] * 16 == video_stream["height"] * 9
    checks["minimum_delivery_resolution"] = video_stream["width"] >= 720 and video_stream["height"] >= 1280
    checks["duration_seconds"] = round(duration, 2)
    checks["duration_target"] = 50 <= duration <= 65
    checks["captions_within_video"] = srt_end_seconds(caption_text) <= duration + 0.01
    checks["audio_stream_present"] = any(stream["codec_type"] == "audio" for stream in info["streams"])
    status = "passed" if all(value is True for key, value in checks.items() if key not in {"duration_seconds"}) else "failed"
    (ROOT / "qc.json").write_text(json.dumps({"status": status, "checks": checks}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return 0 if status == "passed" else 1


if __name__ == "__main__":
    raise SystemExit(main())
