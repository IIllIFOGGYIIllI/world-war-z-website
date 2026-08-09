# World War Z Website v1.22.49

## Fixed
- Restart countdowns no longer remain at `0m remaining` after the displayed restart time has passed.
- The shared website HTTP layer now invalidates expired `next_scheduled_restart` values and converts them to a safe restart-sync-pending state.
- Dashboard Overview/Operational Health, standalone Survivor Shop orders, dashboard My Orders and Automatic Delivery Monitor all consume the normalised restart state.

## Compatibility
- Pairs with Bot v1.18.45.
- No Railway database, shop catalogue, economy, rental pricing, delivery workflow or Chernarus map changes.

## Files to delete
NONE
