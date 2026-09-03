# World War Z Website v1.32.0 — Livonia Deathmatch Rotation Foundation

## Added
- Adds a **Livonia-only Deathmatch Rotation Manager** to the Admin dashboard.
- Adds a profile library/editor for arena names, descriptions, banners, loadout summaries, announcement copy, explicit rotation order and JSON manifests.
- Adds sequential/random rotation settings, pre-restart staging lead, announcement routing, persistent-panel routing, manual lock, skip-next, set-next, validation, staging and manual-live controls.
- Adds clear profile readiness and JSON-file counts plus a rotation audit trail.

## Livonia PvP integration
- Adds Current, Up Next and Following Deathmatch state to the Livonia PvP dashboard when profiles exist or rotation is enabled.
- Keeps the Deathmatch manager hidden from Chernarus and non-Admin users.
- Uses the same profile state that drives Discord announcements so the website and Discord stay aligned with the selected arena.

## PWA / release
- Website version advanced to **v1.32.0** with **Bot v1.25.0** shown publicly.
- Adds lazy-loaded Deathmatch JavaScript/CSS and updates the service-worker revision for installed-app refresh.
- No Deathmatch JSON ships in the website package and the rotation system remains disabled until configured by an Admin.
