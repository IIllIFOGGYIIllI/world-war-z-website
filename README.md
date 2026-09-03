# World War Z Bot Website — v1.28.0

Website v1.28.0 is the completed **My WWZ / Companion + Admin Automation & Health** release and pairs with Bot v1.21.1 / Chernarus mission v1.1.

## My WWZ / Companion
- Adds the player-facing My WWZ command view with selected-server summary, survivor/progression/economy context, objectives, current activity and server-aware quick actions.
- Preserves strict Chernarus PvE / Livonia PvP separation and does not invent unsupported console telemetry.
- Improves mobile/PWA layout, refresh feedback, partial-data handling and selected-server shortcuts.

## Admin Automation & Health
- Adds 0–100 operational-health scoring, Automation Watch and prioritised Needs Attention signals.
- Tracks meaningful health changes, escalation, queue growth and recoveries while stable healthy snapshots stay quiet.
- Keeps the last known good Command Centre snapshot visible when a live refresh temporarily fails.
- Adds protected Admin Web Push delivery for meaningful warnings, critical conditions and recoveries.
- Admin-health push access is rechecked against current Discord Admin/Owner permissions at delivery time.
- Adds a real protected test-alert path from Administration Centre > Command Centre.

## PWA / Companion
- Advances the public website/PWA release label to v1.28.0.
- Keeps the existing map-cache generation so this metadata/cache-bust release does not discard downloaded Chernarus/Livonia map tiles.
- Every deployable website change still advances `WWZ_PWA_UPDATE_REVISION` so installed PWAs/TWAs receive the normal **Update Now** flow.
- The signed Android Companion remains v1.0.0 and continues to wrap the live PWA; no native rebuild is required for this website release.

## Compatibility
- Pairs with Bot v1.21.1.
- Chernarus mission v1.1 remains current; no mission upload or wipe is required.
- No Railway database replacement or migration is required.
- Existing Chernarus PvE / Livonia PvP isolation remains unchanged.
