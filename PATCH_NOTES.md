# World War Z Website v1.48.0 — Faction Founders & Donation Checkout Links

## Donation hand-off
- Adds a stable `#payment` anchor to the public donation storefront.
- Accepts `?server=chernarus` / `?server=livonia` so Discord links can open the matching server storefront.
- Keeps the existing live AUD display-currency conversion and external-provider payment controls.
- Switching server on the storefront keeps the URL server context in sync.

## Compatibility
- Pairs with Bot v1.47.0.
- Preserves Chernarus/Livonia isolation.
- Advances the PWA release to v1.48.0 without rotating the bounded map-cache generation.
- No database wipe, mission upload, Nitrado change, map-data replacement or server wipe is required.
