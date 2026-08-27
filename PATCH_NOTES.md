# World War Z Website v1.24.0

## Operations Interface visual redesign
- Replaces the v1.23 consistency layer with a substantially different tactical/operations visual system across every website surface.
- Redesigns the global shell, navigation, homepage hero, dashboard workstation, sidebar, cards, metrics, forms, dialogs, tables, Shop, Donations, Rules and policy pages.
- Adds a WWZ network status rail and stronger Chernarus/Livonia operations branding on public/member surfaces.
- Preserves the established A–Z discoverability improvements and existing feature/data hooks.

## Performance optimisation
- Standalone Shop no longer downloads Leaflet, map CSS or WWZ map runtime during initial page load; checkout loads them on demand.
- Dashboard no longer eagerly downloads Rules Manager, Donation Manager or Donation Orders feature bundles for users/views that do not need them.
- PWA install/update precache now contains only the minimal application shell instead of heavyweight dashboard/feature assets.
- Long card-heavy surfaces use browser render containment/content visibility, and scroll-state UI work is animation-frame throttled.
- Validator now guards the lazy-loading and reduced-precache architecture against regressions.

## Compatibility
- Pairs with Bot v1.18.114.
- No backend API contracts, server configuration, member data, orders, economy balances, map datasets or Chernarus/Livonia isolation rules are changed.
