# World War Z Website v1.37.0 — Quest / Progression + Commerce Workflow

## Quest / progression overhaul
- Upgrades Objectives into the Quest & Objectives Centre with lifetime Quest Career statistics, claimable-reward totals, Daily/Weekly rotation progress, perfect-rotation streaks and milestones.
- Adds one-click **Claim All Completed** using the protected Bot action while preserving the existing per-quest reward path.
- Adds protected Admin rotation-health analytics for survivor engagement, current completion, ready-to-claim rewards and 30-day completion performance.
- Adds a real XP-source breakdown to Progression and a dedicated Quest Career contribution summary.

## Shop / donation workflow polish
- Adds a clear four-stage donation-order lifecycle from WWZ order creation through external payment, proof review and fulfilment.
- Adds duplicate-safe checkout presentation tied to the Bot v1.29.0 checkout idempotency key, so a timed-out retry reopens the same WWZ order instead of creating another one.
- Adds per-order next-action guidance for donation members and Admins, expanded order-health statistics and oldest-open visibility.
- Adds clearer next-stage guidance to normal Shop orders while preserving the existing delivery/restart workflow engine.

## Compatibility
- Pairs with Bot v1.29.0 and preserves the v1.36 Audit / Operations Centre and v1.35 dashboard consistency layer.
- Chernarus and Livonia remain isolated.
- The bounded map-cache generation remains unchanged; only changed quest/commerce assets receive update invalidations.
- No DayZ mission upload, Nitrado configuration change, map-data change or wipe is required.
