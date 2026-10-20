# Nasdara PvE / PvP website preparation

The dashboard gateway now displays two servers as **PvE** and **PvP**, but retains per-server opaque keys and Discord authentication. Each gets its own logo; the global site shell uses the community logo.

The existing shared paper map remains unmodified. The KILLZONE editor, shop, rentals and admin controls must still pass end-to-end tests separately against BOTH Nitrado services before gameplay is unpaused. The old Chernarus and Livonia asset directories remain physically present in this release so no existing map-dependent script references produce missing-asset errors. They will be deleted in a subsequent, independently audited cleanup, after resolving all old-world references.

This is a staged migration. No live Railway variables, user data, site repository, role assignments, or Nitrado resources have been modified by preparing this patch.
