# World War Z Website v1.22.86

## Added

- Upgraded the existing web manifest into `manifest.webmanifest` for the installable **WWZ Server Companion** experience; the superseded `site.webmanifest` should be deleted.
- Added 192px/512px standard and maskable WWZ icons plus a dedicated 180px Apple touch icon derived from the existing 512px community logo.
- Added a root `sw.js` service worker that is safe for GitHub Pages under `/world-war-z-website/`.
- Added install controls for supported desktop/Android browsers and iPhone/iPad Add to Home Screen guidance.
- Added standalone safe-area/notch handling, network/offline status UI and an explicit app-update prompt.
- Added `offline.html` as a clear offline fallback rather than pretending live WWZ services are available.

## Caching and safety

- Railway/API/authenticated responses are never service-worker cached.
- Non-GET requests are never intercepted/cached.
- App-shell/static assets may be cached for reliable installed-app startup.
- Chernarus/Livonia map tiles are cached only after use and capped at 180 tiles.
- Static road/label map data uses a separate small bounded runtime cache.
- Live requests fail immediately with a clear offline error when the browser knows the device is offline.
- PWA updates wait for user confirmation instead of silently replacing a running Admin dashboard.

## Compatibility

- Pairs with Bot v1.18.85.
- The normal GitHub Pages website remains fully usable without installing the app.
- No Railway API, Discord authentication, database, selected-server, Shop, ticket, moderation, Nitrado, map geometry or persistent-data behaviour changed.
