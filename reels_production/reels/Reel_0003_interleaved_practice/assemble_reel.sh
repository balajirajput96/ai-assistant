set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ASSET_DIR="/home/ubuntu/webdev-static-assets"
OUT="$ROOT/reel_0003.mp4"
WORK_DIR="$ROOT/render_work"

rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR"

python3 "$ROOT/generate_visuals.py"
for scene in reel0003_scene01.png reel0003_scene02.png reel0003_scene03.png reel0003_scene04.png; do
  if [[ ! -s "$ASSET_DIR/$scene" ]]; then
    echo "Missing motion-graphics source: $ASSET_DIR/$scene" >&2
    exit 1
  fi
done

AUDIO_DURATION="$(ffprobe -v error -show_entries format=duration -of default=nokey=1:noprint_wrappers=1 "$ROOT/narration_hi.wav")"
CLIP_DURATION="$(echo "scale=3; $AUDIO_DURATION / 4" | bc)"
scenes=(reel0003_scene01.png reel0003_scene02.png reel0003_scene03.png reel0003_scene04.png)
filters=(
  "zoompan=z='min(zoom+0.00013,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=720x1280:fps=25,format=yuv420p"
  "zoompan=z='min(zoom+0.00012,1.11)':x='iw/2-(iw/zoom/2)+sin(on/26)*16':y='ih/2-(ih/zoom/2)':d=1:s=720x1280:fps=25,format=yuv420p"
  "zoompan=z='min(zoom+0.00015,1.14)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)+cos(on/30)*14':d=1:s=720x1280:fps=25,format=yuv420p"
  "zoompan=z='min(zoom+0.00011,1.10)':x='iw/2-(iw/zoom/2)+sin(on/28)*12':y='ih/2-(ih/zoom/2)':d=1:s=720x1280:fps=25,format=yuv420p"
)
for index in "${!scenes[@]}"; do
  clip="$WORK_DIR/scene_$index.mp4"
  ffmpeg -y -threads 1 -loop 1 -t "$CLIP_DURATION" -i "$ASSET_DIR/${scenes[$index]}" \
    -vf "${filters[$index]}" -r 25 -c:v libx264 -preset veryfast -crf 22 -an "$clip"
done

printf "file '%s'\n" "$WORK_DIR/scene_0.mp4" "$WORK_DIR/scene_1.mp4" "$WORK_DIR/scene_2.mp4" "$WORK_DIR/scene_3.mp4" > "$WORK_DIR/concat.txt"
ffmpeg -y -threads 1 -f concat -safe 0 -i "$WORK_DIR/concat.txt" -i "$ROOT/narration_hi.wav" \
  -vf "subtitles='$ROOT/captions_hi.srt':force_style='FontName=Noto Sans Devanagari,FontSize=18,Alignment=2,MarginV=86,PrimaryColour=&H00FFFFFF&,OutlineColour=&H96000000&,BorderStyle=1,Outline=2,Shadow=0'" \
  -map 0:v:0 -map 1:a:0 -shortest -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p \
  -c:a aac -b:a 144k -movflags +faststart "$OUT"

rm -rf "$WORK_DIR"
echo "$OUT"
