# World War Z Bot Website — v1.22.89

Static GitHub Pages website/dashboard and installable WWZ Server Companion for the World War Z PlayStation DayZ community.

## Current release

Website v1.22.89 adds the production **Admin Zones & Mapping** workspace while keeping the existing public map and PWA architecture intact.

Verified Admins/Owners now have:

- **Zones** — create, edit, search, filter and delete circular or polygon zones.
- **Zone Map** — render all saved server zones on the validated Chernarus/Livonia satellite and road map.
- **Online Players** — view recent cached ADM player positions in a protected Admin-only map.
- Map-assisted circular centres and polygon drawing with exact DayZ X/Z geometry.
- Entry/exit alert configuration, Discord alert channel selection, ping roles and allowlists.

The public interactive map still never exposes live players. The protected Online Players workspace requires fresh Railway Admin authorization and uses the bot's existing ADM cache rather than triggering an extra Nitrado file request.

Advanced DayZ++-style automatic ban/enforcement rules are intentionally deferred; this release establishes the safe mapping, detection and alerting foundation first.

The PWA continues to use the same GitHub Pages frontend, Railway API, Discord authentication and selected-server routing. Chernarus and Livonia geometry remain shared through the existing validated map runtime, and Railway-owned persistent data is never replaced by a website deployment.

Pairs with Bot v1.18.92.
