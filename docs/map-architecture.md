# World War Z unified Nasdara map (2026-10-26)

## Source and deployment

The shared production renderer remains `assets/js/map/wwz-map.js` (Leaflet),
which is used by public links, Dashboard Map Explorer, zone/coordinate tools,
and the shop rental picker. Nasdara now uses a calibrated 4096x4096 satellite
covering the complete 16,384 x 16,384 metre world, yellow paved and muted dirt
native road segments, and on-demand building footprint drawing at close zoom.

The public source dataset is pinned to
`FeliciaDayZ/DayZ-Vehicle-Map@21d1b76847476a28c8a74cf2d8687e9c0e36c2e3`,
matching the server owner's provided ZIP. Import is validated against the
archive's three SHA-256 digests before being converted. The source describes
DayZ Badlands terrain imagery and geometry originally sourced from DayZed.GG.
The website build creates the optimized files in `assets/maps/nasdara/`;
source artwork and all 1,694 PNG model pictures are not copied into Git.

- `satellite.webp` — 4096px calibrated terrain (about 3.3 MB).
- `roads.bin` — 47,236 measured native X/Z segment pairs.
- `objects.bin`, `object-classes.json` — 295,195 native placements;
  approximately 18,000 Land-prefixed structure placements can be rendered
  on demand at zoom 4.75 and above. Small props, fences and poles are filtered.
- `labels.json` — 78 published 100m grid-centre location names. These are
  approximate by +/-50m on each axis, not surveyed building entrances.
- `preview.jpg` — a 1200px preview made from the satellite for link embeds.

Reproduce from the owner's source ZIP:
```
python3 -m pip install Pillow==12.0.0
python3 scripts/build_nasdara_assets.py --archive DayZ-Vehicle-Map-main.zip
python3 scripts/validate_nasdara_assets.py
node scripts/test_nasdara_satellite_integration.js
```

The GitHub Pages pipeline builds these assets automatically, without requiring
the owner to re-upload them through the website repository. The former
`nasdara/index.html` link now redirects to the shared map while preserving
query parameters and the rental picker's same-origin message contract.
No old paper-map imagery is used as fallback.

Chernarus and Livonia keep their existing tiles, roads, labels, settings,
and per-server data isolation. Server marker permissions remain in the
existing protected API and browser storage—not in the static map data.

## Limitations and accuracy

Terrain detail cannot exceed the source's 4096px native resolution. Building
drawings are simplified model outlines, not the entire original model-top PNG
picture set. Named settlements use grid-centres. Markers, rentals and zones
continue to use exact user-entered X/Z coordinates.
