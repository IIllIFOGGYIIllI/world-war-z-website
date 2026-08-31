# World War Z Bot Website — v1.27.0

Website v1.27.0 completes the **Notifications & Community Workflow Enhancements** milestone and pairs with Bot v1.21.0 / Chernarus mission v1.1.

## Community Hub
- Adds privacy-safe 14-day analytics for the selected Chernarus or Livonia service.
- Adds active-location trends, participation summaries, scheduled/live Event Calendar and existing server-FPS visibility.
- Adds a staff Event Planner with reusable Owner-managed plans, scheduling, immediate starts and cancellation.

## Opt-in browser notifications
- Adds member-controlled topics for events, server status, ticket replies, PvE/PvP rotations and shop/orders.
- Uses the installed PWA/service worker for notification display and safe dashboard deep links.
- No browser is subscribed until the signed-in member grants notification permission and opts in.

## Mobile / PWA
- Adds responsive Community Hub layouts, larger touch targets and safe-area spacing.
- Advances the service-worker release to v1.27.0.

## Native wrapper foundation
- Adds Capacitor 8 configuration and a repeatable `native:prepare` / `native:sync` workflow.
- The website/PWA remains the canonical source; generated native wrappers do not become a separate frontend.
- Google Play / Apple publication requires administrator-owned signing credentials and store accounts and is intentionally not embedded in the repository.

## Compatibility
- Pairs with Bot v1.21.0.
- Chernarus mission v1.1 remains current; no mission upload is required.
- Existing Chernarus PvE / Livonia PvP features and server isolation remain unchanged.
