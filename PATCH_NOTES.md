# World War Z Website v1.39.0 — Data Management / Backup & Export Centre

## New Owner workspace
- Adds Data Management to Owner Configuration with live SQLite integrity, database/WAL size, server-scoped row counts and persistent-storage capacity.
- Adds a verified whole-database backup builder with an explicit `BACKUP ALL SERVERS` confirmation and clear global backup-scope warning.
- Adds protected backup downloads, checksum/integrity re-verification, schema-match status, retention visibility and explicit deletion.

## Server-isolated reports
- Adds Complete, Members/Progression, Economy/Commerce, Community/Factions, Moderation/Support and Operations/Audit export presets.
- Supports JSON or CSV ZIP bundles, row/table totals, retained download history and server-isolation guidance.
- Adds recent data-management action history and Data Management as a filter in the existing Audit / Operations Centre.

## Recovery safeguards / compatibility
- The dashboard intentionally exposes no live-restore control. Recovery instructions require a verified backup and stopping the Railway service before replacing the persistent SQLite file.
- Pairs with Bot v1.31.0.
- Chernarus/Livonia isolation and all existing Action Centre, Audit / Operations, faction, event, quest, commerce and map systems are preserved.
- The bounded PWA map-cache generation remains unchanged.
- No DayZ mission upload, Nitrado configuration change, database wipe, map-data change or server wipe is required.
