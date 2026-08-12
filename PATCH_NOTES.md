# World War Z Website v1.22.71

## Behaviour-preserving dashboard organisation

- Adds `assets/js/dashboard/formatters.js` for the four formatting helpers shared by Administration, Account, Shop and Delivery.
- Removes those helper definitions from the oversized `administration.js` module, eliminating a hidden cross-module load-order dependency.
- Loads the shared formatter layer before all dependent dashboard sections without changing any existing public URL, section or rendering behaviour.
- Extends website validation to require the shared formatter file, prevent duplicate definitions and enforce safe script order.
- Refreshes local asset cache versions so GitHub Pages clients receive the reorganised JavaScript immediately.

## Compatibility

- Pair with Bot v1.18.70.
- No Railway API contract, authentication flow, selected-server behaviour, shop workflow, map tiles, roads, labels or persistent data are changed.
