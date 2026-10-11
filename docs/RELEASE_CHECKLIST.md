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
