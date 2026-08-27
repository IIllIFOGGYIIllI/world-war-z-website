# World War Z Bot Website — v1.24.0

Website v1.24.0 is the World War Z **Operations Interface** visual redesign and performance pass. It replaces the softer v1.23 presentation with a sharper tactical command-centre shell, more distinctive storefronts and stronger hierarchy while preserving all existing Chernarus/Livonia workflows.

## Operations Interface redesign
- Rebuilds the visual language across all public, member and dashboard pages with hard-edged operations panels, segmented navigation, stronger typography, tactical status rails and more deliberate information hierarchy.
- Gives the homepage a new asymmetric operations hero and live-network board so the redesign is immediately visible.
- Reworks the Command Centre shell, sidebar, view headers and metric surfaces into a denser workstation-style interface without changing existing feature hooks.
- Refreshes Survivor Shop, Support WWZ, rules, policies, changelog, dialogs, forms, tables, status indicators, quick access and mobile presentation under the same design system.
- Keeps A–Z navigation/catalogue defaults where they improve discoverability while preserving intentional workflow and Admin-managed ordering.

## Performance pass
- Lazy-loads the standalone Shop's Leaflet/map runtime only when checkout actually needs a coordinate map.
- Lazy-loads Rules Manager, Donation Manager and Donation Orders assets only when those Admin views are opened.
- Shrinks the PWA install shell to the true minimum startup surface; heavier pages and feature bundles cache on first use instead of every install/update.
- Uses render containment/content visibility for long card-heavy views and requestAnimationFrame-throttled scroll UI work.
- Adds regression checks so heavy map/Admin assets cannot silently return to eager initial loading.

## Compatibility
Pairs with Bot v1.18.114. No database migration, API contract change, Nitrado configuration change, economy reset, map replacement or persistent-order rewrite is required. Existing donations, purchase tickets, shop deliveries, vehicle-spawn recovery, rules and dual-server isolation remain intact.
