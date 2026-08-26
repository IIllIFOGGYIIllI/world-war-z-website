# World War Z Website v1.22.103

## Multi-Currency Donation Prices
- Added a storefront display-currency selector while keeping AUD as the authoritative donation/order currency.
- Uses live indicative AUD exchange rates from Frankfurter and caches the last successful rates locally so temporary FX-provider outages do not break the storefront.
- Includes AUD, USD, NZD, GBP, EUR, CAD, PHP, JPY, SGD, INR, ZAR, CHF, SEK, NOK, DKK, KRW, BRL, MXN, PLN and AED display options.
- The first visit can select a sensible display currency from the browser locale; members can override it at any time and their choice is remembered.
- Product cards, checkout summaries and My Donation Orders show the selected approximate conversion alongside the real AUD amount.
- PayPal/Nitrado remain responsible for the final payment conversion/rate/fees; no card details are collected by WWZ.

## Compatibility
- Website-only patch; Bot v1.18.111 remains current.
- Existing donation orders, purchase tickets, fulfilment, Donation Manager, Rules Manager, shop, quests and maps are unchanged.
