# World War Z Website v2.4.1

## v2.4.1 — Event Planner Options & Wording

- Presents indefinite events as Ongoing Events throughout the Event Planner and Discord UI.
- Adds independent switches for pre-event restart notices and event rewards. Disabled sections are hidden in preview/public event detail, and rewards cannot be paid while switched off.
- Keeps all existing templates, saved values and Chernarus/Livonia map caches.


World War Z community dashboard and installable PWA for Chernarus and Livonia.

## v2.4.0 — Ongoing Campaigns & Clearer Event Planner

- Introduces an Ongoing Campaign template and duration option “Until manually ended.”
- Provides higher-contrast, larger form labels, options, checkboxes and helper text across the Event Planner only.
- Displays ongoing status instead of a fabricated end date; Admins can explicitly End Campaign in the existing audited workflow.
- Preconfigures Road to Badlands: Total Chaos as a Chernarus campaign example, with signups and automatic rewards off by default. Review its rules before publication.
- Keeps normal timed events, Discord panels, PvP KILLZONEs, historical event data, and Chernarus/Livonia isolation intact.
- Website-only cache shell rotation preserves the existing large shared map asset caches. Pairs with Bot v1.67.0.

## v2.3.0 — Live Event Management 2.0

- Adds a task-focused Live Event Desk to the existing Admin Event Planner: participant check-in, bulk check-in, team assignment, scorekeeping and local event leaderboards.
- Publishes the top player/team standings on the public results cards only after event results are published.
- Separates attendance/winner rewards into explicit Admin confirmation actions; check-ins and publishing results never automatically issue payouts.
- Preserves existing templates, Month/Week/List views, Discord announcements, hidden Raid Weekend privacy, and existing map/KILLZONE integration.
- Releases the PWA shell without resetting the bounded Chernarus/Livonia map caches; pairs with Bot v1.66.0.

## v2.2.0 — Admin Operations Centre 2.0

- Adds read-only automatic-delivery queue insights to the protected Admin Operations Centre: item deliveries and restart-based rentals, queue failures, approvals and cleanup tasks.
- Displays task-specific operational recommendations with links to the existing audited delivery/failure tools; opening the centre never retries, refunds, approves or restarts anything.
- Keeps service and worker health monitoring intact, using the existing authentication, server scope and Railway snapshot route.
- Refreshes the operations assets and PWA shell, retaining all Chernarus/Livonia production map caches.
- Pairs with Bot v1.65.0. No database migration or DayZ server restart required.


## v2.1.0 — Storefront 2.0, Multi-Destination Checkout

- Normal cart items support an individual delivery destination per item: main coordinates, server-specific saved location, or custom coordinates.
- Split quantities of a product between multiple destinations while enforcing the combined per-product 50-unit cap and existing stock, role, lifetime and cooldown limits.
- One atomic Cash or Protected Bank payment still creates separately traceable automatic delivery orders, each with its own validated destination.
- Supports both the standalone Survivor Shop and the authenticated dashboard storefront; existing vehicle rentals retain their 1–30,000 restart terms and original checkout.
- Checkout remains server-isolated and purchase-key idempotent. No destructive database migration or Nitrado restart.
- Cache update refreshes storefront JS/CSS without rotating Chernarus or Livonia map data caches.


## v2.0.0 — Final Polish & Consolidation

- Aligns modern public, login, shop, policies and dashboard styling with a single final polish pass in the existing whole-site stylesheet (no new overriding stylesheet layer).
- Makes public navigation intuitive: Home, Dashboard, Shop, Rules, Donations, Companion, Policies and Discord.
- Retains the *original* PWA install control when rebuilding the public menu, so its install handler is not lost; Companion remains discoverable.
- Adds Escape and outside-click mobile menu dismissal and a no-results explanation in Quick Access search.
- Improves mobile touch target sizing, legibility, focus/contrast and reduced-motion handling while preserving all functional maps and forms.
- Reduces off-screen changelog card rendering work without removing history.
- Advances the PWA application shell to v2.0.0 without rotating existing Chernarus/Livonia map tile or map data caches.
- Website only: existing Bot v1.63.0, login/authentication, bank, cart/checkout, ticket, event, faction, KILLZONE and Admin APIs are unchanged. No database or DayZ mission migration.

**Deployment:** Overlay the updated-files ZIP on Website v1.65.0. Keep a backup of v1.65.0 for rollback; verify mobile navigation and Discord sign-in on the live site.

## v1.65.0 — Whole-Site & Admin Experience

- Extends the shared modern WWZ style to the entire 16-page public/private website, including homepage, legal/help pages, companion, offline, error screens, storefront and donations.
- Adds a public `Start Here` section with accessible entry points for first-time survivors.
- Refreshes the signed-in gateway's Discord login and server selection layout; existing auth/session wiring is unchanged.
- Adds task-first Admin shortcut cards via the existing Command Centre navigation handlers, with `data-staff-only` role gating and the same protected back-end controls.
- Refines modern rounded surfaces, responsive layout and accessibility without touching economies, shop orders, event lifecycle, maps, KILLZONE geometry, Nitrado control handlers or database state.
- Rotates only website shell/static PWA caches. Existing Chernarus/Livonia map tile/data cache generations remain unchanged.
- Website-only presentation release paired with Bot v1.63.0. Live authenticated checking remains necessary.

## v1.64.0 — Community Experience Overhaul (Phase 3)

- Adds a beginner-friendly Action Centre guide to clarify active actions, unread updates and support requests; mobile advanced filters collapse without hiding the search box.
- Adds Faction shortcuts to the live directory, member invitations and existing request flow; invitation count mirrors the authoritative faction UI.
- Adds guided private-ticket support with direct access to the existing Create Ticket dialog, ticket history and protected appeal navigation.
- Adds a map quick-start guide, search focus/reset/fullscreen shortcuts and a compact mobile location-filter drawer. Existing map controls, coordinates, private pins and server map datasets remain unchanged.
- Modernises rounded card and responsive layouts across these community workspaces. Shortcuts invoke existing authorised controls only.
- Website-only changes. Preserves authenticated data boundaries, Chernarus/Livonia isolation, roles, commerce, map assets and bot v1.63.0. No database migration.


## v1.63.0 — Survivor Experience Overhaul (Phase 2)

- Adds a guided three-step Shop experience (browse, cart/checkout, order history), contextual cart help and a mobile cart shortcut displaying the existing server-specific cart count.
- Adds expandable mobile product filters, while keeping all desktop catalogue filters and all shop purchase/payment handlers unchanged.
- Fixes outdated WWZ Bank guidance to reflect optional Protected Bank checkout at the Survivor Shop; adds a clear deposit/withdraw explanation and shortcuts.
- Adds cross-workspace survivor shortcuts for Bank, XP/Prestige, Quests and Shop, plus accessible XP and Event Hub onboarding.
- Refines responsive cards, calendar controls and member-facing surfaces without touching transactions, pricing, roles, permissions, Nitrado, map tiles, or bot commands.
- Website-only release; pairs with Bot v1.63.0. No database migration.

## v1.62.0 — Modern UI Foundation

- Introduces a new, rounded charcoal/blood-red WWZ design layer across the public website, Survivor Shop, content pages and Command Centre.
- Adds prominent beginner-friendly dashboard shortcuts for the map, calendar, shop and survivor profile.
- Adds persistent quick access in the sidebar for Home, Map, Events, Shop, Bank, Support and the existing command search.
- Collapses long navigation groups by default, keeping the active workspace expanded without exposing new tools or changing permissions.
- Improves card spacing, contrast, typography, form controls, focus states and small-screen layout.
- Preserves all existing authenticated routes, data attributes, original API handlers, Chernarus/Livonia map tiles and map caches, events, carts, checkout and admin controls.
- Website-only UX update. No bot, database or Nitrado configuration changes are required. Staged broader page-by-page overhaul follows.

## v1.61.0 — Storefront Cart & Bank Checkout

- Raises normal catalogue Item checkout quantities to 50 while preserving Event Item / vehicle rental terms from 1–30,000 restarts.
- Adds a persistent, server-isolated shopping cart for up to 25 different normal catalogue products with editable quantities, running subtotal and one protected checkout.
- Adds Cash / Wallet or Protected Bank payment selection with live available-balance readouts.
- Keeps rentals on their specialised restart checkout while normal cart items share one validated delivery location.
- Shows the original payment source in private order history; compatible refunds return to that source through Bot v1.63.0.
- Mirrors cart/payment controls in both the standalone Survivor Shop and Command Centre shop workspace.
- Preserves role discounts, stock, per-player limits, automatic Railway delivery and Chernarus/Livonia isolation.

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
