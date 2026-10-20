# Stage 2C — Dual-Nasdara dashboard retirement and safety

The live administration dashboard no longer presents the obsolete World Manager migration console, its navigation target, or its lazy-loaded assets. Server Control and Operations Centre remain available under their existing protected navigation. The active status/timeline instead describes separate Nasdara PvE and PvP server identities and database isolation.

The World Manager's older source and protected backend endpoints, role transition journal, migration ledger, and historic map assets remain deliberately unchanged / available for audit and rollback; the removed website UI is no longer an active path for performing migration or activation. Do not use retired World Manager APIs to perform a cutover without a separate security review and current in-game verification.

The primary server and secondary PvP server share Nasdara terrain but use **different registered identities, guilds, Nitrado services and database paths**. The World Profiles read-only API now rejects mismatched guild/server context before querying storage, and never projects primary-world migration data into the PvP world. This is a defensive guarantee, not a test of live player balances or a claim of successful activation.

The status dashboard's map fallback label uses the selected server context, and the service worker asset revision was advanced to distribute the website update to installed clients.

No player data, wallet balances, purchases, rentals, server controls, or Nitrado settings are changed by this release.
