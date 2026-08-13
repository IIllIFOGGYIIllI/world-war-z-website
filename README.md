# World War Z Bot Website — v1.22.81

Behaviour-preserving shared map-runtime lazy loading.

Railway remains authoritative: Bot v1.18.80 verifies the signed-in member and their live roles in the selected Discord server before every protected operation. The browser never receives raw guild IDs, Nitrado service IDs, tokens or mission paths.

Deploy with Bot v1.18.80.

Website v1.22.81 removes the Leaflet runtime, shared WWZ map JavaScript and dashboard map component stylesheet from ordinary dashboard startup. Those assets now load once on demand for the Map workspace and map-dependent Shop, Delivery and Saved Location workflows, while Chernarus/Livonia geometry and coordinate behaviour remain unchanged.
