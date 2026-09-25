# World War Z Website v1.60.1

World War Z community dashboard and installable PWA for Chernarus and Livonia.


## v1.60.1 — Simplified Event Planner

- Rebuilds Event Planner around a short template-first flow: choose event, set title/start/duration/location/visibility, then schedule.
- Moves Discord, reminder, setup, reward, signup and reusable-plan controls into collapsed Advanced Settings.
- Shows only the location controls relevant to the selected source (POI, saved location, KILLZONE or custom coordinates).
- Replaces raw timing-minute entry with readable duration, publication, reminder and restart choices while retaining the existing API values.
- Collapses Discord Calendar Panel settings, reusable plans/series, owner locations and owner loadouts into dedicated drawers.
- Adds optional recurring-series controls that stay hidden for normal one-off events.
- Preserves Month / Week / List calendar views, hidden Raid Weekend publication, KILLZONE integration, lifecycle management, attendance/results, Chernarus/Livonia isolation and Bot v1.62.0 compatibility.
- Website-only UI patch. No database migration, Nitrado change, DayZ mission upload or Bot update is required.


## v1.60.0 — Event Calendar Overhaul

- Month / Week / List calendar, browser-local times, eight editable WWZ templates and date-click creation.
- Draft, Scheduled, Announced, Live, Completed and Cancelled lifecycle. Drafts and unpublished hidden events stay private.
- Per-event editing, duplication, rescheduling, announcement preview and public activity updates.
- Chernarus/Livonia isolation; existing configured KILLZONES and public POIs; WWZ Map location/zone links.
- Persistent Discord calendar panel; Discord local timestamps; reminders and delayed Raid Weekend publication.
- Reward definitions never trigger automatic balance changes. Existing attendance/winner payments require explicit Admin confirmation.
- Pre-event restart notices only; actual restarts still require the existing Admin-confirmed Server Controls.
- Exactly 100 top-level Discord commands. Additive database changes; no deletion instructions.
- Website PWA/service-worker update revision: event-calendar-overhaul-3 (included with this release).

Rebased onto the uploaded Bot v1.61.4 + Website v1.59.3 source. Preserves KILLZONE runtime suspension, Admin immunity, ban logging and website runtime controls. Live Discord/Nitrado testing remains outstanding.

Rebased validation: 47 focused event/hotfix/isolation/command tests passed. Full bot suite: 835 passed, 2 skipped, 15 baseline failures also reproduced in the uploaded source (including the pre-existing banlist/logchannel inventory mismatch). Website, PWA, JavaScript syntax, map datasets and calendar DOM interaction checks passed. Exactly 100 top-level commands remain registered.


## v1.59.2 — Escrow Ledger & Balance Refresh Hotfix

- Treasury Activity displays escrow releases as the actual payout amount instead of “No balance change”.
- Admin grant/release actions now refresh the complete Treasury account state so a payout to the signed-in survivor immediately updates the protected-bank balance on screen.
- Escrow release confirmations show the recipient and resulting protected-bank balance when available.
- Advances the PWA shell to v1.59.2 without rotating the bounded Chernarus/Livonia map caches. Pairs with Bot v1.61.1.

## v1.59.1 — Workspace Title Layout Hotfix

- Expands the desktop Command Centre workspace-label allocation so `Community Treasury` and other longer workspace names are no longer prematurely truncated.
- Keeps the label responsive and preserves the existing compact/hide behaviour at narrower dashboard widths.
- Advances the installed PWA shell to v1.59.1 without rotating the bounded Chernarus/Livonia map caches.
- Website-only presentation hotfix; Bot v1.61.0, Treasury/Escrow logic, balances, database state and server isolation are unchanged.

## v1.59.0 — Treasury & Escrow Economy

This release adds shared economy management to the signed-in dashboard and pairs with Bot v1.61.0.

### Community treasury

- Adds **Community Treasury** under My Account with Available, Reserved and Managed Total balances.
- Members can contribute directly from protected WWZ Bank savings.
- Shows lifetime contributions/grants and recent audited treasury activity.
- Admins can correct the treasury, grant verified survivors, reserve escrow and release/refund active escrow holds.

### Faction treasury

- Extends the existing Faction workspace with treasury contribution controls.
- Faction leaders/officers can disburse treasury funds to verified members with an audited reason.
- Uses the existing faction treasury ledger rather than introducing a second faction-balance system.

### Isolation and marketplace boundary

- Chernarus and Livonia treasury/escrow records remain isolated by selected server.
- The Player Marketplace is still disabled and explicitly reserved for a later Livonia-specific economy release.
- Advances the installed PWA to v1.59.0 without rotating bounded map caches.

No Nitrado change, DayZ mission upload or database wipe is required. Pairs with Bot v1.61.0.

## v1.58.1 — WWZ Bank Layout Hotfix

- Fixes the WWZ Bank summary so Wallet, Bank and Net Worth use three deliberate equal-width cards instead of inheriting the global four-column metric layout.
- Keeps large currency values on one line with responsive display sizing and tabular numerals.
- Prevents Wallet / Bank / Net Worth labels from breaking across lines and removes the unused fourth-card gap.
- Stacks the banking workspace cleanly before the cards become cramped, with single-column controls on small screens.
- Advances the website/PWA revision without rotating the bounded Chernarus/Livonia map caches. Bot v1.60.0 is unchanged.

## v1.58.0 — WWZ Bank Phase 1

This release adds protected personal banking to the signed-in member economy workspace and pairs with Bot v1.60.0.

### Banking workspace

- Adds a dedicated **WWZ Bank** section under My Account.
- Shows wallet cash, protected bank savings and total net worth.
- Adds protected website Deposit and Withdraw controls backed by the Railway API.
- Shows recent bank activity plus lifetime deposit, withdrawal and transfer totals.
- Makes it clear that banked money is protected from player robbery and unavailable to normal spending until withdrawn.
- Bank-to-bank player transfers remain a Discord workflow through `/economy bank transfer` in Phase 1.

### Isolation and future economy work

- Banking follows the existing selected-server context, so Chernarus and Livonia balances remain isolated.
- No wallet balance or existing economy history is reset.
- The Player Marketplace is intentionally reserved for a later **Livonia-specific** economy phase.
- The PWA advances to v1.58.0 without rotating the bounded map caches.

No Nitrado change, DayZ mission upload or database wipe is required. Pairs with Bot v1.60.0.

## v1.57.0 — Repository Organisation & Performance Maintenance

This is a behaviour-preserving maintenance pass across the complete website repository. It retains the live Trader workspace, WWZ Map Hub, Chernarus public markers, private pins, Group/Faction layers, Livonia isolation, member/admin dashboards, shop, progression, events, tickets, donations and all existing protected API workflows.

### Repository and asset cleanup

- Removes the retired pre-WWZMap Chernarus JPG pyramid, duplicate road overlay, legacy map runtime and legacy Chernarus POI/place-name dataset.
- Keeps `assets/maps/chernarus/` and `assets/maps/livonia/` as the only production map datasets.
- Renames the shared map stylesheet to `assets/css/components/wwz-map.css` so the filename matches its Chernarus/Livonia role.
- Removes stale patch/install artefacts from the repository root.
- Optimises the animated Trader GIF payloads while preserving resolution, frames, looping and timing.

### PWA optimisation

- Separates shell/static cache generations from the bounded map-cache generation. Normal website updates can now replace old app assets without discarding downloaded map tiles.
- Removes the long historical per-URL invalidation table because versioned app caches are rotated atomically.
- Stops precaching Trader dashboard artwork during PWA installation; Trader assets are cached only when actually requested.
- Adds GIFs to the normal static-asset cache path.

No bot/database wipe, Nitrado change, DayZ mission upload or map-cache rotation is required. Pairs with Bot v1.59.0.


## Website v1.59.3 — Killzone Runtime Sync Hotfix

- Adds Admin website controls to enable or suspend PvP KILLZONES per selected server.
- Uses the same authoritative server-scoped state as Discord `/pvp killzones`.
- Managed KILLZONE rows display Suspended / Raid Weekend instead of Active while enforcement is paused.
- Public map KILLZONE overlays disappear while enforcement is suspended.
- Pairs with Bot v1.61.4.
