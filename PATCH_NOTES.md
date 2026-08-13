# World War Z Website v1.22.83

## Final optimisation consolidation

- Removes the full 22,879-byte catalogue/map workspace stylesheet from ordinary dashboard startup.
- Keeps the Overview map card visually identical through a dedicated 827-byte preview stylesheet, a net 22,052-byte reduction on the normal Overview path.
- Loads the full catalogue/map stylesheet once through the existing single-flight lazy-asset layer when Map or a commerce/delivery workspace actually needs it.
- Reuses the same stylesheet promise across map and commerce navigation so Leaflet/map and Shop/Delivery workflows do not inject duplicate CSS.
- Extends repository validation so the heavy catalogue stylesheet cannot silently return to the eager dashboard head and the lightweight Overview preview cannot disappear.
- Preserves the previously completed lazy JavaScript, map runtime and workspace-style optimisations.

## Compatibility

- Pair with Bot v1.18.82.
- No Railway API contract, authorization rule, selected-server routing, Shop transaction, map geometry, coordinate conversion, DOM workflow or persistent-record changes.
