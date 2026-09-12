# World War Z Website v1.49.0 — Economy Panels Administration

## Command Centre
- Adds **Economy Panels** to the Admin navigation and all-in-one Command Centre Quick Operations.
- Adds a selected-server management workspace for Shop, Item Prices, Vehicle Prices, Weed Operations, Pelt Info, Earn Income, Gamble and Bot Commands Discord panels.
- Admins can assign/reassign channels, enable or disable panels, edit Chernarus/Livonia guidance independently, publish, refresh or remove WWZ-managed copies.
- **Auto Setup Channels** reuses matching Economy channels and lets the bot create missing ones when permitted.
- Per-panel actions automatically save the current routing/settings before publishing or refreshing.

## Shop hand-off
- Server-scoped Shop links can now open the General or Vehicle/Event catalogue mode directly.
- My Orders links can land at the member order section.
- Live Item/Vehicle price panels link to the authoritative website catalogue instead of requiring oversized static Discord price dumps.

## Compatibility
- Pairs with Bot v1.48.0.
- Preserves Chernarus/Livonia isolation.
- Advances the PWA release to v1.49.0 without rotating the bounded map-cache generation.
- No database wipe, mission upload, Nitrado change, map-data replacement or server wipe is required.
