# World War Z unified Nasdara map (2026-10-27)

## Detailed source building artwork (v1.29)

The Nasdara website now includes all **1,694 original top-down model pictures**
from the server owner's matching pinned DayZ-Vehicle-Map source archive.
The Pages builder downloads one immutable pinned archive and creates three
locally-hosted sprite sheets and a per-model index under
`assets/maps/nasdara/`. The original 6.18 MB object placement binary is used
unaltered.

The map renderer reads **295,195 native placements**, their true world X/Z,
model rotations, scales and original six-component picture transforms.
Instead of default building placeholders:

- From Leaflet zoom **3.1**, meaningful buildings show their real source
  outline footprints; very small objects stay hidden at overview zoom.
- From zoom **4.8**, buildings use the original top-down rendered roof artwork.
- At closer zoom, increasingly small environmental details are shown, subject
  to a 14,000-object draw cap for browser performance.
- The existing **Buildings** layer toggle works on both dashboard and public
  maps, and processing is deferred until a close enough zoom.
- Native images are served from WWZ's own GitHub Pages assets, including
  inside the PWA cache, not from a third-party image host.
- Buildings, roads, labels, and public/private map markers all continue to
  share the same DayZ world coordinate projection.

`scripts/validate_nasdara_assets.py` verifies the atlas has all 1,694
model pictures and matching source dimensions.
`scripts/test_nasdara_building_artwork.js` additionally parses the authentic
objects binary and exercises model alignment and actual canvas image drawing.



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
  all native building footprints and exact source roof artwork are rendered
  on demand. Major structures appear from zoom 3.1 and pictures from 4.8.
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

Terrain detail cannot exceed the source's 4096px native resolution. Detailed roof textures use the original source pictures. Distant zoom levels
avoid excessive fine details to preserve readability and mobile performance. Named settlements use grid-centres. Markers, rentals and zones
continue to use exact user-entered X/Z coordinates.

## Southwest-origin rendering fix (2026-10-27)

The native structures use DayZ X/Z coordinates measured from the **southwest**
corner. Leaflet CRS.Simple [0,0] is the **northwest** corner of this world;
the previous renderer incorrectly treated it as the southwest corner,
placing all 295,195 objects off screen despite correctly loading the binary.
The renderer now anchors to [-240,0] for the 16,384-metre world, matching
ZedForge. At zoom 6 near X 11153, Z 10967, a realistic map-coordinate
regression sees thousands of buildings rather than zero. Density and outline
colours are aligned with ZedForge, and a live on-map counter exposes whether
building geometry and roof imagery have actually rendered.
