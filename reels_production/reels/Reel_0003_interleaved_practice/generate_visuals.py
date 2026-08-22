"""Create original, text-free vertical motion-graphics source scenes for Reel 0003."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


WIDTH, HEIGHT = 720, 1280
ASSET_DIR = Path("/home/ubuntu/webdev-static-assets")


def background() -> Image.Image:
    image = Image.new("RGB", (WIDTH, HEIGHT))
    pixels = image.load()
    for y in range(HEIGHT):
        t = y / (HEIGHT - 1)
        r = int(10 + 10 * t)
        g = int(26 + 23 * t)
        b = int(53 + 38 * t)
        for x in range(WIDTH):
            glow = max(0.0, 1 - (((x - 505) / 430) ** 2 + ((y - 280) / 410) ** 2))
            pixels[x, y] = (min(255, int(r + 4 * glow)), min(255, int(g + 30 * glow)), min(255, int(b + 42 * glow)))
    return image.convert("RGBA")


def glow_circle(base: Image.Image, xy: tuple[int, int], radius: int, colour: tuple[int, int, int], alpha: int = 120) -> None:
    glow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)
    x, y = xy
    draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(*colour, alpha))
    base.alpha_composite(glow.filter(ImageFilter.GaussianBlur(radius // 2)))


def card(draw: ImageDraw.ImageDraw, x: int, y: int, colour: tuple[int, int, int], accent: tuple[int, int, int], tilt: int = 0) -> None:
    w, h = 220, 128
    shadow = (x + 8, y + 12, x + w + 8, y + h + 12)
    draw.rounded_rectangle(shadow, radius=26, fill=(0, 0, 0, 95))
    draw.rounded_rectangle((x, y, x + w, y + h), radius=26, fill=(*colour, 245), outline=(*accent, 210), width=3)
    draw.rounded_rectangle((x + 24, y + 26, x + w - 24, y + 42), radius=8, fill=(*accent, 210))
    draw.ellipse((x + 28, y + 63, x + 61, y + 96), fill=(*accent, 210))
    draw.rounded_rectangle((x + 79, y + 67, x + w - 27, y + 82), radius=7, fill=(245, 249, 255, 175))
    draw.rounded_rectangle((x + 79, y + 91, x + w - 72, y + 103), radius=6, fill=(245, 249, 255, 120))


def add_dust(draw: ImageDraw.ImageDraw, phase: int) -> None:
    for idx in range(22):
        x = (idx * 89 + phase * 31) % WIDTH
        y = 85 + ((idx * 151 + phase * 59) % 890)
        radius = 2 + (idx % 3)
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(178, 231, 246, 85))


def scene_blocked() -> Image.Image:
    image = background()
    glow_circle(image, (365, 355), 210, (33, 173, 201), 90)
    draw = ImageDraw.Draw(image, "RGBA")
    add_dust(draw, 1)
    draw.line((360, 175, 360, 862), fill=(91, 219, 230, 145), width=12)
    for y in (210, 390, 570, 750):
        glow_circle(image, (360, y + 60), 85, (45, 190, 215), 45)
        card(draw, 250, y, (21, 83, 133), (75, 220, 234))
    draw.rounded_rectangle((164, 975, 556, 1034), radius=29, fill=(37, 129, 159, 100), outline=(104, 223, 235, 155), width=2)
    return image.convert("RGB")


def scene_interleaved() -> Image.Image:
    image = background()
    glow_circle(image, (348, 410), 280, (42, 171, 188), 80)
    draw = ImageDraw.Draw(image, "RGBA")
    add_dust(draw, 2)
    points = [(195, 245), (420, 355), (155, 507), (412, 642), (205, 785), (430, 895)]
    colours = [((26, 102, 148), (76, 226, 236)), ((163, 93, 32), (255, 196, 84)), ((145, 49, 77), (255, 125, 145))]
    for index, (x, y) in enumerate(points):
        if index:
            px, py = points[index - 1]
            draw.line((px + 110, py + 64, x + 110, y + 64), fill=(178, 232, 236, 130), width=8)
            draw.ellipse((x + 102, y + 56, x + 118, y + 72), fill=(245, 254, 255, 210))
        colour, accent = colours[index % 3]
        glow_circle(image, (x + 110, y + 64), 95, accent, 36)
        card(draw, x, y, colour, accent)
    return image.convert("RGB")


def scene_decision() -> Image.Image:
    image = background()
    draw = ImageDraw.Draw(image, "RGBA")
    add_dust(draw, 3)
    hub = (360, 570)
    for angle, colour in zip((205, 260, 320, 40, 100, 145), ((75, 220, 234), (255, 196, 84), (255, 125, 145), (113, 229, 180), (75, 220, 234), (255, 196, 84))):
        end_x = int(hub[0] + math.cos(math.radians(angle)) * 285)
        end_y = int(hub[1] + math.sin(math.radians(angle)) * 350)
        draw.line((end_x, end_y, hub[0], hub[1]), fill=(*colour, 150), width=11)
        draw.ellipse((end_x - 18, end_y - 18, end_x + 18, end_y + 18), fill=(*colour, 235))
        glow_circle(image, (end_x, end_y), 58, colour, 45)
    glow_circle(image, hub, 135, (255, 209, 109), 160)
    draw.ellipse((hub[0] - 66, hub[1] - 66, hub[0] + 66, hub[1] + 66), fill=(255, 190, 71, 245), outline=(255, 244, 198, 255), width=5)
    draw.ellipse((hub[0] - 21, hub[1] - 21, hub[0] + 21, hub[1] + 21), fill=(21, 60, 103, 240))
    draw.rounded_rectangle((149, 920, 571, 996), radius=32, fill=(245, 188, 79, 70), outline=(255, 229, 159, 150), width=2)
    return image.convert("RGB")


def scene_plan() -> Image.Image:
    image = background()
    draw = ImageDraw.Draw(image, "RGBA")
    add_dust(draw, 4)
    palette = [((26, 102, 148), (76, 226, 236)), ((163, 93, 32), (255, 196, 84)), ((145, 49, 77), (255, 125, 145))]
    positions = [(118, 230), (382, 230), (118, 440), (382, 440), (118, 650), (382, 650)]
    for index, (x, y) in enumerate(positions):
        colour, accent = palette[index % 3]
        glow_circle(image, (x + 110, y + 64), 85, accent, 32)
        card(draw, x, y, colour, accent)
    draw.line((180, 938, 540, 938), fill=(132, 238, 214, 155), width=8)
    for x, colour in zip((180, 360, 540), ((76, 226, 236), (255, 196, 84), (255, 125, 145))):
        draw.ellipse((x - 16, 922, x + 16, 954), fill=(*colour, 245))
    return image.convert("RGB")


def main() -> None:
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    scenes = [scene_blocked(), scene_interleaved(), scene_decision(), scene_plan()]
    for index, scene in enumerate(scenes, start=1):
        scene.save(ASSET_DIR / f"reel0003_scene{index:02d}.png", optimize=True)


if __name__ == "__main__":
    main()
