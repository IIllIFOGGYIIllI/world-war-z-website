## Website v1.22.62 — Chernarus Factions

This patch adds member-facing and Admin/Owner faction management backed by Bot v1.18.61.

- Adds a **Factions** member workspace with faction directory, leaders, members, armband/flag details, member capacity, optional Discord invite/icon links and Chernarus map-marker shortcuts.
- Shows the signed-in survivor's current faction and leader/member status.
- Adds protected **Faction Administration** for create/edit/delete, leader transfer and linked-survivor membership management.
- Adds configuration for Name, Leader, Armband, Flag, Member Limit, Colour, existing safe Discord Role, Zone ID, existing public Chernarus map marker, Discord Invite Link and Icon URL.
- Adds Factions to the unified Audit Centre filter/labels.
- Keeps role and marker identifiers opaque in the browser and relies on Railway for every protected authorization/write.
- Reuses the existing locked Chernarus map rather than adding or changing map geometry.
- No Livonia work is included.

Requires Bot v1.18.61.

## Website v1.22.61 — Advanced Ticket Settings

This patch adds the Owner-facing advanced controls for the synchronized support-ticket system backed by Bot v1.18.60.

- Expands the existing Owner ticket configuration surface instead of introducing a second ticket engine.
- Adds lifecycle settings for member closure, confirmation/reason requirements, claiming, feedback/reviews, inactivity, transcript handling and automatic archival.
- Adds a configurable maximum active-ticket count per member.
- Adds panel title, description, colour and new-ticket welcome copy.
- Adds an optional overflow Discord category for open tickets.
- Adds per-category enable/disable, initial priority, support-role override and notification-role routing.
- Keeps all protected writes Owner-authorized by Railway and uses the same existing Discord ticket channels/records.
- Keeps strict ticket privacy and the synchronized Discord + website support workflow intact.
- No Chernarus map assets, shop/rental lifecycle, progression system or Railway production state is replaced.

Requires Bot v1.18.60. No Livonia work is included.

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
