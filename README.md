# World War Z Bot Website — v1.22.78

Behaviour-preserving dashboard controller lazy-loading optimisation.

The existing Discord server-selection screen controls every Railway API request through an opaque server key. Changing servers reloads the dashboard before any new data is requested, preventing status, Administration, shop, rental, delivery, marker or saved-location state from being reused across servers.

Railway remains authoritative: Bot v1.18.77 verifies the signed-in member and their live roles in the selected Discord server before every protected operation. The browser never receives raw guild IDs, Nitrado service IDs, tokens or mission paths.

Both validated maps and all four map consumers remain on the shared Chernarus/Livonia map runtime; this release does not modify map tiles, road geometry or label data.

Deploy with Bot v1.18.77.

Website v1.22.78 moves six large workspace-specific dashboard controllers behind the existing lazy-asset runtime: Administration, Tickets, Progression, Objectives, Factions and Command Centre. A normal Overview visit therefore avoids another 261,530 bytes of JavaScript until those workspaces are actually requested. Direct hashes, view activation and hover/focus preloading remain supported, while authenticated API work is still triggered only by the workspace that needs it.
