# World War Z Website v1.22.69

## Behaviour-preserving optimisation

- Removes the duplicate dashboard shop restart-status interval that was created on every dashboard view change.
- Preserves the existing 30-second restart-status refresh cadence with one page-lifetime timer.
- Adds a validator regression check requiring exactly one dashboard shop restart-status interval.
- Refreshes local asset cache versions so GitHub Pages clients receive the corrected JavaScript.

## Compatibility

- Pair with Bot v1.18.67.
- No Railway API contract, authentication flow, selected-server routing, shop workflow, map tiles, roads, labels or persistent data are changed.
