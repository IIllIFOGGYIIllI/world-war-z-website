# Website v1.22.39 — Site-Wide UI Overhaul

## Changed

- Added one shared visual layer across all 10 HTML pages so the public site, dashboard, standalone Survivor Shop, legal/policy pages and 404 screen use the same professional design language.
- Increased and standardised rounded geometry for panels, cards, sections, navigation, forms, dialogs, tables, map surfaces and controls.
- Refined dark surfaces, shadows, borders, spacing and hover/focus states while preserving the World War Z red identity.
- Restyled dashboard member/Admin/Owner workspaces, progression, moderation, configuration, automatic delivery, saved locations and shop management without changing their JavaScript behaviour.
- Restyled standalone shop hero, item cards, order cards, account metrics, checkout dialogs and coordinate map.
- Restyled homepage feature cards, status strip, terminal, FAQ and community sections.
- Restyled Terms, Privacy, Community Guidelines, Moderation Policy, Legal and Changelog content/navigation.
- Added stronger keyboard focus visibility and reduced-motion handling.
- Updated website validation so every HTML page must load the shared site-wide theme at the current release cache version.
- Rebuilt the public and dashboard roadmaps around the current production state: stable core systems, deferred natural XP/Prestige QA, planned Livonia/multi-map support, planned multi-server architecture and later product/progression improvements.
- Added Livonia as an explicit future map project covering its own satellite tiles, roads/trails, settlement names, coordinate model, markers and map-aware shop/saved-location workflows.

## Compatibility

- Pairs with Bot v1.18.42.
- Website-only presentation patch; no bot update is required.
- No Railway API contract, database record, shop/rental delivery logic, Nitrado control, map geometry, satellite tile or progression behaviour is changed.
- GitHub Pages compatibility is preserved.

## Validation

- `python scripts/validate_site.py --require-map-assets` — PASS.
- 10 HTML pages validated.
- 239 static buttons and 31 dynamic button builders audited.
- 4,810 Chernarus JPG tiles verified.
- 9 road groups / 52,006 renderable road line parts verified.
