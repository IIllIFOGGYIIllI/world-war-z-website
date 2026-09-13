# World War Z Website v1.51.0 — Admin Operations Centre Overhaul

## Admin Operations Centre
- Rebuilds the existing Audit / Operations page into a consolidated Admin Operations Centre.
- Adds selected-world context, live current/max population, DayZ/Nitrado state and next-restart visibility at the top of the workspace.
- Adds the existing protected Restart / Stop / Start controls directly to the centre; the normal confirmation, permission recheck and permanent audit remain unchanged.
- Adds background-worker cards for server status, ADM, automatic deliveries, moderation expiry, moderation notifications and community engagement; Livonia additionally shows its existing Deathmatch Rotation worker.
- Adds detailed restart-schedule and ADM-watcher diagnostics without exposing raw log paths or private identifiers.
- Adds direct Admin shortcuts to Online Players, Player Intelligence, Ban Lists, Moderation Queue, Server Feeds, Automatic Deliveries, Ticket Administration and Operational Failures.
- Keeps Health Signals, Recent Errors, Operational History and the searchable cross-system audit in the same workspace.

## Compatibility
- Pairs with Bot v1.52.0.
- Chernarus/Livonia isolation is unchanged.
- Livonia Deathmatch Rotation configuration/behaviour is unchanged.
- PWA advances to v1.51.0 without rotating the bounded map-cache generation.
- No DayZ mission, Nitrado configuration, database wipe or manual migration is required.
