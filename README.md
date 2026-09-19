# World War Z Website v1.56.0

World War Z community dashboard and installable PWA for Chernarus and Livonia.

## Current release
Map Hub Coordinate Hotfix corrects the public WWZ Interactive Map Hub opening at a false `X 0 / Z 0` Discord location when no coordinate query was supplied. A normal Map Hub launch now opens the intended Chernarus overview instead of the southwest map corner.

Public POI merging also now treats same-location live/API markers as authoritative, preventing the existing Radio Zenit Trader marker from being duplicated by the website fallback list while retaining the seven website-only Chernarus public POIs.

The PWA advances to v1.56.0 without rotating the bounded map-cache generation. Pairs with Bot v1.58.0 for the synchronized Radio Zenit Trader workspace.
