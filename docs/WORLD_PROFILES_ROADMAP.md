# WWZ World Profiles & Badlands Migration Roadmap

Verified current state: Stage 1 World Manager (Bot 1.68.0 / Website 2.5.0). Stage 2A storage deployed (Bot 1.69.0 / Website 2.6.0), live record correctness still requires production verification. Stage 2B Phase 1 verified in World Manager for an existing Chernarus player (Bot 1.70.0 / Website 2.7.0). Stage 2B Phase 2 candidate: Bot 1.71.0 / Website 2.8.0.

| Stage | Status | Delivery / remaining work |
|---|---|---|
| 1 — World Manager | Confirmed live | Admin inspection and roles dry run |
| 2A — Isolated Badlands data | Deployed, awaiting full live verification | Transactional staging XP/bank/wallet, faction and domain schemas |
| 2B-1 — World-aware read routing | Confirmed live for member comparison | Admin-only per-member Chernarus/Badlands comparison, fail-closed world and guild context; no account changes |
| 2B-2 — Guarded write adapters | Built, awaiting deployment | XP/prestige and wallet/bank routes tested under server-map/guild guards, production commands and workers not yet migrated; producer idempotency still needed |
| 2B-3 — Producer and transaction integration | Next | Connect all XP, prestige, economy, banking, quests, bounties, contracts, faction, claims, statistics, shop, rental, event and worker read/write paths; test idempotency and end-to-end role-reward side effects |
| 2C — Discord role reconciliation | Planned | Guild-wide roles, permission/hierarchy preflight, retries, audit, Chernarus restore |
| 3 — Badlands mission and map | Await official PlayStation/Nitrado support | Validate maps, trader, PvP, spawn, delivery locations |
| 4–5 — Backups, cutover and rollback | Activation locked | Verified external backups, pending-order reconciliation, Admin-confirmed cutover and post-switch QA |

**Fresh Badlands policy:** Level 1, XP 0, Prestige 0, fresh wallet/bank, factions, claims, statistics and economy. Chernarus remains recoverable; PSN/Discord identity, Verified/Admin governance and applicable entitlements remain. Livonia is separate. Staging test rows are *not* automatically promoted into launch player data.

**Activation is NOT available in v1.71.0/v2.8.0.** Admin member comparison stays read-only. The new write gateways are internal APIs, not Discord/web actions; staged Badlands values are test data and production gameplay commands, purchases and workers are not redirected. Maintain rollback readiness.

Each release must update public Roadmap, Dashboard summary and Admin World Manager as applicable, actual public Changelog, both repository READMEs/roadmaps, release checklist and PWA cache revision; run validation and package only updated files.
