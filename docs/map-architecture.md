# WWZ map architecture

`assets/js/map/wwz-map.js` is the only production map engine. It selects the correct Chernarus or Livonia dataset from `assets/maps/<map>/`, converts DayZ X/Z coordinates, loads the local satellite tiles, renders road/label overlays and exposes the shared API used by the dashboard, shop coordinate pickers, zone tools and Discord deep-link page.

Chernarus production data:
- `assets/maps/chernarus/tiles/`
- `assets/maps/chernarus/roads.geojson`
- `assets/maps/chernarus/labels.json`

Livonia production data:
- `assets/maps/livonia/tiles/`
- `assets/maps/livonia/roads.geojson`
- `assets/maps/livonia/labels.json`

The previous `assets/chernarus-map/` JPG/overlay implementation is retired and must not be reintroduced. Public marker records come from the protected WWZ API plus the approved website fallback markers; private, Group and Faction layers retain their existing permission boundaries.
