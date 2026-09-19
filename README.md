# World War Z Website v1.57.0

World War Z community dashboard and installable PWA for Chernarus and Livonia.

## v1.57.0 — Repository Organisation & Performance Maintenance

This is a behaviour-preserving maintenance pass across the complete website repository. It retains the live Trader workspace, WWZ Map Hub, Chernarus public markers, private pins, Group/Faction layers, Livonia isolation, member/admin dashboards, shop, progression, events, tickets, donations and all existing protected API workflows.

### Repository and asset cleanup

- Removes the retired pre-WWZMap Chernarus JPG pyramid, duplicate road overlay, legacy map runtime and legacy Chernarus POI/place-name dataset.
- Keeps `assets/maps/chernarus/` and `assets/maps/livonia/` as the only production map datasets.
- Renames the shared map stylesheet to `assets/css/components/wwz-map.css` so the filename matches its Chernarus/Livonia role.
- Removes stale patch/install artefacts from the repository root.
- Optimises the animated Trader GIF payloads while preserving resolution, frames, looping and timing.

### PWA optimisation

- Separates shell/static cache generations from the bounded map-cache generation. Normal website updates can now replace old app assets without discarding downloaded map tiles.
- Removes the long historical per-URL invalidation table because versioned app caches are rotated atomically.
- Stops precaching Trader dashboard artwork during PWA installation; Trader assets are cached only when actually requested.
- Adds GIFs to the normal static-asset cache path.

No bot/database wipe, Nitrado change, DayZ mission upload or map-cache rotation is required. Pairs with Bot v1.59.0.
