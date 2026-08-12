# World War Z Bot Website — v1.22.72

Behaviour-preserving structural maintenance release.

The existing Discord server-selection screen controls every Railway API request through an opaque server key. Changing servers reloads the dashboard before any new data is requested, preventing status, Administration, shop, rental, delivery, marker or saved-location state from being reused across servers.

Railway remains authoritative: Bot v1.18.71 verifies the signed-in member and their live roles in the selected Discord server before every protected operation. The browser never receives raw guild IDs, Nitrado service IDs, tokens or mission paths.

Both validated maps and all four map consumers remain on the shared Chernarus/Livonia map runtime; this release does not modify map tiles, road geometry or label data.

Deploy with Bot v1.18.71.


Website v1.22.72 continues the controlled dashboard JavaScript split by moving pure Survivor Shop status/order formatting, profile-list parsing, XML parsing/formatting and generated-SKU helpers into `assets/js/dashboard/shop-helpers.js`. The main Shop controller keeps its DOM state, event listeners, API requests and protected write workflows, while the extracted helper bodies remain literal moves from v1.22.71.
