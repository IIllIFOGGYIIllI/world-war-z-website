# World War Z Website v1.22.79

## Commerce runtime lazy-loading optimisation

- Removes `shop-helpers.js`, `shop.js` and `delivery.js` from unconditional dashboard startup.
- Loads the complete commerce runtime only for Shop, Shop Administration, Delivery, Saved Locations, Trader Order fulfilment, server configuration, configuration workflow or backup-history views.
- Defers another 168,707 bytes of commerce-specific JavaScript on a normal Overview visit.
- Moves Discord-authentication and initial dashboard navigation startup out of `delivery.js` into a dedicated `bootstrap.js`, removing the hidden requirement for Delivery to remain eager.
- Keeps Shop/Delivery cross-module behaviour intact by loading Shop helpers, Shop and Delivery in a controlled sequence before activating the requested view.
- Prevents unrelated Discord Logs, Notifications and Appeals configuration views from triggering server-configuration overview/backup reads.
- Avoids repeating the initial lazy-asset pass after the dashboard has already emitted its first real view-change event.
- Extends site validation so the commerce bundle cannot silently return to eager startup and the bootstrap ownership cannot drift back into Delivery.
- Refreshes GitHub Pages cache versions.

## Compatibility

- Pair with Bot v1.18.78.
- No Railway API contract, authentication rule, Shop transaction, Delivery state, selected-server routing, protected action, map geometry or persistent-record changes.
