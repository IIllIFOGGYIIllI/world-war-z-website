# World War Z Website v1.22.68

## Chernarus and Livonia multi-server routing

- Adds the selected opaque server key to all Railway API requests through the shared HTTP client.
- Keeps the existing Discord sign-in and server-selection experience, now backed by live eligible memberships from every configured World War Z Discord server.
- Reloads the dashboard when an already-selected member changes servers so no Chernarus response, form or operational panel can remain active in the Livonia context, or vice versa.
- Routes the main map explorer, dashboard shop checkout, standalone Survivor Shop checkout and saved delivery-location editor through the same selected server context.
- Updates the public and dashboard roadmaps for the completed foundation and remaining Livonia production-onboarding QA.

## Security and compatibility

- Requires Bot v1.18.64 for multi-server authorization and operational routing.
- Railway repeats live Discord membership and role checks for the selected server; the browser header is never trusted as authorization.
- Existing Bot v1.18.63 single-server deployments remain usable until the paired bot release is deployed.
- Server-owned operations remain separate while verified identity, wallet/economy and lifetime career statistics remain shared community records.
- No map tiles, roads, labels, source geometry, database records, credentials or Nitrado IDs are included.
