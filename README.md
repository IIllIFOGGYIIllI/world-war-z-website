# World War Z Bot Website — v1.22.73

Behaviour-preserving structural maintenance release.

The existing Discord server-selection screen controls every Railway API request through an opaque server key. Changing servers reloads the dashboard before any new data is requested, preventing status, Administration, shop, rental, delivery, marker or saved-location state from being reused across servers.

Railway remains authoritative: Bot v1.18.72 verifies the signed-in member and their live roles in the selected Discord server before every protected operation. The browser never receives raw guild IDs, Nitrado service IDs, tokens or mission paths.

Both validated maps and all four map consumers remain on the shared Chernarus/Livonia map runtime; this release does not modify map tiles, road geometry or label data.

Deploy with Bot v1.18.72.


Website v1.22.73 removes two accidental JavaScript ownership dependencies. Shared protected Admin authorization handling now lives in `assets/js/dashboard/admin-access.js` instead of the Administration controller even though Shop, Delivery, Configuration Studio and Command Centre also use it. The economy transaction renderer now lives in `account.js`, its sole consumer, instead of being defined at the bottom of `administration.js`. Both moved function bodies are literal moves from v1.22.72.
