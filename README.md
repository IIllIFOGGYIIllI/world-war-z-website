# World War Z Bot Website — v1.22.74

Behaviour-preserving structural maintenance release.

The existing Discord server-selection screen controls every Railway API request through an opaque server key. Changing servers reloads the dashboard before any new data is requested, preventing status, Administration, shop, rental, delivery, marker or saved-location state from being reused across servers.

Railway remains authoritative: Bot v1.18.73 verifies the signed-in member and their live roles in the selected Discord server before every protected operation. The browser never receives raw guild IDs, Nitrado service IDs, tokens or mission paths.

Both validated maps and all four map consumers remain on the shared Chernarus/Livonia map runtime; this release does not modify map tiles, road geometry or label data.

Deploy with Bot v1.18.73.


Website v1.22.74 reduces hidden dashboard startup work. Authentication now loads only the signed-in account summary plus the currently selected view instead of preloading Appeals, Shop, Admin order queues, audit history, moderation cases and the live Nitrado ban list. The public Shop catalogue is also loaded only when the Shop view is opened. Server switching, authorization and all view-specific refresh actions remain unchanged.
