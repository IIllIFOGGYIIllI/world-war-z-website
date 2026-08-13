# World War Z Bot Website — v1.22.79

Behaviour-preserving commerce runtime lazy-loading optimisation.

The existing Discord server-selection screen controls every Railway API request through an opaque server key. Changing servers reloads the dashboard before any new data is requested, preventing status, Administration, shop, rental, delivery, marker or saved-location state from being reused across servers.

Railway remains authoritative: Bot v1.18.78 verifies the signed-in member and their live roles in the selected Discord server before every protected operation. The browser never receives raw guild IDs, Nitrado service IDs, tokens or mission paths.

Both validated maps and all four map consumers remain on the shared Chernarus/Livonia map runtime; this release does not modify map tiles, road geometry or label data.

Deploy with Bot v1.18.78.

Website v1.22.79 moves the Shop helper layer, Shop controller and Delivery/configuration controller behind the existing lazy-asset runtime. A normal Overview visit therefore avoids another 168,707 bytes of commerce-specific JavaScript. Authentication/navigation startup now lives in a dedicated bootstrap module, and configuration-only server reads are limited to the workflow/backup areas that actually need them.
