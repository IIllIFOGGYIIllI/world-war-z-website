# World War Z Bot Website — v1.22.104

Website v1.22.104 fixes the Support WWZ multi-currency selector so changing currency immediately changes the visible storefront price. The selected local currency is now the primary displayed amount while the authoritative AUD price remains directly underneath.

Live Frankfurter rates are still preferred and cached, but a built-in indicative fallback table prevents the selector from becoming inert when the browser cannot reach the live FX provider. Refreshing the catalogue no longer resets the member's selected display currency, and browser-locale currency inference is corrected.

Pairs with Bot v1.18.111. Donation orders, purchase tickets, fulfilment, Donation Manager and all existing dashboard systems are unchanged.
