# World War Z Bot Website — v1.22.75

Behaviour-preserving dashboard startup optimisation.

The existing Discord server-selection screen controls every Railway API request through an opaque server key. Changing servers reloads the dashboard before any new data is requested, preventing status, Administration, shop, rental, delivery, marker or saved-location state from being reused across servers.

Railway remains authoritative: Bot v1.18.74 verifies the signed-in member and their live roles in the selected Discord server before every protected operation. The browser never receives raw guild IDs, Nitrado service IDs, tokens or mission paths.

Both validated maps and all four map consumers remain on the shared Chernarus/Livonia map runtime; this release does not modify map tiles, road geometry or label data.

Deploy with Bot v1.18.74.


Website v1.22.75 lazy-loads the dashboard command catalogue. The approximately 20.5 KB command-library bundle and its 128 command-card render are no longer downloaded and constructed during ordinary Overview visits. The bundle loads when the Commands workspace is opened and is opportunistically warmed when the Commands navigation control is hovered or focused. No API request, server-selection, authorization, command definition or map behaviour changes.
