# World War Z Bot Website — v1.22.71

Behaviour-preserving structural maintenance release.

The existing Discord server-selection screen controls every Railway API request through an opaque server key. Changing servers reloads the dashboard before any new data is requested, preventing status, Administration, shop, rental, delivery, marker or saved-location state from being reused across servers.

Railway remains authoritative: Bot v1.18.70 verifies the signed-in member and their live roles in the selected Discord server before every protected operation. The browser never receives raw guild IDs, Nitrado service IDs, tokens or mission paths.

Both validated maps and all four map consumers remain on the shared Chernarus/Livonia map runtime; this release does not modify map tiles, road geometry or label data.

Deploy with Bot v1.18.70.


Website v1.22.71 moves the dashboard's shared money, duration, state-title and account-date formatters out of the Administration module into `assets/js/dashboard/formatters.js`. The shared formatter script loads before every dependent dashboard section, removing the hidden requirement that `administration.js` execute first while preserving identical rendered values and UI behaviour.
