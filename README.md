# World War Z Website v1.55.1

World War Z community dashboard and installable PWA for Chernarus and Livonia.

## Current release
Map Runtime Hotfix repairs the public WWZ Interactive Map Hub by correcting the Leaflet 1.9.4 Subresource Integrity hash used by `map-link.html`. The invalid hash caused browsers to reject Leaflet before the WWZ map runtime could initialise.

The existing v1.55.0 Map Hub features, public POIs, deep links, public PvP/kill-zone overlays, private pin permissions, Group/Faction layers, Livonia isolation and Bot v1.56.0 integration are otherwise unchanged.

The PWA advances to v1.55.1 without rotating the bounded map-cache generation.
