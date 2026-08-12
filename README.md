# World War Z Bot Website — v1.22.70

Behaviour-preserving optimisation and maintenance release.

The existing Discord server-selection screen now controls every Railway API request through an opaque server key. Changing servers reloads the dashboard before any new data is requested, preventing status, Administration, shop, rental, delivery, marker or saved-location state from being reused across servers.

Railway remains authoritative: Bot v1.18.69 verifies the signed-in member and their live roles in the selected Discord server before every protected operation. The browser never receives raw guild IDs, Nitrado service IDs, tokens or mission paths.

Both validated maps and all four map consumers remain on the shared Chernarus/Livonia map runtime; this release does not modify map tiles, road geometry or label data.

Deploy with Bot v1.18.69.


Website v1.22.70 removes the remaining duplicate dashboard restart-status request. The existing 30-second live-status poll now publishes the same restart payload to shop and delivery views, so the dashboard makes one server-status request per refresh cycle instead of two while preserving the same UI refresh cadence.
