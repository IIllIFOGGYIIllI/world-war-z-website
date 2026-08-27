# World War Z Website v1.22.106

## Dual-server public parity
- Adds an explicit Chernarus/Livonia selector to the public Server Rules page.
- Public rules requests now send the selected `X-WWZ-Server` context instead of silently reading the primary server ruleset.
- Adds an explicit Chernarus/Livonia selector to the standalone Member Shop.
- Direct shop visits now select an available server themselves instead of requiring a previous dashboard selection.
- Switching shop server refreshes the isolated catalogue/account/orders, restart schedule, delivery locations and delivery-map context.
- Advances the PWA cache release so stale rules/shop JavaScript cannot persist after deployment.

## Compatibility
- Website-only patch; Bot v1.18.112 remains current.
- No server-owned persistent data or Donation Manager/order data is changed.
