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
