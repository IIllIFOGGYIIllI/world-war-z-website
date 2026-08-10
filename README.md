## Website v1.22.60 — Live Command Centre

This patch adds a protected Admin/Owner operational overview backed by Bot v1.18.58.

- Adds a dedicated **Command Centre** combining existing server/restart health, player activity, moderation, tickets, deliveries, rentals, objective activity, configuration failures and notification health.
- Adds prioritized live attention signals with direct links to the existing specialist workspaces.
- Adds summary metrics for deliveries, rentals, tickets, moderation, failures, notification routes, objectives and shop refunds.
- Refreshes every 30 seconds only while the Command Centre is active, with a manual refresh available.
- Displays tracked online survivors and recent bounty/contract claims without duplicating production state.
- Supports five new high-signal Owner webhook route choices exposed by Bot v1.18.58.
- Keeps Owner-only notification routing protected while allowing Admins to see its health.
- Corrects the dashboard sidebar version to v1.22.60.
- No Chernarus map assets, Railway persistence, ticket engine or shop/rental lifecycle are replaced.

Requires Bot v1.18.58. No Livonia work is included.

## Website v1.22.59 — Structured Configuration Studio

This patch adds purpose-built Owner controls for the DayZ configuration systems already present in Bot v1.18.57.

- Adds a new **Structured Controls** workspace alongside the existing raw Mission File Editor.
- Adds gameplay and monthly temperature controls for common `cfggameplay.json` values.
- Adds weather controls and existing weather presets while deliberately preserving Chernarus snowfall values.
- Adds live `messages.xml` management including restart/shutdown deadline fields used by the existing restart intelligence.
- Adds targeted `types.xml` search/edit controls so thousands of loot records are not rendered at once.
- Adds event settings, child entries, event positions and optional Event Zone controls.
- Adds ordinary server-event creation using Event XML plus an optional Event Zone.
- Every structured change can be previewed as an exact diff before applying.
- The existing raw editor remains available for advanced/rare fields.

Requires Bot v1.18.57. No persistent Railway data or Chernarus map assets are replaced.
