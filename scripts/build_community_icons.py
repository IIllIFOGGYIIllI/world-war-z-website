#!/usr/bin/env python3
"""Build favicon, Apple, Android and PWA icons from the official Nasdara crest."""
from __future__ import annotations

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/branding/nasdara-community.webp"
ICON_DIR = ROOT / "assets/icons/pwa"
DARK = (11, 9, 9, 255)


def build() -> None:
    with Image.open(SOURCE) as original:
        logo = original.convert("RGBA")
    if logo.width != logo.height or logo.width < 512:
        raise ValueError("The community logo must be square and at least 512px.")
    ICON_DIR.mkdir(parents=True, exist_ok=True)

    def icon(size: int, *, scale: float = 1.0, opaque: bool = False) -> Image.Image:
        image = Image.new("RGBA", (size, size), DARK if opaque else (0, 0, 0, 0))
        art_size = round(size * scale)
        artwork = logo.resize((art_size, art_size), Image.Resampling.LANCZOS)
        inset = (size - art_size) // 2
        image.alpha_composite(artwork, dest=(inset, inset))
        return image

    icons = {
        ROOT / "assets/favicon.png": icon(64),
        ICON_DIR / "icon-192.png": icon(192),
        ICON_DIR / "icon-512.png": icon(512),
        ICON_DIR / "icon-maskable-192.png": icon(192, scale=0.72, opaque=True),
        ICON_DIR / "icon-maskable-512.png": icon(512, scale=0.72, opaque=True),
        ICON_DIR / "apple-touch-icon-180.png": icon(180, scale=0.82, opaque=True),
    }
    for path, artwork in icons.items():
        artwork.save(path, "PNG", optimize=True, compress_level=9)
        print(f"Nasdara icon: {path.relative_to(ROOT)} ({artwork.width}x{artwork.height})")


if __name__ == "__main__":
    build()
