# World War Z Website v1.44.0 — Identity Sync Administration

## Added
- Adds an Admin-only **Identity Sync** workspace to the dashboard.
- Admins can choose the safe Verified role or keep automatic `Verified` / legacy `Linked` role detection.
- Adds a server-scoped toggle for automatic Discord nickname sync to the exact linked PSN identity.
- Adds **Resync All Linked Members** for the selected server and **Resync Both Servers** for authorised cross-server administrators.
- Bulk results show members found, Verified-role sync, PSN nickname sync and members not present in each Discord server.

## Multi-server behaviour
- Available on both Chernarus and Livonia.
- Role and nickname settings remain isolated per selected server.
- Cross-server resync uses each server's own saved role and nickname settings; it never copies Discord role IDs between servers.

## Compatibility
- Pairs with Bot v1.38.0.
- Advances the website/PWA release to v1.44.0 while preserving the existing bounded map-cache generation.
- No database wipe, DayZ mission upload, Nitrado configuration change, map-data change or server wipe is required.
