# World War Z Website v1.22.107

## Missing vehicle/event spawn diagnostics
- Automatic Delivery cards now show the exact CE event name and exact X/Z/angle target used for vehicle/event spawns.
- Vehicle/event coordinates are displayed as terrain-height CE positions instead of implying the saved Y value is written to cfgeventspawns.xml.
- Adds `Copy CE XML` for direct inspection of the generated `<event><pos ... /></event>` target.
- Adds `Retry missing spawn` for Admin/Owner recovery of a paid event order without a second purchase or charge.
- Standalone member Shop order history uses the same X/Z/angle terrain-height presentation for event deliveries.

## Compatibility
- Pairs with Bot v1.18.113.
- Chernarus/Livonia selectors, donations, currency display and all existing dashboard/storefront behaviour remain intact.
