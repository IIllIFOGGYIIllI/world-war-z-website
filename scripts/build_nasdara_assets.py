#!/usr/bin/env python3
"""Build the calibrated Nasdara website assets from a pinned published source.

Inputs are verified against the archive supplied by the WWZ server owner.
Without --archive, fetches the same upstream files during GitHub Pages builds.
Does NOT alter the Chernarus/Livonia map datasets.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path
import struct
import urllib.request
import zipfile
from PIL import Image

PIN = "21d1b76847476a28c8a74cf2d8687e9c0e36c2e3"
ROOT = "DayZ-Vehicle-Map-main/"
BASE = f"https://raw.githubusercontent.com/FeliciaDayZ/DayZ-Vehicle-Map/{PIN}/"
FILES = {
    "data/maps/nasdara.png": ("61b1cba60c21d86f9654503476aaa5e4611457aa960a8aefe5bd3a25af8aa4ed", 33098672),
    "data/roads/nasdara.roads": ("4f1e24b66a9a9a848a1aedf37dfbe79f849026938ad4384d1c082e7447b5fd4b", 944736),
    "data/objects/nasdara/nasdara.objects": ("f81eeb63ed5f0adff669d85a2e1cc82fde58dea4ba26001988988913290c8070", 6184164),
}
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--archive", type=Path, help="local DayZ-Vehicle-Map-main.zip")
    ap.add_argument("--out", type=Path, default=Path("assets/maps/nasdara"))
    args = ap.parse_args()
    archive = zipfile.ZipFile(args.archive) if args.archive else None
    def read(path):
        if archive:
            # No zip extraction, path traversal or executable files involved.
            value = archive.read(ROOT + path)
        else:
            req = urllib.request.Request(BASE + path, headers={"User-Agent":"WWZ-Nasdara-Asset-Build/1.0"})
            with urllib.request.urlopen(req, timeout=120) as response:
                value = response.read()
        if path in FILES:
            digest,length=FILES[path]
            if len(value)!=length or hashlib.sha256(value).hexdigest()!=digest:
                raise ValueError(f"Nasdara source file changed unexpectedly: {path}")
        return value
    satellite=read("data/maps/nasdara.png")
    roads=read("data/roads/nasdara.roads")
    objects=read("data/objects/nasdara/nasdara.objects")
    source=json.loads(read("data/objects/nasdara/source.json"))
    im=Image.open(io.BytesIO(satellite))
    if im.size!=(4096,4096) or im.mode!="RGB":
        raise ValueError("Nasdara image is not a 4096x4096 RGB north-up satellite")
    if roads[:8]!=b"DVMROAD1" or struct.unpack_from("<I",roads,8)[0]!=47236:
        raise ValueError("Wrong Nasdara road binary")
    if objects[:8]!=b"DVMOBJ1"+bytes([0]):
        raise ValueError("Wrong Nasdara objects binary")
    if struct.unpack_from("<I",objects,16)[0]!=295195:
        raise ValueError("Wrong Nasdara static placement count")
    if len(source.get("classes",[]))!=1697:
        raise ValueError("Wrong source class identifiers")
    args.out.mkdir(parents=True,exist_ok=True)
    im.save(args.out/"satellite.webp", "WEBP", quality=82, method=4)
    # Social-card preview is derived from the same north-up satellite image.
    im.resize((1200,1200),Image.Resampling.LANCZOS).save(args.out/"preview.jpg","JPEG",quality=86,optimize=True)
    (args.out/"roads.bin").write_bytes(roads)
    (args.out/"objects.bin").write_bytes(objects)
    # Class labels allow showing buildings while excluding hundreds of thousands
    # of fences, poles and loose debris from expensive mobile rendering.
    (args.out/"object-classes.json").write_text(json.dumps(source["classes"],separators=(",",":")),encoding="utf-8")
    (args.out/"source.json").write_text(json.dumps({
        "world":"Nasdara", "extent":16384, "imageSize":4096,
        "roadSegments":47236, "objectPlacements":295195,
        "upstream":"https://github.com/FeliciaDayZ/DayZ-Vehicle-Map",
        "upstreamCommit":PIN,
        "imageryOrigin":"DayZ Badlands terrain imagery as described in source calibration",
        "coordinateSystem":"DayZ X/Z metres; origin south-west; north-up",
    },indent=2)+chr(10),encoding="utf-8")
    print("Nasdara built:",[(p.name,p.stat().st_size) for p in sorted(args.out.iterdir())])
if __name__=="__main__":main()
