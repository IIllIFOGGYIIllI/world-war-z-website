# World War Z Website v1.22.52

## Synchronized Ticket Centre

### Added
- Full Support Tickets workspace for signed-in members, Admins and Owners.
- Member ticket history, category selection, ticket creation, live Discord conversation, website replies, close and satisfaction-rating controls.
- Admin synchronized queue with open/closed/deleted/all scopes, search, claim state, priority/tag controls, private notes, participants, transcript generation/archive links and permanent activity history.
- Ticket statistics including totals, average resolution time, ratings and staff close/claim performance.
- Ticket blacklist management with protected member search.
- Owner Discord ticket-infrastructure configuration for panel channel, open/closed categories, transcript archive, support role and enable/disable state.
- Approximately 15-second live polling while the ticket workspace/detail is open so Discord-side changes appear without maintaining a second website ticket store.

### Shared system
- Requires Bot v1.18.48. Discord and the website now operate on the same Railway ticket records and linked private Discord channels.
- A website-created ticket creates the real Discord ticket; a Discord-created ticket appears on the website.
- Website replies are delivered into Discord and recent Discord conversation is rendered back in the website.
- Private staff notes are never exposed to member ticket responses.

### Compatibility
- No second ticket database or duplicate queue is introduced.
- Existing tickets, ticket history, shop/delivery, rentals, economy, progression and Chernarus map assets are preserved.
- No destructive Railway database migration is included.

## Files to delete
NONE
