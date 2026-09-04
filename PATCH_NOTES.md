# World War Z Website v1.36.0 — Audit / Operations Centre

## Operations Centre
- Upgrades the existing Admin Audit Centre into one protected Audit / Operations Centre while preserving the existing `staff/server-audit` route.
- Adds live health cards for DayZ, Nitrado, Railway/API, Discord, the ADM watcher and restart intelligence.
- Adds the current server-side 0–100 operational health score, active health signals, open-failure count, recent sanitized errors, detected-restart summary and permanent operational history.
- Refreshes automatically while the view is open and remains compatible with the existing manual Refresh Centre action.

## Searchable audit
- Adds Operations as a dedicated unified-audit filter.
- Keeps the existing pagination, text search, subsystem/result/date filters and protected Railway authorization.
- Continues to exclude secrets, raw Discord IDs and internal metadata from the browser payload.

## Compatibility
- Pairs with **Bot v1.28.0**. The new live Operations Centre requires the matching bot/API update.
- Preserves Website v1.35.0 dashboard UX/accessibility improvements and all existing feature controllers.
- Chernarus and Livonia remain isolated through the selected-server context.
- No DayZ mission upload, Nitrado configuration change or wipe is required.
- The bounded map-cache generation remains unchanged.
