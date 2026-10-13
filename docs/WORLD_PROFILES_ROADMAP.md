## Stage 2C Phase 1 — Role planner (Bot v1.73.0 / Website v2.10.0)

- Two-way read-only role plan for Badlands and Chernarus rollback with role binding safety diagnostics. No member role changes.
- Work independent of map data (complete Discord execution engine and account/transaction integration) can continue; geographic Badlands missions/traders/KILLZONEs/deliveries wait for official data.
- All-member enumeration, persistent jobs, hierarchy validation, live activation and backups remain blocked.

## Stage 2B Phase 3 — first reward producers (Bot v1.72.0 / Website v2.9.0)

**Status:** Built for upload, not yet validated in live reward events. Chernarus existing account comparison and Stage 2B Phase 2 staging dashboard were previously verified.

- Wired four live reward producers: Chernarus expedition first visits, Chernarus PvE progression milestones, Livonia hotspot rewards and explicitly approved community event payouts.
- Task-local server and world must match; community event payouts also check the saved event guild/map. Existing XP metadata, duplicate keys and legacy production storage continue unchanged.
- Not all XP/economy producers are routed. Quest claims, money/bank commands, shop, rentals, contracts, bounties, factions, flags, stats and scheduled workers remain outstanding; staged Badlands cannot be activated.
- Roadmap, Dashboard, World Manager, public Changelog, both repository READMEs and migration docs, and PWA revision are updated in this release. No map-cache rotation.

# WWZ World Profiles & Badlands Migration Roadmap

Verified current state: Stage 1 World Manager (Bot 1.68.0 / Website 2.5.0). Stage 2A storage deployed (Bot 1.69.0 / Website 2.6.0), live record correctness still requires production verification. Stage 2B Phase 1 verified in World Manager for an existing Chernarus player (Bot 1.70.0 / Website 2.7.0). Stage 2B Phase 3 candidate: Bot 1.72.0 / Website 2.9.0 (first four producer paths).

| Stage | Status | Delivery / remaining work |
|---|---|---|
| 1 — World Manager | Confirmed live | Admin inspection and roles dry run |
| 2A — Isolated Badlands data | Deployed, awaiting full live verification | Transactional staging XP/bank/wallet, faction and domain schemas |
| 2B-1 — World-aware read routing | Confirmed live for member comparison | Admin-only per-member Chernarus/Badlands comparison, fail-closed world and guild context; no account changes |
| 2B-2 — Guarded write adapters | Built, awaiting deployment | XP/prestige and wallet/bank routes tested under server-map/guild guards, production commands and workers not yet migrated; producer idempotency still needed |
| 2B-3 — Producer and transaction integration | In progress (4 guarded producer paths) | Connect all XP, prestige, economy, banking, quests, bounties, contracts, faction, claims, statistics, shop, rental, event and worker read/write paths; test idempotency and end-to-end role-reward side effects |
| 2C — Discord role reconciliation | Planned | Guild-wide roles, permission/hierarchy preflight, retries, audit, Chernarus restore |
| 3 — Badlands mission and map | Await official PlayStation/Nitrado support | Validate maps, trader, PvP, spawn, delivery locations |
| 4–5 — Backups, cutover and rollback | Activation locked | Verified external backups, pending-order reconciliation, Admin-confirmed cutover and post-switch QA |

**Fresh Badlands policy:** Level 1, XP 0, Prestige 0, fresh wallet/bank, factions, claims, statistics and economy. Chernarus remains recoverable; PSN/Discord identity, Verified/Admin governance and applicable entitlements remain. Livonia is separate. Staging test rows are *not* automatically promoted into launch player data.

**Activation is NOT available in v1.71.0/v2.8.0.** Admin member comparison stays read-only. The new write gateways are internal APIs, not Discord/web actions; staged Badlands values are test data and production gameplay commands, purchases and workers are not redirected. Maintain rollback readiness.

Each release must update public Roadmap, Dashboard summary and Admin World Manager as applicable, actual public Changelog, both repository READMEs/roadmaps, release checklist and PWA cache revision; run validation and package only updated files.
