"""Build exact top-down Nasdara building artwork from the pinned source archive.

Packs 1,694 source pictures into indexed, locally served WebP atlas pages.
Neither model placement nor picture orientation is inferred.
"""
import io
import json
import struct
from PIL import Image

PAGE = 2048
GAP = 2

def create_building_atlas(archive, prefix, objects, directory):
    models = struct.unpack_from("<I", objects, 12)[0]
    if models != 1697:
        raise ValueError("Unexpected Nasdara building class count")
    picture_root = prefix + "data/objects/nasdara/pictures/"
    records = []
    for model in range(models):
        off = 28 + model * 60
        flags, width, height = struct.unpack_from("<III", objects, off + 8)
        if not flags & 4:
            continue
        if not (0 < width <= 1024 and 0 < height <= 1024):
            raise ValueError("Invalid Nasdara building picture dimensions")
        path = picture_root + f"{model:04d}.png"
        raw = archive.read(path)
        with Image.open(io.BytesIO(raw)) as image:
            if image.size != (width, height):
                raise ValueError(f"Invalid image size for model {model}")
        records.append((model, width, height, raw))

    records.sort(key=lambda row: (-row[2], -row[1], row[0]))
    pages = []
    sprites = {}
    page = Image.new("RGBA", (PAGE, PAGE), (0, 0, 0, 0))
    x = y = row_height = 0
    for model, width, height, raw in records:
        if x + width + GAP > PAGE:
            x = 0
            y += row_height
            row_height = 0
        if y + height + GAP > PAGE:
            pages.append(page)
            page = Image.new("RGBA", (PAGE, PAGE), (0, 0, 0, 0))
            x = y = row_height = 0
        if width + GAP > PAGE or height + GAP > PAGE:
            raise ValueError("Source picture exceeds sprite sheet size")
        with Image.open(io.BytesIO(raw)) as image:
            page.paste(image.convert("RGBA"), (x, y))
        sprites[str(model)] = [len(pages), x, y, width, height]
        x += width + GAP
        row_height = max(row_height, height + GAP)
    pages.append(page)

    page_names = []
    for index, atlas in enumerate(pages):
        name = f"buildings-{index:02d}.webp"
        page_names.append(name)
        atlas.save(directory / name, "WEBP", quality=88, method=4)

    metadata = {
        "version": 1,
        "source": "pinned DayZ-Vehicle-Map model pictures",
        "pageSize": PAGE,
        "pages": page_names,
        "count": len(sprites),
        "sprites": sprites,
    }
    (directory / "building-atlas.json").write_text(
        json.dumps(metadata, separators=(",", ":")), encoding="utf-8"
    )
    return {
        "pictures": len(sprites),
        "pages": len(pages),
        "bytes": sum((directory / name).stat().st_size for name in page_names),
    }
