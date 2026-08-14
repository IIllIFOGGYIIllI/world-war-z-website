# World War Z Website v1.22.91

## Discord Map Deep Links

- Added support for bot-generated map URLs containing the WWZ server key, map key, DayZ X/Z coordinates, marker label and source event.
- The dashboard selects the matching authenticated WWZ server/map before opening the map when possible.
- The interactive map centres on the linked X/Z position and renders a temporary labelled marker.
- The marker uses the existing canonical Chernarus/Livonia world-to-map conversion; no alternate coordinate transform was introduced.
- Deep-link state survives the Discord OAuth round-trip in the current browser tab so radar links still work when sign-in is required.

## Compatibility

- Existing map search, private pins, public markers, roads, settlement labels, coordinate copy and fullscreen controls remain unchanged.
- Existing Zones, Zone Map and Online Players workspaces remain unchanged.
- PWA cache revision bumped so installed WWZ Server Companion clients receive the deep-link runtime.
- Pairs with Bot v1.18.95.
