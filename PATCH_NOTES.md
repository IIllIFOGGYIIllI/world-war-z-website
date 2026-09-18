# World War Z Website v1.54.4 — Chernarus Public Map Markers

## Chernarus map
- Adds the seven agreed website-only public markers: four Builder Sheds and three Bunkers.
- Preserves the existing Radio Zenit Trader marker supplied by the public marker API.
- Static public locations are merged only for Chernarus and do not write to the shared marker database.

## Isolation / compatibility
- Livonia is unchanged.
- Private pins and Group/Faction map layers are unchanged.
- Bot files and the database are untouched.
- No DayZ mission upload, Nitrado configuration change, database migration, or bounded map-cache rotation is required.

## PWA
- Advances the website/PWA release to v1.54.4.
- Bumps the service-worker update revision and refreshes the dashboard lazy-loader/map-loader request keys so installed PWAs receive the marker update.
- Keeps the bounded Chernarus map cache generation unchanged.
