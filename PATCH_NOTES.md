# World War Z Website v1.42.0 — Livonia Live Launch Integration

## Livonia live presentation
- Updates the public roadmap and Command Centre to present Livonia as the live 26-slot Full PvP server rather than a resumed/development-stage service.
- Highlights the current Livonia identity: Full PvP, high loot, 91 random PvP loadouts, heli crashes, convoys, WWZ combat sites, dynamic gas, PvP hotspots, Most Wanted and factions.
- Adds capacity to authenticated server-selection cards and selected-server context.
- The normal status UI now falls back to configured server capacity if Nitrado temporarily omits `player_max`, avoiding misleading `0`-capacity presentation.
- Livonia PvP Operations shows cached online population against the configured 26-slot capacity.

## Deathmatch launch safety
- Deathmatch Rotation Manager now displays activation readiness returned by Bot v1.34.0.
- The frontend retains explicit Admin control; this release does not automatically enable Deathmatch Rotation or upload an arena profile.

## PWA / compatibility
- Advances the installed PWA release to v1.42.0 while preserving the existing bounded map-cache generation.
- Chernarus/Livonia map data, private/public markers, member/Admin workspaces and all existing workflows remain unchanged outside the launch integration.
- No database migration, DayZ mission upload, Nitrado configuration change, map-data change or server wipe is required.
