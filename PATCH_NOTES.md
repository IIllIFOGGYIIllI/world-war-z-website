# World War Z Website v1.29.3 — Flag Claims Manager Layout + Admin Controls

## UI fixes
- Rebuilt the Flag Claims Manager admin layout so long Active Ownership lists can no longer stretch the left/settings column into large empty panels.
- Pending Requests and Manual Assignment remain paired at the top.
- Discord Routing and Special Flags are paired in their own top-aligned settings row.
- Active Ownership is now a separate full-width, bounded/scrollable section.
- Flag Claim History remains separate and bounded.
- Improved responsive behaviour, wrapping, form sizing and narrow-screen stacking across the Flag Claims workspace.

## Added
- Dashboard controls to set/change/remove the Admin-reserved flag independently for each server.
- Configurable Admin display label.
- Dashboard controls to set/change/remove the non-raidable flag independently for each server.
- Configurable non-raidable capacity from 1–25 slots.
- **Wipe All Current Claims** action for the selected server with an explicit confirmation step.

## Server isolation
- Chernarus and Livonia special-flag settings are independent.
- Claim wiping only affects the currently selected server.
- The shared flag catalogue and actual DayZ flag artwork are retained.

## Release / PWA
- Website/PWA revision bumped to v1.29.3.
- Flag Claims JS/CSS and lazy-loader revision updated so stale v1.29.2 dashboard assets are not reused.
