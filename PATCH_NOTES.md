# World War Z Website v1.41.0 — Security / Reliability Hardening Pass

## Protected browser transport
- Hardens the shared `WWZHttp` layer so bearer credentials can only be attached to the trusted World War Z Railway API origin and `/api/` paths.
- Rejects malformed bearer headers before fetch, keeps selected-server routing limited to the trusted API, forces `credentials: omit`, `cache: no-store` and `referrerPolicy: no-referrer`, and prevents authenticated requests from following redirects.
- Clamps feature-supplied request timeouts between one second and two minutes while retaining caller cancellation support.

## Static-site security
- Adds a no-referrer policy to all 16 public HTML pages.
- Tightens the dashboard Content Security Policy with explicit font/media/frame/form controls and HTTPS upgrade enforcement while preserving the existing approved map/image/script dependencies.
- Advances the installed PWA release to v1.41.0 without rotating the bounded map-cache generation.

## Compatibility
- Pairs with Bot v1.33.0 and its API/auth/database hardening.
- Existing member/Admin workflows, server isolation, map datasets and PWA map caches are preserved.
- No database wipe, DayZ mission upload, Nitrado configuration change, map-data change or server wipe is required.
