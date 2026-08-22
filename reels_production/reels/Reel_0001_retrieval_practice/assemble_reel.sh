#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ASSET_DIR="/home/ubuntu/webdev-static-assets"
OUT="$ROOT/reel_0001.mp4"
WORK_DIR="$ROOT/render_work"

rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR"

for scene in reel0001_scene01.png reel0001_scene02.png reel0001_scene03.png reel0001_scene04.png; do
  if [[ ! -s "$ASSET_DIR/$scene" ]]; then
    echo "Missing generated visual: $ASSET_DIR/$scene" >&2
    exit 1
  fi
done

scenes=(reel0001_scene01.png reel0001_scene02.png reel0001_scene03.png reel0001_scene04.png)
for index in "${!scenes[@]}"; do
  clip="$WORK_DIR/scene_$index.mp4"
  ffmpeg -y -threads 1 -loop 1 -t 13.04 -i "$ASSET_DIR/${scenes[$index]}" \
    -vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,format=yuv420p" \
    -r 25 -c:v libx264 -preset veryfast -crf 22 -an "$clip"
done

printf "file '%s'\n" "$WORK_DIR/scene_0.mp4" "$WORK_DIR/scene_1.mp4" "$WORK_DIR/scene_2.mp4" "$WORK_DIR/scene_3.mp4" > "$WORK_DIR/concat.txt"
ffmpeg -y -threads 1 -f concat -safe 0 -i "$WORK_DIR/concat.txt" -i "$ROOT/narration_hi.wav" \
  -vf "subtitles='$ROOT/captions_hi.srt':force_style='FontName=Noto Sans Devanagari,FontSize=18,Alignment=2,MarginV=86,PrimaryColour=&H00FFFFFF&,OutlineColour=&H96000000&,BorderStyle=1,Outline=2,Shadow=0'" \
  -map 0:v:0 -map 1:a:0 -shortest -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p \
  -c:a aac -b:a 144k -movflags +faststart "$OUT"

rm -rf "$WORK_DIR"

echo "$OUT"
