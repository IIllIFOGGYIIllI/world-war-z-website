WORLD WAR Z WEBSITE v1.41.0 - SECURITY / RELIABILITY HARDENING

UPLOAD/REPLACE ONLY THE FILES IN THIS ARCHIVE, PRESERVING THEIR PATHS.

This patch is built directly on Website v1.40.0 and pairs with Bot v1.33.0.

What it changes:
- Hardens the shared browser HTTP client against bearer-token egress to untrusted origins.
- Forces protected API requests to omit cookies, referrers and cached responses and blocks redirect following for authenticated requests.
- Clamps caller-provided request timeouts to safe bounds while preserving upstream AbortSignal support.
- Adds a no-referrer policy to every public HTML page.
- Tightens the dashboard Content Security Policy for fonts, media, frames, forms and insecure subresources.
- Advances the public website/PWA release to v1.41.0 without rotating the bounded map-cache generation.

Compatibility:
- Upload Bot v1.33.0 as the paired backend release.
- Chernarus/Livonia isolation and all current dashboard/member/Admin workspaces remain unchanged.
- No database wipe, DayZ mission upload, Nitrado configuration change, map-data change or server wipe is required.

After upload, commit/push the files and allow GitHub Pages/PWA update delivery to refresh normally.
