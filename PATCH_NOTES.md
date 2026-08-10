# World War Z Website v1.22.65

## Admin Workspace Organisation

Final Chernarus production-QA cleanup.

- Keeps **Shop & Trader** member-facing: Member Shop, My Orders and Saved Locations.
- Moves **Automatic Deliveries**, **Trader Ticket Fulfilment**, **Ticket Administration** and **Objective Administration** into **Administration**.
- Keeps **Faction Administration**, **XP Configuration**, moderation, server controls and audit tooling under Administration.
- Moves **Shop Catalogue**, **Event Items**, **Shop Settings**, **Ticket Settings** and **Quest Settings** into **Owner Configuration**.
- Protected Admin/Owner subsections are now isolated: opening the normal Factions, Support, Objectives or XP/member workspace no longer exposes management panels farther down the same page just because the signed-in user is an Admin.
- Existing Railway permission checks remain authoritative; this patch changes organization and presentation, not security boundaries.

## Compatibility

- Pair with Bot v1.18.62.
- No database migration.
- No API changes.
- No Chernarus map geometry/tiles/road changes.
- No faction, progression, ticket, shop, rental, objective or server-control data changes.
