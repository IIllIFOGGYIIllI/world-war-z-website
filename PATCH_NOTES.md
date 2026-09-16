# World War Z Website v1.54.3 — Shop Sync Controls & Item Spawn Retry

## Shop Administration
- Adds a persistent **Catalogue Sync Exclusions** workspace using exact DayZ classnames or `*`/`?` wildcard patterns.
- WWZ seeds exclusions for applied splint helper types (`Splint*Applied*`), chem lights (`ChemLight*`) and party tents (`PartyTent*`).
- Adding an exclusion immediately hides matching source-backed catalogue entries and prevents matching live types from being imported again.
- Source-backed entries gain **Delete & Exclude**; manual entries gain protected **Delete**. Historical order snapshots remain intact.
- Source-backed names/categories expose **Preserve custom name/category** and **Use Synced Label** controls so Owner presentation changes are intentional instead of silently overwritten.
- Catalogue-sync feedback reports repaired classnames, refreshed labels, excluded types, hidden matching entries and unresolved values requiring Owner review.

## Automatic Delivery Administration
- Adds **Retry item spawn** to normal automatic item deliveries, not just vehicle/event rentals.
- The retry warning makes clear that no second charge occurs and that retrying an item already present in game can duplicate it.
- Retry uses the same paid order and recorded X/Y/Z/rotation while Railway creates a fresh spawn deployment for the next restart.

## PWA / compatibility
- Advances the public website/PWA release to v1.54.3 and refreshes the changed Shop, Delivery, Core and lazy-loader cache keys without rotating the bounded map-cache generation.
- Pairs with Bot v1.55.3. Chernarus PvE enforcement remains active and Livonia remains isolated and Full PvP.
- No database wipe, DayZ mission upload or Nitrado configuration change is required.
