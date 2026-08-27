# World War Z Website v1.23.0

## Unified website overhaul
- Added a new shared `ui-system.css` design layer to every website page.
- Added a shared `ui-system.js` navigation/accessibility controller to every website page.
- Standardised the visual treatment of public headers, policy headers, donation/shop headers, dashboard shell, cards, panels, forms, buttons, tables, dialogs and footers.
- Added consistent public navigation and active-page states.
- Added searchable Quick Access with Ctrl/Cmd+K and a back-to-top control on public pages.
- Added compact on-page navigation for the homepage and donation storefront.
- Alphabetised Dashboard navigation items within each existing access group, keeping Overview first.
- Standalone Survivor Shop now defaults to Name A–Z; Dashboard member shop also renders items A–Z.
- Donation storefront packages, categories, items and payment methods render A–Z while Admin-managed source ordering remains stored unchanged.
- Updated the homepage to represent both active Chernarus and Livonia worlds.
- Advanced the PWA release/cache revision and expanded validation for the unified design system.

## Compatibility
- Website-only update; Bot v1.18.113 remains current.
- No backend API, server configuration, user data or persistent database changes.
- Chernarus/Livonia isolation and all existing shop, donation, ticket, rules, map and delivery workflows remain intact.
