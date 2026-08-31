#!/usr/bin/env python3
"""Build a clean Capacitor web directory from the canonical static site."""
from __future__ import annotations

from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "www"
EXCLUDED_TOP_LEVEL = {
    ".git", ".github", "android", "ios", "node_modules", "www", "scripts",
    "package-lock.json", "package.json", "capacitor.config.json",
    "PATCH_FILE_LIST.txt", "PATCH_NOTES.md", "DELETE_THESE_FILES.txt",
}
EXCLUDED_SUFFIXES = {".pyc"}


def ignored(directory: str, entries: list[str]) -> set[str]:
    base = Path(directory)
    result: set[str] = set()
    for entry in entries:
        candidate = base / entry
        if base == ROOT and entry in EXCLUDED_TOP_LEVEL:
            result.add(entry)
        elif entry == "__pycache__" or candidate.suffix in EXCLUDED_SUFFIXES:
            result.add(entry)
    return result


def main() -> None:
    if DEST.exists():
        shutil.rmtree(DEST)
    shutil.copytree(ROOT, DEST, ignore=ignored)
    print(f"Prepared Capacitor web assets in {DEST}")


if __name__ == "__main__":
    main()
