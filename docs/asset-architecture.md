# Website asset architecture

## Canonical production layout

- `assets/maps/chernarus/` — Chernarus WebP tile pyramid, production roads and labels.
- `assets/maps/livonia/` — Livonia WebP tile pyramid, production roads and labels.
- `assets/js/map/wwz-map.js` — the single shared DayZ map runtime for both maps.
- `assets/css/components/wwz-map.css` — shared map presentation.
- `assets/trader/` — animated Radio Zenit Trader state artwork.
- `assets/js/dashboard/` — authenticated dashboard workspaces.
- `assets/js/pages/` — standalone/public page controllers.
- `assets/css/dashboard/`, `assets/css/pages/`, `assets/css/components/` — scoped presentation layers.

The retired `assets/chernarus-map/` implementation must not be restored. It duplicated the Chernarus tile pyramid and road data and was superseded by `WWZMap`, which is also required for Livonia and Discord deep links.

## Cache architecture

The PWA uses independent cache generations:

- shell/static caches rotate with the public website release;
- bounded map tile/data caches retain the stable map-cache generation until a deliberate map migration is required.

Large map pyramids and Trader animations are never part of the install-time application shell. They are cached on demand.
