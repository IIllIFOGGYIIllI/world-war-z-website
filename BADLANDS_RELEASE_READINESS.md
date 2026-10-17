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

# World War Z / Badlands release readiness

Website v2.17.0 improves World Manager launch-check accessibility and displays a quarantined Badlands state when the primary Bot reports it. It cannot activate a DayZ mission, move economy records or execute Discord roles.

- Primary Chernarus and independent Livonia remain the active baseline unless the operator configures a *verified* Badlands mission.
- A new Badlands database is physically separate from the existing Chernarus/Livonia persistence; Bot v1.80.0 keeps primary gameplay interactions paused while migration verification is outstanding.
- `Admin → World Manager → Badlands Launch Gate` remains read-only. No green status is assigned for untested external backups, Nitrado map confirmation, role reconciliation or rollback tests.
- Read-only labels and diagnostic detail now wrap onto separate lines.
- Full operator and rollback guidance is in the Bot release's `docs/BADLANDS_LAUNCH_CUTOVER_V180.md`.
