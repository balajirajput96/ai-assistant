from pathlib import Path

from PIL import Image


ASSET_DIR = Path(__file__).resolve().parents[1] / "assets" / "images"
ASSETS = [
    "icon.png",
    "splash-icon.png",
    "favicon.png",
    "android-icon-foreground.png",
]


def main() -> None:
    for name in ASSETS:
        target = ASSET_DIR / name
        with Image.open(target) as image:
            resized = image.convert("RGBA")
            resized.thumbnail((768, 768), Image.Resampling.LANCZOS)
            resized.save(target, format="PNG", optimize=True, compress_level=9)
        print(f"{name}: {target.stat().st_size} bytes")


if __name__ == "__main__":
    main()
