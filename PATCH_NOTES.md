# World War Z Website v1.38.0 — Unified Action & Notification Centre

## New Action Centre workspace
- Adds a first-class Action Centre to the main Dashboard navigation for signed-in members and authorised Admins.
- Combines actionable tasks, workflow statuses and recent WWZ notifications into one server-scoped inbox while retaining deep-links to the specialist workspace that owns each action.
- Adds Active, Unread and Archived views plus text, source, priority and item-type filtering.
- Adds clear summary counts for required actions, unread items, urgent items, archived history and Admin-only actions.

## Workflow controls and presentation
- Supports mark read/unread, archive/restore, Mark All Read and Archive Read without altering the underlying faction, flag, quest, event, ticket or commerce record.
- Uses priority-aware cards, due/updated timestamps and responsive action controls for desktop, mobile and installed PWA layouts.
- Adds a live sidebar badge and 60-second refresh while the Action Centre is open; a lightweight authenticated refresh also keeps the badge useful outside the workspace.
- Links directly to Browser Notification Settings while preserving the existing opt-in browser-push controls.

## Compatibility / safety
- Pairs with Bot v1.30.0.
- Chernarus/Livonia isolation, Audit / Operations Centre, quests/progression, commerce, factions, events, Livonia Deathmatch Rotation and map systems are preserved.
- The bounded PWA map-cache generation is intentionally unchanged.
- No DayZ mission upload, Nitrado configuration change, database wipe, map-data change or server wipe is required.
