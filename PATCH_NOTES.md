# World War Z Website v1.22.70

## Behaviour-preserving request optimisation

- Removes the second dashboard `/api/server/status` poll previously maintained by the shop module.
- Reuses the existing 30-second live server-status result for shop and delivery restart banners through the existing `wwz:restartstatus` event.
- Keeps the same visible 30-second refresh cadence while reducing dashboard status traffic from two requests per cycle to one.
- Preserves fail-closed `X-WWZ-Server` routing and never shares mutable data between selected servers.
- Updates validation so a dedicated shop restart-status poll cannot be reintroduced accidentally.
- Refreshes local asset cache versions so GitHub Pages clients receive the updated JavaScript.

## Compatibility

- Pair with Bot v1.18.69.
- No Railway API contract, authentication flow, selected-server behaviour, shop workflow, map tiles, roads, labels or persistent data are changed.
