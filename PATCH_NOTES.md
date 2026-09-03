# World War Z Website v1.30.0 — Flag Claims Phase 2

## Member experience
- Flag requests can optionally use the member's registered WWZ faction instead of free-text ownership.
- Active owners can request a transfer of their flag to another player/group or their registered faction.
- Members can view and cancel their own pending transfer requests.
- Public/member flag details show richer ownership/status information without exposing private Admin notes.

## Admin Flag Claims Manager
- Added pending transfer review with Approve / Reject actions.
- Added private Admin notes on active claims.
- Added activity review indicators and stale-claim filtering using the configured inactivity threshold.
- Added recent flag activity and expanded history controls.
- Added optional faction linking for manual Admin assignments.
- Added configurable flag-activity notification routing and inactivity threshold.
- Existing wipe, Admin-reserved flag and non-raidable flag controls remain available.

## Layout / responsive polish
- Preserves the v1.29.3 Flag Claims Manager layout fix: ownership/history remain bounded and cannot stretch the left settings column.
- Phase 2 cards, filters, forms and action rows follow the same responsive layout on desktop and narrow screens.

## Server isolation
- Chernarus and Livonia claims, transfers, notes, notification routing and inactivity review settings are independent.
- No base coordinates or base-map markers are introduced.

## Release / PWA
- Website/PWA revision bumped to v1.30.0.
- Flag Claims assets and lazy-loader revision bumped to prevent stale v1.29.3 UI assets.
