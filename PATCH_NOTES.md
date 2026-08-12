# World War Z Website v1.22.74

## Dashboard startup optimisation

- Stops authenticated bootstrap from eagerly loading unrelated dashboard workspaces after sign-in/session restore.
- Keeps the signed-in account summary immediate, then re-dispatches the active dashboard view so only that view's existing loader runs.
- Avoids hidden startup calls for Appeals, Shop, Admin shop orders, Owner shop/appeal settings, server-action history, moderation cases and the live DayZ ban list when those views are not open.
- Removes the unconditional public Shop catalogue request from every dashboard page load; the catalogue now loads on demand when Shop opens.
- Adds validation that prevents unrelated authenticated bootstrap loaders or an unconditional Shop catalogue load from returning.
- Refreshes local asset cache versions for GitHub Pages.
- Updates stale public multi-server roadmap wording to reflect that Chernarus/Livonia isolation is operational, with mutable economy/progression/PvP and other server-owned data scoped independently.

## Compatibility

- Pair with Bot v1.18.73.
- No Railway API contract, selected-server routing, authorization rule, protected write, shop purchase/delivery behaviour, map geometry or persistent record changes.
