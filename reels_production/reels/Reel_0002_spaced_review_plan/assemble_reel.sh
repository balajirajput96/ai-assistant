set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ASSET_DIR="/home/ubuntu/webdev-static-assets"
OUT="$ROOT/reel_0002.mp4"
WORK_DIR="$ROOT/render_work"

rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR"

if [[ ! -s "$ASSET_DIR/reel0002_scene01.png" ]]; then
  echo "Missing completed AI reference visual: $ASSET_DIR/reel0002_scene01.png" >&2
  exit 1
fi

# Visual generation quota was exhausted after Scene 01 completed. Use four deliberate
# crops and colour grades of the completed high-resolution source rather than claiming
# that separate missing AI scenes exist. The final reel remains a captioned cinematic
# motion-visual production with its limitation documented in reel_metadata.json.
filters=(
  "scale=840:1493,crop=720:1280:60:120,eq=saturation=1.03:brightness=0.00,format=yuv420p"
  "scale=840:1493,crop=720:1280:0:20,eq=saturation=1.18:brightness=0.025:gamma=1.03,format=yuv420p"
  "scale=840:1493,crop=720:1280:120:60,hue=h=12:s=1.18,colorbalance=bs=.10,format=yuv420p"
  "scale=840:1493,crop=720:1280:60:210,eq=saturation=1.12:brightness=0.055:gamma=1.06,format=yuv420p"
)
for index in "${!filters[@]}"; do
  clip="$WORK_DIR/scene_$index.mp4"
  ffmpeg -y -threads 1 -loop 1 -t 13.70 -i "$ASSET_DIR/reel0002_scene01.png" \
    -vf "${filters[$index]}" \
    -r 25 -c:v libx264 -preset veryfast -crf 22 -an "$clip"
done

printf "file '%s'\n" "$WORK_DIR/scene_0.mp4" "$WORK_DIR/scene_1.mp4" "$WORK_DIR/scene_2.mp4" "$WORK_DIR/scene_3.mp4" > "$WORK_DIR/concat.txt"
ffmpeg -y -threads 1 -f concat -safe 0 -i "$WORK_DIR/concat.txt" -i "$ROOT/narration_hi.wav" \
  -vf "subtitles='$ROOT/captions_hi.srt':force_style='FontName=Noto Sans Devanagari,FontSize=18,Alignment=2,MarginV=86,PrimaryColour=&H00FFFFFF&,OutlineColour=&H96000000&,BorderStyle=1,Outline=2,Shadow=0'" \
  -map 0:v:0 -map 1:a:0 -shortest -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p \
  -c:a aac -b:a 144k -movflags +faststart "$OUT"

rm -rf "$WORK_DIR"
echo "$OUT"
