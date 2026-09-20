# World War Z Website v1.59.0

World War Z community dashboard and installable PWA for Chernarus and Livonia.


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
