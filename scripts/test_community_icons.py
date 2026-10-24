#!/usr/bin/env python3
"""Verify generated installed-app icons match the canonical Nasdara logo."""
from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/branding/nasdara-community.webp"


def check() -> None:
    with Image.open(SOURCE) as source:
        crest = source.convert("RGBA")
    targets = {
        "assets/favicon.png": (64, False),
        "assets/icons/pwa/icon-192.png": (192, False),
        "assets/icons/pwa/icon-512.png": (512, False),
        "assets/icons/pwa/icon-maskable-192.png": (192, True),
        "assets/icons/pwa/icon-maskable-512.png": (512, True),
        "assets/icons/pwa/apple-touch-icon-180.png": (180, True),
    }
    for path, (size, opaque) in targets.items():
        with Image.open(ROOT / path) as source:
            icon = source.convert("RGBA")
            assert source.format == "PNG", f"{path}: expected PNG"
        assert icon.size == (size, size), f"{path}: dimensions"
        assert icon.getpixel((0, 0))[3] == (255 if opaque else 0), f"{path}: border"
        assert icon.getchannel("A").getextrema()[1] == 255, f"{path}: crest missing"
        if not opaque:
            wanted = crest.resize((size, size), Image.Resampling.LANCZOS).getchannel("A")
            assert ImageChops.difference(icon.getchannel("A"), wanted).getbbox() is None, f"{path}: wrong logo"
    print("PASS: Nasdara community logo used for all installable app icons")


if __name__ == "__main__":
    check()
