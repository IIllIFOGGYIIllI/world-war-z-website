# WWZ World Profiles & Badlands Migration Roadmap

Stage 1 confirmed working: Bot v1.68.0 / Website v2.5.0.
Stage 2A candidate: Bot v1.69.0 / Website v2.6.0.

**Stage 2A:** Badlands-specific, transaction-safe test storage for Level/XP, wallet/bank and faction data; additional staged claim, coordinates and other domain records; read-only Admin World Manager coverage tracker. No live reset or switch.

**Stage 2B (future):** wire all gameplay, XP/level, bank, economy, quests, contracts, bounties, faction/flag, statistics, shop, cart, rental, delivery, event and background worker paths to world-specific storage with complete cross-world test coverage.

**Stage 2C (future):** Discord guild-wide managed-role synchronization, including uncached members, permissions, audit, retry queue, and safe rollback; never remove verified, Admin, donor, Livonia or unrelated roles.

**Stage 3 (future):** official PlayStation/Nitrado mission support, Badlands assets/coordinates and profile configuration, external backups and tested Chernarus restore, reconcile pending deliveries.

**Stage 4 (future):** Admin-approved, auditable Badlands activation and post-switch smoke tests; restore original Chernarus profile/mission/persistence on rollback.

Migration policy: Badlands starts Level 1, XP 0, Prestige 0, fresh wallet and bank, fresh factions and world-specific achievements. Chernarus history is preserved. Livonia is unchanged.

The Admin World Manager deliberately blocks activation until ALL outstanding items are implemented and tested.
