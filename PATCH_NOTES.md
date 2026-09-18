# World War Z Website v1.55.0 — WWZ Map Integration Phase 1

## Public Map Hub
- Upgrades `map-link.html` from the single detection-marker viewer into the public WWZ Interactive Map Hub while preserving every existing Discord X/Z detection link.
- Loads database-backed public markers plus the seven website-only Chernarus POIs and keeps Radio Zenit available as the public Trader location.
- Adds a public POI browser, exact-coordinate selection, public POI/zone/road layer toggles and live PvP/kill-zone overlays from the existing public map-intelligence API.
- No Discord sign-in is required for public layers; private pins, Group/Faction layers and Admin data remain protected.

## Deep links
- Adds map-hub links (`view=hub`) for Discord panels and preserves direct coordinate links.
- Dashboard deep links can now target a public POI by ID/name as well as exact X/Z coordinates.
- Member Dashboard links continue to enforce normal Discord authentication and layer permissions.

## PWA / compatibility
- Advances the Website/PWA to v1.55.0 and refreshes the Map Hub, dashboard map-loader and PWA request keys.
- The bounded Chernarus map-cache generation is intentionally unchanged.
- Livonia remains isolated; no bot database migration, DayZ mission upload or Nitrado change is required.
- Pairs with Bot v1.56.0.
