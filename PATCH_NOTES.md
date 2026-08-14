# World War Z Website v1.22.89

## Admin Zones & Mapping

- Added three verified-Admin navigation workspaces: **Zones**, **Zone Map** and **Online Players**.
- Added circular-zone and polygon-zone creation/edit dialogs using the existing validated selected-server map runtime.
- Circular zones can be positioned by map click or exact X/Z entry and configured with a radius in metres.
- Polygon zones are drawn directly on the map with ordered points, visible point numbering, undo and clear controls.
- Added saved-zone search/filtering, active/inactive status, geometry summaries, edit/delete actions and map focus controls.
- Added zone configuration for colour, active state, entry alerts, exit alerts, coordinate detail, verbose alerts, Discord alert channel, ping roles, allowlist roles and allowlisted PlayStation IDs/names.
- Added a dedicated Zone Map that renders saved circles/polygons on the existing Chernarus/Livonia satellite + road stack.
- Added a protected Online Players map with recent ADM player names/positions and a visibility-aware 30-second refresh while that Admin workspace is actually open.
- Updated dashboard help text so the public interactive map remains explicitly player-position-free while the new Admin-only map is documented separately.

## Security and compatibility

- Zones are Admin/Owner-only in both website navigation and Railway authorization.
- The browser receives opaque Discord channel/role resource keys rather than raw snowflake IDs.
- Online positions come from the bot's existing cached ADM snapshot; opening the page does not introduce a second Nitrado polling loop.
- Advanced automatic ban/enforcement rules are deliberately not exposed in this release.
- Existing public map, PWA, Shop, delivery, tickets, moderation, Chernarus/Livonia routing and member features remain intact.
- Pairs with Bot v1.18.92.
