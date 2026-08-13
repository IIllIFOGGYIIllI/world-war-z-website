# World War Z Bot Website — v1.22.83

Final behaviour-preserving optimisation consolidation.

Railway remains authoritative: Bot v1.18.82 verifies the signed-in member and their live roles in the selected Discord server before every protected operation. The browser never receives raw guild IDs, Nitrado service IDs, tokens or mission paths.

Deploy with Bot v1.18.82.

Website v1.22.83 completes the normal dashboard-startup optimisation pass by replacing the eager 22,879-byte catalogue/map workspace stylesheet with an 827-byte Overview-only map preview. The full stylesheet now loads once on demand with Map or commerce workflows while preserving the existing Chernarus/Livonia map, Shop, Delivery and administration behaviour.
