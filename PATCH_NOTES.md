# World War Z Website v1.22.53

## Private synchronized ticket lifecycle

- Updates Support Tickets to the strict creator + Admin role + bot permission model.
- Removes participant-management controls from the ticket administration UI.
- Clarifies that the configured ticket role must be an admin/moderation-capable Discord role.
- Adds an authenticated **Open Saved Website Transcript** action for ticket creators.
- Adds an authenticated **Open Website Transcript** action for Admin/Owner staff alongside the Discord transcript archive link.
- After the creator reviews a closed ticket, the dashboard immediately reflects the permanent archived/deleted ticket state after the Discord channel is removed.
- Ban appeals remain linked into the same synchronized ticket system.

## Compatibility

- Requires Bot v1.18.49.
- No map, shop, rental, progression or economy behavior is changed.
