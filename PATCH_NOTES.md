# World War Z Website v1.40.0 — Member Dashboard / Home Overhaul

## Personal command centre
- Rebuilds the signed-in Overview into a personalised WWZ home instead of a generic collection of dashboard summary cards.
- Adds survivor identity/server context, progression, wallet, faction, quest and Action Centre metrics at the top of the member experience.
- Adds focused cards for current Chernarus PvE / Livonia PvP intelligence, current priorities, quests/progression, faction status, upcoming community events, shop/donation orders, support tickets and recent activity.
- Adds one-click quick links into the existing Account, Progression, Objectives, Factions, Events, Shop, Tickets, Action Centre, Map and selected-world Operations workspaces.

## Resilience / responsive UX
- Keeps the existing public guest Overview available until Discord sign-in and server selection allow the private member home to load.
- Handles partial backend source failures without hiding otherwise healthy cards and automatically refreshes while the Overview is active.
- Improves desktop, tablet and mobile/touch layouts for the personal home while retaining the dashboard-wide v1.35 consistency/accessibility layer.

## Compatibility
- Pairs with Bot v1.32.0 and its protected server-scoped member-home aggregator.
- Chernarus/Livonia isolation and all existing Action Centre, Data Management, Audit / Operations, faction, event, quest, commerce and map systems are preserved.
- Advances the public website/PWA label to v1.40.0 without rotating the bounded map-cache generation.
- No database migration, DayZ mission upload, Nitrado configuration change, map-data change or server wipe is required.
