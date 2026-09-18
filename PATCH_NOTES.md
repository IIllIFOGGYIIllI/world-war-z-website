# World War Z Website v1.55.1 — Map Runtime Hotfix

## Fixed
- Corrects the Leaflet 1.9.4 JavaScript Subresource Integrity hash on `map-link.html`.
- Fixes the public WWZ Interactive Map Hub stopping at `The WWZ map runtime could not be loaded.` before the DayZ map initialised.
- Adds validation for the exact Leaflet runtime integrity value so this browser-blocking failure is caught before future releases.

## PWA / compatibility
- Advances the Website/PWA to v1.55.1 and invalidates the previous Map Hub shell request.
- Keeps the bounded Chernarus/Livonia map-cache generation unchanged.
- Preserves all v1.55.0 public POIs, deep links, public PvP/kill-zone overlays and road/trail controls.
- Private pins, Group/Faction layers, bot files, database state, DayZ mission files and Nitrado configuration are unchanged.
- Continues to pair with Bot v1.56.0.
