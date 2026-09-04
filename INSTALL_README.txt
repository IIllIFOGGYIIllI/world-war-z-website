WORLD WAR Z WEBSITE v1.36.0 - AUDIT / OPERATIONS CENTRE

UPLOAD/REPLACE ONLY THE FILES IN THIS ARCHIVE, PRESERVING THEIR PATHS.

This patch is built directly on Website v1.35.0 and pairs with Bot v1.28.0.
Upload the matching Bot v1.28.0 updated files to Railway as part of this release.

What it changes:
- Converts the existing Audit Centre into the protected Audit / Operations Centre.
- Adds live DayZ/Nitrado/Railway/Discord/ADM/restart service health.
- Adds operational health signals, recent errors, restart history and permanent operational history.
- Adds Operations to the searchable cross-system audit.
- Advances the website/PWA release to v1.36.0 without rotating bounded map caches.

What it does NOT change:
- Chernarus/Livonia server isolation.
- DayZ mission files, map data, spawns or Nitrado configuration.
- Existing dashboard permissions or member-facing feature behaviour.

After upload, commit/push to GitHub Pages. Installed PWA users will receive the normal update prompt after the new service worker is detected.
