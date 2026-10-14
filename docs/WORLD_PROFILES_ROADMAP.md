## Website v2.19.0 — Badlands runtime and map selection safety
- Badlands appears as a distinct primary world when configured by the live Bot.
- No Chernarus fallback map, map tile, hotspot, coordinate size or expedition card for Badlands.
- Owner-only approval controls are conditional on six independently verified launch prerequisites; Railway and Nitrado operations stay external.

## Badlands Runtime Authorization (v2.19.0)

Protected owner-only authorization after a live Nitrado mission match, successful independent database checks and complete role transition journal. Operator confirms off-server backups, actual map assets, pending obligations and rollback. Activation applies after the next Railway Bot restart when `WWZ_BADLANDS_LIVE=1` is set, not from loading the page.

## Website v2.19.0 / Bot v1.82.0 — Badlands role cutover & identity bootstrapping

- Private journalled Badlands managed-role transition and Chernarus rollback from the Admin World Manager, with full-guild re-fetch, explicit confirmation, bot hierarchy checks and protected-role exclusions.
- Badlands identity-only bootstrap from existing legacy DB, without copying player wallet, XP, shop orders or factions.
- The map switch still requires the official Nasdara mission and independently checked off-server backups; no automatic Nitrado map switch.

## Website v2.17.0 / Bot v1.80.0 — Badlands cutover quarantine
- World Manager now clearly separates check labels and detailed blockers for easier reading.
- Supports displaying Badlands as a quarantined primary world when the Bot is explicitly configured for the verified new mission.
- Bot keeps old Chernarus/Livonia DB and routes Badlands to a new private SQLite file. Bot gameplay, map-dependent workers and write operations remain locked pending validation.
- No Nitrado actions, discord role edits, historical message rewrites or off-server backups are performed by this release.

## Urgent launch gate — Website v2.16.0 / Bot v1.79.0
- Adds Admin launch preflight with checked blockers for production isolation, off-server backups, pending deliveries, console mission, roles, historical messages, Badlands map assets and tested rollback.
- A status is only marked verified when backed by existing evidence; absent proof is blocked. This is a read-only launch dashboard, **not an activation feature**.
- Remaining critical work: finish actual Badlands production gameplay routing and safe rollback, verify the PlayStation/Nitrado mission and new map geometry, test off-server restore and live integrations.

## Stage 2D Phase 4 — Discord message read-only preflight · Website v2.15.0 / Bot v1.78.0
- Admin World Manager includes a manual Verify registered messages action against the current active Chernarus Bot guild. Checks at most 25 saved registry entries, not arbitrary Discord messages.
- Bot verifies guild/channel, message existence, actual Bot author, view/history/send/embed permissions and whether saved references changed mid-check. Reports failures without changes.
- Verification is transient. No Discord edits, bulk refreshes, historical imports, world activation, role changes, new map coordinates or website map changes. Recheck permissions/ownership before any future operation.
- Radio Zenit is registered only on its next supported publish/refresh. Preserve all historical Chernarus content and keep Livonia isolated.

## Stage 2D Phase 3 — Managed Discord transition planning · Website v2.14.0 / Bot v1.77.0
- Add Bot-owned Radio Zenit Trader panel publications/refreshes and periodic server-status updates to the guild/world-scoped message registry. Existing event/calendar and ownership checks remain.
- Admin World Manager now displays a *metadata-only* Badlands transition plan: rebuild primary server status after verified activation, publish a new Badlands event calendar rather than rewriting Chernarus history, preserve historical event announcements and Chernarus Radio Zenit Trader location/coordinates.
- A saved message ID is **not** live proof of author, access, message existence or edit permissions. No Discord network preflight, write/refresh executor, actual activation or historical rewrite is implemented. Each action requires future live verification and approved external backup/rollback plan.
- Chernarus remains active; Livonia is independent; Badlands Level 1/economy staging, role executor, map data and gameplay integration blockers remain unchanged.

## Stage 2D Phase 2 — Managed Discord message registry · Website v2.13.0 / Bot v1.76.0
- Newly published WWZ event/calendar and server-status messages are indexed by guild, map, type and Discord message ID. Replacements produce audit entries; existing messages stay untouched.
- Admin World Manager shows registry inventory and explicit refresh blockers. No author verification, bulk refresh, Discord channel rename, role update or Badlands activation is enabled.
- Future: validate Bot ownership and permissions, plan controlled edits/replacements, reconcile old panels, implement rollback. Continue protecting historical Chernarus and Livonia.

## Stage 2D Phase 1 — Dynamic active-world branding · Website v2.12.0 + Bot v1.75.0
- **Built:** registry-derived, public read-only world-branding API; live homepage/current-world labels; dashboard/admin World Manager preview; new managed Bot server-status and community-event map labels.
- **Blocked:** rewriting historical references, renaming Discord guild/channels, updating existing persistent embeds (requires tracked message IDs and permission preflight), renaming custom rules, Badlands maps/coordinates/deliveries, live gameplay migration and activation.
- Chernarus remains the active primary world. Badlands staging is **not** an active-world name source; Livonia stays independent.

# World War Z Website v2.11.1 — Role Dry-Run Stability (14 October 2026)

- Admin World Manager shows the most recent persisted full-roster plan, with prior plans collapsed; accurate post-refresh success/status messaging even after an interrupted HTTP response.
- Disables repeat clicks while scanning and rechecks role-scan capability after the operation. Bot reuses identical staged plans without adding duplicate jobs.
- Paired Bot v1.74.1 safely handles missing Discord audit-log target IDs without breaking audit entry handling.
- Roadmap: future Stage 2D dynamic world branding will follow verified active-world state for supported Website pages, Bot text and Bot-owned Discord embeds/panels; preserve historically accurate Chernarus labels, offline/static artifacts and Livonia. This release does NOT switch branding or activate Badlands.
- Preserve public Roadmap/Changelog, both READMEs, World Manager, versioned assets and existing map caches on every release.

## Stage 2C Phase 2 — Full roster scans and durable plans (Bot v1.74.0 / Website v2.11.0)

- Admin-only **on-demand** Discord full-member scan via `fetch_members(limit=None)`, requiring complete roster match; interrupted or incomplete scans persist no plan.
- Durable, guild-scoped **planned-only** member role deltas in additive SQLite tables, with a dry-run audit record, safe role exclusions, scan history and bounded retry-backoff design.
- Role mutations and worker execution **do not exist in this release**; no automatic retries are running. Stored plans cannot be applied without fresh permission, role, member and world-state preflight and explicit activation in a later release.
- Preserves all live Chernarus/Livonia data, protected Discord roles and the 100 top-level command design. Badlands map assets, live migration and backups remain blocked; Stage 2B gameplay producer completion also remains outstanding.
- Paired with Bot v1.74.0 and Website v2.11.0; public Roadmap, Dashboard roadmap, World Manager, Changelog, documentation and PWA revision updated together.


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

### Stage 2D — Dynamic active-world branding (planned, not active)

- Replace hardcoded **current-world** Chernarus presentation with a central validated active-world label throughout supported Website pages, Dashboard, Bot responses and managed Discord embeds/panels when Badlands is actually activated.
- Track Bot-owned editable Discord message IDs, schedule refreshes and publish replacements for uneditable legacy announcements as needed. Discord server/channel renaming only for explicitly opted-in managed names; never rename unmanaged channels.
- Keep historical Chernarus events, archived records and rollback assets accurately labelled; leave Livonia and unrelated communities untouched.
- Activation requires validated PlayStation/Nitrado Badlands support, approved migration, transaction safety, backups, role-sync and smoke tests. No global find-and-replace of legacy data.
