# World War Z Website v1.22.60

## Live Command Centre

This focused parity patch adds a staff operational overview backed by Bot v1.18.58. It aggregates existing backend systems rather than introducing duplicate browser-side state.

### Added

- New Admin/Owner **Command Centre** workspace.
- Live DayZ server, Nitrado, Railway API, Discord gateway, player population, tracked-online player, next-restart, and countdown status.
- Summary cards for pending deliveries, rentals/near-expiration, open/unclaimed tickets, moderation review work, operational failures, notification routing, active bounties/contracts, refunded orders, and open manual shop orders.
- Prioritized **Needs Attention** signals with direct navigation into the existing specialist workspaces.
- Read-only tracked-player and recent claimed-objective activity.
- Manual refresh plus a 30-second refresh interval only while the Command Centre is the active dashboard section.
- Command Centre attention badge in the Admin navigation.

### Notification routing parity

Bot v1.18.58 exposes five additional high-signal route choices in the existing Owner **Notifications & Webhooks** configuration:

- New support tickets.
- Delivery failures.
- Rentals near expiration.
- Claimed bounty/contract rewards.
- Configuration failures.

Routine player activity and ordinary quest-progress events are intentionally not routed to avoid Discord notification spam.

### Fixed and polished

- Corrects the stale dashboard sidebar version display to v1.22.60.
- Admins can see notification-routing health but the Owner-only routing shortcut remains disabled for non-Owners.
- Command Centre ticket attention links open the real synchronized Support workspace.
- The cumulative shop metric is labelled **Refunded orders**.

### Compatibility and safety

- Requires Bot v1.18.58 for `/api/admin/command-centre` and the additional webhook event definitions.
- No database, map geometry, shop/rental lifecycle, ticket engine, progression system, or Chernarus map asset is replaced.
- No Livonia work is included.
