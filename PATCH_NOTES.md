# World War Z Website v1.25.0

## Collaborative Map Intelligence
- Adds Group and Faction shared marker layers while preserving browser-only Private pins and Admin-only Public marker management.
- Adds map-group creation/join/invite/member management and per-group visibility toggles.
- Adds actual active Kill Zone geometry from existing Zone configuration, including exact polygon vertices.
- Adds strict signed-in membership handling: Group/Faction data is not persisted in browser storage and Admin status does not bypass membership.

## Performance
- New map intelligence JS/CSS remains view-lazy.
- Refresh pauses when the map/tab is not active and skips rerendering unchanged payloads.
- Existing heavy map runtime remains lazy and no new global eager bundle is introduced.

## Compatibility
- Pairs with Bot v1.19.0.
- Preserves the v1.24 Operations Interface, both map datasets and all existing website workflows.
