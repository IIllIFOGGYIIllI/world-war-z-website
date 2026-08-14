# World War Z Website v1.22.92

## Added
- Added **Administration → Server Feeds** with create, edit and delete controls.
- Added supported DayZ feed-type selection supplied by Railway, so unsupported/fake event types are not offered.
- Added Discord channel routing with multiple feeds allowed for the same event type.
- Added Location/map-link output, Minimize Output, footer timestamps, Custom Embed copy, embed colour and optional notes.
- Added dynamic PlayStation **Allow/Ignore lists** per feed.
- Added feed search, active/inactive filtering and route summary counts.

## Security / Runtime
- Server Feeds remain Admin-only.
- Discord channel IDs are never exposed directly to the browser; opaque resource keys are used.
- Events reuse the bot's existing ADM/PvP/intelligence runtime and do not create another Nitrado polling loop.
- Location-enabled feeds use the same corrected Chernarus/Livonia X/Z conversion and clickable WWZ map deep links as Zone Radar and the PvP killfeed.

## Compatibility
- Requires Bot v1.18.98.
- Existing Zones, Online Players, PWA, Shop, tickets, moderation and server-routing behaviour are preserved.
