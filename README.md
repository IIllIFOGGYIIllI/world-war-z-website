# World War Z Bot Website — v1.22.77

Behaviour-preserving Owner Shop rendering optimisation.

The existing Discord server-selection screen controls every Railway API request through an opaque server key. Changing servers reloads the dashboard before any new data is requested, preventing status, Administration, shop, rental, delivery, marker or saved-location state from being reused across servers.

Railway remains authoritative: Bot v1.18.76 verifies the signed-in member and their live roles in the selected Discord server before every protected operation. The browser never receives raw guild IDs, Nitrado service IDs, tokens or mission paths.

Both validated maps and all four map consumers remain on the shared Chernarus/Livonia map runtime; this release does not modify map tiles, road geometry or label data.

Deploy with Bot v1.18.76.

Website v1.22.77 reduces Owner Shop rendering work. Editing bulk price, stock, purchase-limit and similar values now updates only the bulk preview/control state instead of rebuilding both catalogue tables on every input event. Manual and event rows are assembled off-DOM in document fragments, and a single row selection change updates that row locally while preserving the existing bulk-selection semantics.
