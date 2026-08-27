# World War Z Website v1.22.104

## Fixed
- Changing the Support WWZ display-currency selector now immediately changes the primary price shown on every donation item and package.
- The authoritative AUD amount remains visible underneath every converted price and remains the value recorded by checkout/order creation.
- Added a release-time indicative fallback FX table so conversions continue to display when the live exchange-rate request is unavailable or blocked in the browser.
- Live/cached/fallback rate status is shown clearly beside the selector.
- Refreshing the catalogue no longer resets the member's selected display currency.
- Corrected browser-locale region parsing used for first-visit currency selection.

## Compatibility
- Website-only patch; Bot remains v1.18.111.
- No donation catalogue, order, payment, ticket or fulfilment data is changed.
