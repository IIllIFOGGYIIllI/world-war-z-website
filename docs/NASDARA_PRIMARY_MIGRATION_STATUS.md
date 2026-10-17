## Nasdara runtime readiness — 18 October 2026

**Verified in Railway:** Nasdara is the primary Bot identity (`map=badlands`, mission `dayzOffline.nasdara`), runtime is quarantined, the identity-only bootstrap imported 38 linked identities, and Livonia remains active. **No full gameplay activation has occurred.**

**Improved in the paired Bot patch:** the nine launch checks now show evidence-backed DB integrity and role-journal progress; pending original-world rentals are read **only from archived Chernarus storage** rather than disappearing when the bot switches to Nasdara. None of these diagnostics overrides owner approval or independent backup verification.

**Remaining launch requirements:** complete protected Discord role cutover and retain journal; reconcile historic rentals; independently verify off-server backup/restore; confirm live Nitrado mission; validate map-dependent shop, events, military zones, delivery routes, producers and recovery. Never activate old-coordinate actions solely on a player-facing name change.

---

## Nasdara primary-map migration — production status (17 October 2026)

**Official player-facing map name: Nasdara** (historically marketed as Badlands).
The bot's internal map selector remains `badlands` until its dependencies have
been migrated and tested. **Railway now identifies Nasdara as the primary Bot world, in gameplay quarantine**
with `map=badlands` and verified mission folder `dayzOffline.nasdara`.
Livonia remains active and independent; Chernarus history is preserved.
The protected launch checks and separate shop validation are still required.

World Manager's launch gate currently reports **1/9 checks verified**, with
**8 blockers**, including an outstanding rental delivery and missing off-server
restore evidence, full feature routing confirmation, role-transition completion,
official live Nasdara mission verification, geographic validation and rollback.
This is a read-only diagnostics section; website deployment cannot activate a
map or authorise unsafe shop/XP/rental writes.

**Migration path:** back up and restore-test first; reconcile old obligations;
verify actual Nitrado mission; configure the primary Railway entry as
`map=badlands` + verified mission + `paused=true`; verify the fresh database;
then use the protected Discord role migration and complete mission-bound
activation checks; only then enable
Nasdara's supported gameplay. Preserve Chernarus history/assets for rollback
and leave Livonia unchanged. Shop checkout, rentals and geography-dependent
systems require separate live tests before activation.

Read the operator runbook in the Bot repository:
`docs/NASDARA_PRIMARY_CUTOVER_20261017.md`.

---

# World War Z — Nasdara controlled primary cutover

**Prepared:** 17 October 2026 · **Live status:** not yet activated.

## World identity
- **Player-facing:** World War Z | Nasdara (primary); World War Z | Livonia (secondary).
- **Internal compatibility:** `map=badlands` and `WWZ_BADLANDS_LIVE` remain valid;
  do not change identifiers, persistent file paths or API query keys solely for the rename.
- Preserve Chernarus history, configuration, original map and event assets for rollback.
- User confirms that the Nitrado PlayStation primary game server is already on Nasdara.
  The Bot's live Railway startup has *not* been updated and still reports Chernarus.

## Blocker audit (latest dashboard)
1. Full world-scoped XP/economy/faction/shop/worker producer isolation not certified.
2. Protected all-member Discord role cutover and its private rollback journal not verified.
3. Actual live Nasdara mission identifier/path from primary Nitrado service not verified.
4. Private off-Railway/off-Nitrado backup copies and restoration tests not verified.
5. One outstanding `rental_deliveries` entry (and zero `item_deliveries`) needs safe reconciliation.
6. Spawnpoints, PvP/KILLZONEs, Trader, events and map locations not validated for Nasdara.
7. Bot-owned current-world Discord messages/panels and rollback publisher not live-validated.
8. End-to-end rollback dry-run has not been certified.

## Safe operator sequence
1. **Never post credentials, full database dumps, tokens or role journals to GitHub.**
   Record the existing Railway deployment/commit and save the full `WWZ_SERVERS_JSON`
   privately. Keep the primary Nitrado service and Discord guild identities unchanged.
2. **Back up private data off the active server**, not merely to the same persistent
   volume. Use the existing `tools/badlands_launch_backup.py` and
   `tools/badlands_verify_backup.py`; independently restore a copy, verify its
   checksum/integrity and record results. Include mission config/persistence,
   current roles and any role migration journal. Do not alter Livonia state.
3. Identify the one pending Chernarus rental delivery and fulfil/refund/resolve it
   according to existing obligations. Do not remove the row just to pass the gate.
4. Verify the *actual* running Nasdara mission path in the Nitrado primary config
   or server filesystem and match it to the API observation. No guessed mission names.
5. Change **only the primary** entry in Railway `WWZ_SERVERS_JSON`: retain its
   existing key/guild_id/nitrado_service_id, use `name=World War Z | Nasdara`,
   `map=badlands`, verified `mission_root`, `paused=true`. Keep secondary Livonia
   entry byte-for-byte unchanged. Keep `WWZ_BADLANDS_LIVE` unset or `0`.
6. On a quarantined restart verify the registry reports Nasdara/badlands as
   PRIMARY **PAUSED**, Livonia still ACTIVE, a physically separate
   `players_badlands.db` is correctly initialized and source Chernarus data are
   preserved. Do not enable old map-dependent queues or orders.
7. **Only now** does the protected **Apply fresh Badlands roles** owner flow
   become available in Admin → World Manager, as documented in
   `docs/BADLANDS_CUTOVER_ROLES_V181.md`. Perform the full member transition
   and preserve its private journal; Admin, Verified, donor and Livonia roles
   are protected. If any step fails, inspect the journal rather than blindly retry.
8. Run full world-isolation, integrity, payout, permissions and worker regression
   checks; reconcile all launch-gate evidence. Verify the exact Nitrado mission
   and authorize from authenticated **owner** World Manager controls. The
   authorization must match guild/service/mission/DB/journal; mere checkmarks
   do not replace external backups or live tests.
9. After readiness is genuine, set only primary `paused=false`, set
   `WWZ_BADLANDS_LIVE=1`, redeploy, and verify safe gameplay and audit logs.
   Keep unverified shop checkout, delivery location validation, PvP zones,
   event coordinates and Trader operations **disabled** until separately proven.
10. Validate website/dashboard/Discord primary-world selection, managed new
   panels and historical Chernarus archive; do not edit old announcements.

## Rollback
Set `WWZ_BADLANDS_LIVE=0` and primary `paused=true` immediately, then use
verified backups and exact original primary Nitrado mission+`WWZ_SERVERS_JSON`
registration. Restore Chernarus WWZ-managed Discord roles only from the correct
private completed role journal and explicit owner confirmation. Never overwrite
Livonia changes, delete `players_badlands.db`, or copy it over `players.db`.

## Shop follows cutover
Test Nasdara-native sellable classnames, stock, actual in-game inventories,
coordinate Y/X/Z, claimed safe delivery zones, wallet and bank settlement,
refund/cancellation idempotency, pending deliveries and retries using one test
account before allowing member checkout. Current cross-map carts and Chernarus
shop geography must never be reused.

## Documentation discipline
Every functional release updates Bot `README.md`, `docs/ROADMAP.md`,
`docs/WORLD_PROFILES_MIGRATION.md`, Website `README.md`,
`docs/WORLD_PROFILES_ROADMAP.md`, the visible Website/Dashboard roadmaps and
Changelog when user-facing functionality changes, keeping commit messages under
50 characters and ZIPs limited to changed files. Documentation status is not
proof of live activation.
