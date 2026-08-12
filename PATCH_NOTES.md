# World War Z Website v1.22.72

## Behaviour-preserving dashboard organisation

- Adds `assets/js/dashboard/shop-helpers.js` for pure Survivor Shop status/order formatting, profile-list parsing, XML parsing/formatting and generated-SKU helpers.
- Reduces `assets/js/dashboard/shop.js` from 1,889 to 1,703 lines while keeping DOM controllers, event listeners, API requests and protected write workflows in the existing Shop module.
- Loads the Shop helper layer after the shared dashboard formatters and before the Shop controller, preserving the existing Delivery dependency on `shopStatusLabel` without relying on controller execution order.
- Keeps every extracted helper body as a literal move from Website v1.22.71.
- Extends website validation to require the helper layer, reject duplicate definitions and enforce safe script order.
- Refreshes local asset cache versions so GitHub Pages clients receive the reorganised JavaScript immediately.

## Compatibility

- Pair with Bot v1.18.71.
- No Railway API contract, authentication flow, selected-server behaviour, shop workflow, map tiles, roads, labels or persistent data are changed.
