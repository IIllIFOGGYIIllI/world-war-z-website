# World War Z Website v1.45.0 — Server Feed Bulk Routing & Auto Setup

## Added
- Adds **Bulk Assign** to Server Feeds so an Admin can select one Discord channel and assign multiple supported DayZ event types in a single operation.
- Adds grouped selectors for Connections, PvP / Combat, Player State, Building / Interaction, Flags, **All Hit Logs** and **All Death Logs**, plus Select All / Clear controls.
- Adds **Auto Setup Channels** with two layouts:
  - **Grouped (Recommended)** routes all 45 supported events into a small set of logical log channels.
  - **One Channel Per Event** creates a dedicated channel for each missing event type.
- Adds Discord category selection for guided setup. When a new `WWZ Logs` category is required, Bot v1.41.0 creates it as a protected staff log area rather than exposing telemetry to `@everyone`.
- The Server Feeds page now shows category context beside channel choices and accurately states that rich DayZ telemetry can include coordinates/location context.

## Safe / non-destructive behaviour
- Automatic setup never removes or rewrites an existing feed route.
- It creates routes only for event types that are not configured anywhere on the selected server yet.
- For grouped setup, WWZ first extends a channel already used by that group (for example `#build-logs`, `#death-logs` or `#flag-raise`), then reuses a matching recommended channel, and only creates a new channel if neither exists.
- Bulk assignment skips exact duplicate event-type/channel routes instead of producing duplicate Discord messages.

## Multi-server behaviour
- The complete workflow is available on both **Chernarus and Livonia** through the existing selected-server dashboard context.
- Feed records, Discord channels, category creation and automatic setup remain isolated to the currently selected server/guild.

## Compatibility
- Pairs with Bot v1.41.0.
- Advances the website/PWA release to v1.45.0 while preserving the bounded map-cache generation.
- No database wipe, DayZ mission upload, Nitrado configuration change, map-data change or server wipe is required.
