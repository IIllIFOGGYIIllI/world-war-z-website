## Website v2.19.0 / Bot v1.82.0 — Exact-mission Badlands runtime activation
- [x] Owner-only explicit release/revoke interface and Bot authorisation endpoint.
- [x] Badlands server selection without aliasing Chernarus map coordinates or PvP intelligence.
- [x] Badlands map imagery is unavailable (not substituted) until confirmed native assets are provided.
- [x] World Manager reports whether activation is quarantined and why.
- [ ] Actual Nitrado mission, off-server backups, independent restore test and live cutover are externally verified.
- [ ] Map-native assets, live gameplay regression and full role rollback are externally tested.

## Website v2.19.0 / Bot v1.82.0 — Badlands role cutover & identity bootstrapping

- Private journalled Badlands managed-role transition and Chernarus rollback from the Admin World Manager, with full-guild re-fetch, explicit confirmation, bot hierarchy checks and protected-role exclusions.
- Badlands identity-only bootstrap from existing legacy DB, without copying player wallet, XP, shop orders or factions.
- The map switch still requires the official Nasdara mission and independently checked off-server backups; no automatic Nitrado map switch.

## Website v2.17.0 / Bot v1.80.0 — Badlands cutover quarantine
- World Manager now clearly separates check labels and detailed blockers for easier reading.
- Supports displaying Badlands as a quarantined primary world when the Bot is explicitly configured for the verified new mission.
- Bot keeps old Chernarus/Livonia DB and routes Badlands to a new private SQLite file. Bot gameplay, map-dependent workers and write operations remain locked pending validation.
- No Nitrado actions, discord role edits, historical message rewrites or off-server backups are performed by this release.

## Website v2.16.0 — Badlands urgent launch preflight
- [x] Show Admin-only critical blockers from Bot v1.79.0 API.
- [x] Preserve read-only Discord verification and existing staged world views.
- [x] Update roadmap, changelog and PWA cache to current release.
- [ ] Live Railway/Discord verify launch-audit response and full regression.
- [ ] Do not unlock Badlands until map verified and all cross-world write paths tested.

## Stage 2D Phase 4 (Bot v1.78.0 / Website v2.15.0)
- [x] Admin-only verification endpoint, bounded to 25 records, live Discord read checks
- [x] Fail-closed results for author/permission/message/guild mismatches
- [x] Page shows explicit on-demand verification without any execution button
- [ ] Live Railway/Discord smoke test and release deployment
- [ ] World migration remains blocked pending backups, map support and role/data cutover

- [x] Website v2.14.0 / Bot v1.77.0 public Roadmap, Dashboard Roadmap, Changelog, documentation and read-only World Manager updated.

- [x] Stage 2D2: Admin-managed Discord message registry, per-world audit and safety checks documented; no message-edit or world-activation controls.
- [x] Paired Bot v1.76.0 / Website v2.13.0 changelogs and World Manager roadmap updated; preserve all server data.
# WWZ release checklist — mandatory for every release

- [ ] Version the Bot and Website consistently; record exact pairing and deployment order.
- [ ] Update public `index.html#roadmap` **milestone status** (not just version text).
- [ ] Update `dashboard.html` Dashboard Overview roadmap and Admin World Manager milestone list/coverage.
- [ ] Add a **new visible entry** to `changelog.html` and update its Latest Release note.
- [ ] Update repository `README.md` and `docs/WORLD_PROFILES_ROADMAP.md`; update Bot `docs/ROADMAP.md` and `docs/WORLD_PROFILES_MIGRATION.md`.
- [ ] Explain safety, activation blockers, whether Discord roles or Nitrado are affected, and Chernarus/Livonia isolation.
- [ ] Bump PWA service-worker version and shell revision **without rotating map tile caches**.
- [ ] Test world scope/idempotency and existing features; run all website validators and frontend regression scripts.
- [ ] Publish updated-files-only archives with concise commit messages; do not claim deployment/production validation before user confirmation.
