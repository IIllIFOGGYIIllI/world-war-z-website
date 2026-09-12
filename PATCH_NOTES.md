# World War Z Website v1.46.0 — Unified Command Centre & Discord Security

## All-in-one Command Centre
- Expands the protected Command Centre from an operational overview into the primary Admin launchpad.
- Adds direct one-click navigation to Moderation, Ban Lists, Player Intelligence, Server Feeds, Identity Sync, Flag Claims, Factions, Events, Shop / Orders, Tickets, Backups / Data and Server Controls.
- Keeps the existing live health, attention queue, player activity, notification health and M10 monitoring surfaces.

## Discord Security Centre
- Adds selected-server anti-spam and anti-raid configuration directly inside the Command Centre.
- Admins can configure burst-message thresholds, duplicate-message thresholds, mass-mention limits, timeout duration, join-burst thresholds and suspicious-account age.
- Adds selectable alert-channel routing and multi-select exempt roles without exposing raw Discord snowflakes to the browser.
- Adds a protected **Send Test Alert** action for verifying the selected server's Security alert destination.
- Adds 24-hour spam / raid counters and a recent detection-history panel.
- Adds **Emergency Join Quarantine** with an explicit browser confirmation before enabling it.
- Protection is opt-in after upgrade; Bot v1.42.0 does not begin automatic moderation until an Admin explicitly enables the master Security switch.

## Multi-server behaviour
- The complete Command Centre and Security Centre work independently for **Chernarus and Livonia**.
- Switching the selected server changes the available channels, roles, thresholds, alert destination and event history.
- No Discord IDs or settings are copied between the two servers.

## Compatibility
- Pairs with Bot v1.42.0 and preserves the v1.45.0 Server Feed bulk routing / auto setup workflow.
- Advances the website/PWA release to v1.46.0 while preserving the bounded map-cache generation.
- No database wipe, manual migration, DayZ mission upload, Nitrado configuration change, map-data change or server wipe is required.
