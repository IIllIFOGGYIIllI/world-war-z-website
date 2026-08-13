# World War Z Bot Website — v1.22.80

Behaviour-preserving administration request optimisation.

Railway remains authoritative: Bot v1.18.79 verifies the signed-in member and their live roles in the selected Discord server before every protected operation. The browser never receives raw guild IDs, Nitrado service IDs, tokens or mission paths.

Deploy with Bot v1.18.79.

Website v1.22.80 stops protected player actions from immediately refreshing hidden Moderation Cases and Ban Lists workspaces. Those workspaces already refresh when opened, so note, economy, warning and moderation actions no longer generate invisible follow-up API work; in particular, routine actions avoid an unnecessary potentially Nitrado-backed ban-list read. Existing player-detail refresh behaviour and protected action results are unchanged.
