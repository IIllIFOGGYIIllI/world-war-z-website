# World War Z Website v1.22.81

## Lazy shared map runtime

- Removes Leaflet, the shared `wwz-map.js` runtime and the DayZ map component stylesheet from ordinary dashboard startup.
- Loads the shared map runtime once, on demand, when the Map workspace or a Shop/Delivery/Locations coordinate picker actually needs it.
- Reuses the same in-flight/runtime promise across Map and commerce workspaces so multiple navigation events cannot inject duplicate Leaflet or map assets.
- Keeps standalone `shop.html` unchanged because its coordinate picker is part of the page's primary workflow.
- Preserves direct Map navigation, Shop event-coordinate picking, Saved Locations and Delivery coordinate maps with the existing validated Chernarus/Livonia data.
- Extends site validation so the dashboard cannot silently return to eager Leaflet/shared-map loading.

## Compatibility

- Pair with Bot v1.18.80.
- No Railway API contract, selected-server routing, map geometry, road/label data, Shop transaction or persistent-record changes.
