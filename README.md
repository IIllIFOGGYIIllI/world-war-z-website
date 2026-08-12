# World War Z Bot Website — v1.22.69

Behaviour-preserving optimisation and maintenance release.

The existing Discord server-selection screen now controls every Railway API request through an opaque server key. Changing servers reloads the dashboard before any new data is requested, preventing status, Administration, shop, rental, delivery, marker or saved-location state from being reused across servers.

Railway remains authoritative: Bot v1.18.67 verifies the signed-in member and their live roles in the selected Discord server before every protected operation. The browser never receives raw guild IDs, Nitrado service IDs, tokens or mission paths.

Both validated maps and all four map consumers remain on the shared Chernarus/Livonia map runtime; this release does not modify map tiles, road geometry or label data.

Deploy with Bot v1.18.67.


Website v1.22.69 removes a duplicate dashboard shop restart-status timer that could accumulate every time the user changed views. The dashboard now keeps the same 30-second refresh behaviour with one timer for the lifetime of the page.
