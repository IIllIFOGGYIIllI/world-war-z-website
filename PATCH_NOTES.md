# Website v1.22.40 — Header & Sidebar Clarity Fix

## Fixed

- Replaced the full-size World War Z logo with the dedicated compact application icon in small navigation/header brand slots.
- Fixes the cramped/cropped-looking top-left dashboard logo seen after the v1.22.39 UI overhaul.
- Applies the compact-brand treatment consistently to the dashboard, homepage, standalone Survivor Shop and policy/changelog headers.
- Keeps the full 512px World War Z logo for larger hero/emblem artwork where it has enough space to render properly.
- Increased spacing between sidebar navigation groups and child rows so adjacent controls no longer visually crowd or appear to overlap.
- Keeps the sidebar compact while giving active states, icons and labels their own clear hit areas.
- Advanced local asset cache versions and visible website release labels to v1.22.40.

## Compatibility

- Pairs with Bot v1.18.42.
- Website-only presentation hotfix.
- No Railway API contract, database record, shop/rental delivery logic, Nitrado controls, Chernarus map geometry, satellite tiles, progression logic or permissions are changed.

## Validation

- `python scripts/validate_site.py --require-map-assets` — PASS.
- Existing v1.22.39 site-wide UI overhaul remains intact.
