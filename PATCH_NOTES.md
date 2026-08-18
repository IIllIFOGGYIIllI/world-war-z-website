# World War Z Website v1.22.94

## Added — public Zone Radar marker viewer
- Added `map-link.html`, a lightweight public WWZ map view used only by Zone Radar / zone-detection Discord coordinate links.
- The page reads the map and X/Z directly from the signed link, loads the correct Chernarus or Livonia map, focuses the exact location and displays a temporary labelled marker.
- No Discord dashboard sign-in is required and no Chernarus/Livonia server-selection step is shown.
- The viewer exposes no protected dashboard data, Online Players data, saved private locations or Admin controls.

## Compatibility
- Designed for Bot v1.18.102 or later.
- Server Feeds and the public PvP killfeed remain location-link free.
- The protected dashboard, Zone Map and Online Players map are unchanged.
