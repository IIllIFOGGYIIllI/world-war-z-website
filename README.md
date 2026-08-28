# World War Z Bot Website — v1.25.0

Website v1.25.0 adds **Collaborative Map Intelligence** on top of the v1.24 Operations Interface without weakening the existing privacy or performance architecture.

## Map layers
- Existing Private pins remain browser-only and are never uploaded to Railway.
- Existing Public/Admin markers remain visible to everyone and writable only by verified Admins/Owners.
- Adds Group markers visible only to signed-in members of the exact selected map group.
- Adds Faction markers visible only to signed-in members of the user's existing WWZ faction.
- Admin status does not reveal somebody else's Group or Faction layers.
- Adds independent visibility toggles for Private, Public, each Group, Faction and Kill Zones.

## Map groups
- Create or join lightweight iZurvive-style sharing groups with invite codes.
- Owners can rename/recolour groups, rotate invite codes, promote moderators, remove members, transfer ownership or delete the group.
- Moderators can remove ordinary members; members can leave.
- Invite secrets are shown only when created/regenerated and are not retained in plaintext by the backend.

## Kill Zone geometry
- Active Kill Zones are drawn from the existing WWZ Zones system.
- Polygon Kill Zones use the exact stored polygon vertices on the production satellite map.
- Circular Kill Zones use their configured centre/radius.
- Disabling Kill Zone or deactivating the zone removes it from the public overlay automatically.
- The website receives only safe geometry/display fields, not allowlists, Discord channels or enforcement internals.

## Performance/privacy
- The collaborative bundle remains lazy and loads only with the Interactive Map.
- Intelligence refresh runs only while the map is active and the browser tab is visible, with a 45-second active refresh and immediate refresh after meaningful resume/server/account changes.
- Unchanged responses are fingerprinted so Leaflet layers are not rebuilt unnecessarily.
- Group/Faction marker data is kept in memory only and is never written to localStorage/sessionStorage.

Pairs with Bot v1.19.0. Existing v1.24 visual design, Shop/Donations, map datasets, vehicle recovery and Chernarus/Livonia isolation are preserved.
