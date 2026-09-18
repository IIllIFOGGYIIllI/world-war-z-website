# World War Z Website v1.55.2 — Map Hub Coordinate Hotfix

## Fixed
- A plain `map-link.html` launch no longer converts missing `x`/`z` query parameters into `0,0`.
- Removes the false `Discord Location` marker that appeared at the southwest edge of Chernarus and forced the initial map view into that corner.
- Live/API public markers now take precedence over nearby website fallback markers, preventing the existing Radio Zenit Trader marker from being duplicated while retaining the seven website-only public Chernarus POIs.

## PWA / compatibility
- Advances the Website/PWA to v1.55.2 and refreshes the Map Hub JavaScript request.
- Keeps the bounded Chernarus/Livonia map-cache generation unchanged.
- Bot v1.56.0, Livonia, private pins, Group/Faction layers, database state, DayZ mission files and Nitrado configuration are unchanged.
