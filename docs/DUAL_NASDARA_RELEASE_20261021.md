# Nasdara PvE / PvP website preparation

The dashboard gateway now displays two servers as **PvE** and **PvP**, but retains per-server opaque keys and Discord authentication. Each gets its own logo; the global site shell uses the community logo.

The existing shared paper map remains unmodified. The KILLZONE editor, shop, rentals and admin controls must still pass end-to-end tests separately against BOTH Nitrado services before gameplay is unpaused. The old Chernarus and Livonia asset directories remain physically present in this release so no existing map-dependent script references produce missing-asset errors. They will be deleted in a subsequent, independently audited cleanup, after resolving all old-world references.

This is a staged migration. No live Railway variables, user data, site repository, role assignments, or Nitrado resources have been modified by preparing this patch.

## Stage 2B — shared-terrain routing and PWA cache (21 October 2026)

- Preserve server-targeted Nasdara map links across reloads and Discord OAuth returns. PvP-targeted coordinates cannot be applied to PvE just because both use `map_key=badlands`.
- POI-only and incomplete coordinate links do not create fake (0,0) coordinates; malformed incoming links do not reactivate unrelated saved links.
- Update dashboard, lazy map loader and PWA cache revisions. This **does not independently fix or verify the reported iPhone Discord-login issue**.
- A paused bot world gives map-neutral user-facing feedback; sample environment documents distinct dual-server identities and persistent database paths.
- Tests cover physical SQLite isolation, selector validation, server-targeted map-link handling and website structure. **Live service operations remain unverified.**
- Source-only patch: no Nitrado, Discord, role, bank, shop, rental, progress, Railway or production database actions, and no deletion of old map assets.
