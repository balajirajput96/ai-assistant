"""Create original text-free 9:16 motion-graphics source scenes for Reel 0004."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


WIDTH, HEIGHT = 720, 1280
ASSET_DIR = Path("/home/ubuntu/webdev-static-assets")


def canvas() -> Image.Image:
    image = Image.new("RGB", (WIDTH, HEIGHT))
    pixels = image.load()
    for y in range(HEIGHT):
        for x in range(WIDTH):
            radial = max(0.0, 1 - (((x - 370) / 490) ** 2 + ((y - 415) / 620) ** 2))
            r = int(15 + 26 * radial + 12 * y / HEIGHT)
            g = int(18 + 20 * radial + 5 * y / HEIGHT)
            b = int(54 + 76 * radial + 30 * y / HEIGHT)
            pixels[x, y] = (min(r, 255), min(g, 255), min(b, 255))
    return image.convert("RGBA")


def soft_glow(base: Image.Image, x: int, y: int, radius: int, colour: tuple[int, int, int], alpha: int = 105) -> None:
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(*colour, alpha))
    base.alpha_composite(overlay.filter(ImageFilter.GaussianBlur(radius // 2)))


def sparkles(draw: ImageDraw.ImageDraw, phase: int) -> None:
    for index in range(26):
        x = (index * 131 + phase * 73) % WIDTH
        y = 75 + ((index * 103 + phase * 37) % 960)
        radius = 1 + (index % 3)
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(220, 226, 255, 110))


def card(draw: ImageDraw.ImageDraw, x: int, y: int, colour: tuple[int, int, int], accent: tuple[int, int, int], compact: bool = False) -> None:
    w, h = (250, 142) if not compact else (178, 108)
    draw.rounded_rectangle((x + 9, y + 13, x + w + 9, y + h + 13), radius=30, fill=(0, 0, 0, 100))
    draw.rounded_rectangle((x, y, x + w, y + h), radius=30, fill=(*colour, 245), outline=(*accent, 220), width=3)
    draw.rounded_rectangle((x + 28, y + 26, x + w - 28, y + 45), radius=9, fill=(*accent, 220))
    draw.ellipse((x + 30, y + 66, x + 68, y + 104), fill=(*accent, 215))
    draw.rounded_rectangle((x + 88, y + 69, x + w - 30, y + 84), radius=7, fill=(249, 248, 255, 190))
    draw.rounded_rectangle((x + 88, y + 94, x + w - 78, y + 107), radius=6, fill=(249, 248, 255, 120))


def scene_question() -> Image.Image:
    image = canvas()
    draw = ImageDraw.Draw(image, "RGBA")
    sparkles(draw, 1)
    soft_glow(image, 360, 340, 220, (139, 104, 255), 125)
    draw.ellipse((244, 174, 476, 406), fill=(69, 53, 153, 245), outline=(199, 188, 255, 240), width=5)
    draw.arc((289, 220, 429, 336), 204, 348, fill=(255, 201, 91, 250), width=19)
    draw.ellipse((344, 346, 376, 378), fill=(255, 201, 91, 250))
    card(draw, 235, 524, (54, 48, 127), (198, 177, 255))
    draw.line((360, 410, 360, 522), fill=(191, 174, 255, 165), width=9)
    draw.rounded_rectangle((156, 920, 564, 988), radius=34, fill=(98, 75, 192, 75), outline=(199, 188, 255, 145), width=2)
    return image.convert("RGB")


def scene_feedback() -> Image.Image:
    image = canvas()
    draw = ImageDraw.Draw(image, "RGBA")
    sparkles(draw, 2)
    left = (104, 372)
    right = (366, 372)
    soft_glow(image, left[0] + 125, left[1] + 70, 110, (255, 183, 75), 70)
    soft_glow(image, right[0] + 125, right[1] + 70, 125, (74, 237, 204), 100)
    card(draw, *left, (128, 76, 47), (255, 188, 82))
    card(draw, *right, (27, 118, 120), (91, 239, 208))
    draw.line((left[0] + 250, left[1] + 72, right[0], right[1] + 72), fill=(255, 221, 153, 205), width=12)
    draw.polygon([(352, 424), (379, 404), (379, 444)], fill=(255, 221, 153, 225))
    draw.ellipse((459, 618, 559, 718), fill=(80, 231, 194, 225), outline=(218, 255, 240, 235), width=5)
    draw.line((484, 668, 515, 698), fill=(20, 84, 91, 255), width=11)
    draw.line((515, 698, 548, 642), fill=(20, 84, 91, 255), width=11)
    return image.convert("RGB")


def scene_routine() -> Image.Image:
    image = canvas()
    draw = ImageDraw.Draw(image, "RGBA")
    sparkles(draw, 3)
    nodes = [(360, 275, (255, 190, 78)), (195, 610, (198, 177, 255)), (525, 610, (85, 237, 205))]
    for x, y, colour in nodes:
        soft_glow(image, x, y, 105, colour, 90)
    draw.line((360, 350, 230, 542), fill=(216, 203, 255, 185), width=11)
    draw.line((230, 664, 490, 664), fill=(216, 245, 232, 185), width=11)
    draw.line((490, 542, 360, 350), fill=(216, 203, 255, 185), width=11)
    for x, y, colour in nodes:
        draw.ellipse((x - 70, y - 70, x + 70, y + 70), fill=(*colour, 235), outline=(246, 245, 255, 245), width=4)
        draw.ellipse((x - 23, y - 23, x + 23, y + 23), fill=(39, 30, 91, 235))
    draw.rounded_rectangle((129, 900, 591, 972), radius=35, fill=(107, 79, 200, 75), outline=(204, 188, 255, 145), width=2)
    return image.convert("RGB")


def scene_recall() -> Image.Image:
    image = canvas()
    draw = ImageDraw.Draw(image, "RGBA")
    sparkles(draw, 4)
    center = (360, 545)
    soft_glow(image, *center, 220, (72, 234, 207), 105)
    draw.arc((150, 332, 570, 752), 28, 322, fill=(100, 239, 212, 225), width=22)
    draw.polygon([(520, 359), (553, 392), (506, 399)], fill=(100, 239, 212, 235))
    draw.ellipse((center[0] - 100, center[1] - 100, center[0] + 100, center[1] + 100), fill=(39, 139, 142, 245), outline=(208, 255, 241, 240), width=5)
    draw.ellipse((center[0] - 32, center[1] - 32, center[0] + 32, center[1] + 32), fill=(255, 206, 91, 245))
    for angle in range(0, 360, 45):
        x = int(center[0] + math.cos(math.radians(angle)) * 158)
        y = int(center[1] + math.sin(math.radians(angle)) * 158)
        draw.ellipse((x - 9, y - 9, x + 9, y + 9), fill=(223, 255, 245, 220))
    return image.convert("RGB")


def main() -> None:
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    for index, scene in enumerate([scene_question(), scene_feedback(), scene_routine(), scene_recall()], start=1):
        scene.save(ASSET_DIR / f"reel0004_scene{index:02d}.png", optimize=True)


if __name__ == "__main__":
    main()
