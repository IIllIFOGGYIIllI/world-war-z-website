# World War Z Bot Website — v1.25.2

Website v1.25.2 is the PWA cache-sync hotfix for the Livonia PvP Operations release. It preserves the v1.25.1 Livonia-only workspace and advances the installed-app service-worker cache generation so the current dashboard is delivered to installed PWAs.

## Livonia only
- Active rotating PvP hotspot cards and reward summary.
- Current faction-control objective and faction scoreboard.
- Automatic Most Wanted bounty display.
- Contested world-objective overview.
- Admin-only possible combat-disconnect intelligence.
- Hotspot/faction-objective polygons on the existing collaborative map with an independent map-layer toggle.

## Chernarus isolation
- The Livonia PvP navigation item and view are hidden when Chernarus is selected.
- Deep-link access is rejected outside Livonia.
- Chernarus map-intelligence payloads contain no Livonia overlay data.
- Existing Chernarus pages, map layers, markers, zones and workflows are otherwise unchanged.
