# World War Z Website v1.50.0 — Events, Rentals & Action Centre Polish

## Event Planner
- Shows the managed Discord-card state for each scheduled/live event.
- Admin can **Publish Discord Card** when missing or **Refresh Discord Card** when already tracked.
- The website now reflects Bot v1.51.0's single-card event lifecycle instead of encouraging repeated announcement posts.

## Rentals / Member Shop
- Adds a dedicated **My Rentals** order filter and supports direct `?section=rentals` links from Discord.
- Rental order cards show a protected **Cancel & Refund** action before the first counted restart.
- Once a rental has started, the same workflow becomes **End Rental** and clearly states that no automatic refund is issued.
- Cancellation requires a reason, is revalidated by Railway against the signed-in member/order state, and refreshes the private order history after completion.
- The Shop now points at the new protected `/api/account/shop/order/action` endpoint supplied by Bot v1.51.0.

## Economy Panels
- Adds a description for the new managed **Rentals** Discord panel available on both Chernarus and Livonia.
- Livonia still omits the Trader-only Pelt Information and Weed Operations panels.

## Compatibility
- Pairs with Bot v1.51.0.
- Advances the PWA release to v1.50.0 without rotating the bounded map-cache generation.
- No DayZ mission, Nitrado, map-data, player-data or server-wipe changes are required.
