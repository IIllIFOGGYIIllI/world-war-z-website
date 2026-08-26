# World War Z Website v1.22.102

## Donation Storefront
- Added a public `donations.html` Support WWZ storefront driven directly by the active Donation Manager catalogue.
- Members can select Chernarus/Livonia, sign in with Discord, choose a single item or package, select PayPal/Nitrado and create a tracked donation order.
- Payment remains external; the site never collects card details. AUD remains authoritative and optional USD estimates remain approximate.
- Added `My Donation Orders` with immutable order IDs, status, payment reference/proof submission, purchase-ticket links and benefit-by-benefit fulfilment progress.
- Product cards include a preview-ready presentation area for a later donation preview/media manager.

## Admin Donation Orders
- Added Admin/Owner `Donation Orders` management with status/search filters, payment review, approve/request-info/reject actions and per-benefit fulfilment controls.
- Purchase-ticket links and automatic/manual benefit state are visible from the same order record.

## PWA & Navigation
- Added Donations links from the public homepage and Survivor Shop.
- Added the donation storefront and new order assets to the PWA shell and bumped the cache release so GitHub Pages clients receive the new version.

## Compatibility
- Pairs with Bot v1.18.111.
- Existing Donation Manager, Rules Manager, survivor shop, quests, tickets, maps and dashboard workflows are preserved.
