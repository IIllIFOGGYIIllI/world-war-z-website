# World War Z Website v1.22.64

## Final Chernarus parity polish

- Replaces the Overview demonstration-only Recent Activity feed with live Railway-backed server, restart and connected-service intelligence.
- Hardens nested protected dashboard navigation so direct URL hashes cannot select Admin/Owner-only subsections without the required current access.
- Refreshes the public and dashboard roadmaps to the current Chernarus completion state.
- Corrects Shop & Trader navigation counts and aligns the automatic-delivery vs manual trader-ticket labels with the real workflows.
- Corrects the historical Objectives authentication hotfix changelog entry to Website v1.22.57.
- Removes stale roadmap references to additional ticket participants, the old v1.22.52/v1.18.48 release pair, and shop bulk controls that are already implemented.
- Keeps Bot v1.18.61 unchanged.
- No Railway database, API contract, Chernarus map, ticket engine, shop/rental lifecycle, progression, Objective or Faction data changes.
- No Livonia implementation.

## Deployment

Website-only patch. Keep Bot v1.18.61 deployed.

Files to delete: NONE
