#!/usr/bin/env python3
"""Verify generated WWZ Nasdara deployment assets and native world alignment."""
from pathlib import Path
from PIL import Image
import json,struct
p=Path("assets/maps/nasdara")
sat=p/"satellite.webp"
assert sat.is_file() and sat.stat().st_size>2_000_000,"Nasdara satellite missing"
with Image.open(sat) as image:assert image.size==(4096,4096),"Satellite is not 4096x4096"
with Image.open(p/"preview.jpg") as image:assert image.size==(1200,1200),"Preview is missing"
r=(p/"roads.bin").read_bytes()
assert r[:8]==b"DVMROAD1" and len(r)==16+47236*20
assert struct.unpack_from("<I",r,8)[0]==47236
assert struct.unpack_from("<f",r,12)[0]==16384.0
b=(p/"objects.bin").read_bytes()
assert b[:7]==b"DVMOBJ1" and b[7]==0 and len(b)==6184164
assert struct.unpack_from("<fIIII",b,8)==(16384.,1697,295195,2173,20129)
names=json.loads((p/"object-classes.json").read_text())
assert len(names)==1697 and sum(1 for n in names if n.startswith("Land_"))>400
labels=json.loads((p/"labels.json").read_text())
assert labels["worldSize"]==16384 and labels["labelCount"]==78
assert len(labels["labels"])==78 and all(0<=p["x"]<=16384 and 0<=p["z"]<=16384 for p in labels["labels"])
assert not any(x.name.lower().endswith("paper_map.webp") for x in p.iterdir())
print("PASS: 4096px satellite, source-aligned 47,236 roads, 295,195 placements, 78 names")
