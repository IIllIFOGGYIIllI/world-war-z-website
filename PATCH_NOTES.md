# World War Z Website v1.35.0 — Dashboard UX / Consistency Pass

## Command Centre consistency
- Adds a final dashboard-wide consistency layer across all member, Admin and Owner workspaces.
- Standardises panel hierarchy, spacing, control sizing, action groups, toolbars, status messaging, empty states, forms, tables and dialogs without changing feature behaviour.
- Aligns the legacy and current sidebar-width variables so the fixed navigation and main content grid no longer drift apart.
- Corrects the stale Command Centre footer label to Website v1.35.0.

## Responsive and accessibility improvements
- Improves narrow-screen wrapping and stacking for view headings, panel actions, flag/history filters, ticket controls, event/shop builders, progression controls and other dense workspaces.
- Adds consistent touch targets, focus treatment, reduced-motion and increased-contrast support.
- Adds responsive containment for static and dynamically-created tables.
- Adds non-invasive runtime labelling for legacy/dynamic form controls, data tables, dialogs and status messages while preserving each existing controller as the source of truth.
- Adds explicit labels to remaining legacy static controls in Flag Claims, Configuration, Tickets, Progression, Appeals and Shop administration.

## Compatibility
- Website-only release paired with **Bot v1.27.0**; the bot does not need to be replaced for this update.
- No Railway database migration, Discord command change, DayZ mission upload, Nitrado configuration change or wipe is required.
- Chernarus/Livonia isolation, Player Intelligence, Livonia Deathmatch Rotation, Community Events, Flag Claims and Faction governance are unchanged.
- The bounded map-cache generation remains unchanged so installed PWA map caches are not deliberately discarded.
