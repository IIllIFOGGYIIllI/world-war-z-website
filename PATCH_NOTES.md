# World War Z Website v1.22.62

## Chernarus Factions

This patch adds a native World War Z faction workspace backed by the authoritative Bot v1.18.61 faction API.

### Member experience

- New Factions navigation entry and responsive faction directory.
- Shows faction leader, members, capacity, armband, flag, optional zone/map reference and configured faction identity.
- Signed-in survivors see their own faction and whether they are the Leader or a Member.
- Optional HTTPS Discord invite and icon links are surfaced safely.
- Linked existing public Chernarus markers can be opened directly in the existing interactive map.

### Admin/Owner experience

- New Faction Administration navigation entry.
- Create/edit/delete factions.
- Set Name, Leader, Armband, Flag, Member Limit, Colour, existing Discord Role, Zone ID, linked existing public map marker, Discord Invite Link and Icon URL.
- Search verified linked survivors and add/remove faction members.
- Transfer faction leadership with confirmation.
- Exact faction-name confirmation before deletion.
- Faction actions now appear in the existing unified Audit Centre and can be filtered by Factions.

### Security and compatibility

- The browser never receives raw Discord role IDs or stored faction-member Discord IDs.
- Role and map-marker choices use opaque resource keys validated by Railway.
- All writes are server-authorized for the current Admin/Owner session.
- The bot never creates Discord roles; only safe existing roles can be selected.
- The locked Chernarus map assets/geometry are unchanged.
- No Livonia work is included.

Deploy Bot v1.18.61 before Website v1.22.62.
