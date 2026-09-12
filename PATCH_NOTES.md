# World War Z Website v1.47.0 — Structured Faction Registration

## Faction registration workspace
- Replaces the old manual copy/paste faction-request process with a protected member **Request A Faction** workflow in the Command Centre.
- Members submit faction name, current group size, optional armband/flag and request notes from a structured dialog.
- The member's verified linked PlayStation ID is used as the requested leader identity.
- Members can see pending registration requests and cancel a still-pending request without contacting an Admin.

## Admin panel management
- Adds Faction Registration Panel controls to Faction Administration.
- Admins can select the public faction channel, private review channel and per-server maximum faction size.
- Adds **Save Panel Settings**, **Publish / Refresh Panel**, and **Unpublish** controls.
- Adds a dedicated faction-creation review queue with Approve / Decline actions alongside existing faction governance tools.

## Discord + website consistency
- Website approvals/declines resolve the matching Discord review card when it exists.
- Approved factions immediately appear in the public faction catalogue, and relevant faction changes refresh that catalogue automatically.
- The public panel remains independently configured for Chernarus and Livonia.

## Compatibility
- Pairs with Bot v1.44.0 and leaves the existing Flag Claims workflow unchanged.
- Advances the website/PWA release to v1.47.0 while preserving the bounded map-cache generation.
- No database wipe, manual migration, DayZ mission upload, Nitrado configuration change, map-data replacement or server wipe is required.
