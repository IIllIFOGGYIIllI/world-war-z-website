# World War Z Website v1.22.61

## Advanced Ticket Settings

This focused Chernarus parity patch exposes advanced Owner ticket policy configuration through the existing Support workspace and Bot v1.18.60 API.

### Added

- Expanded **Owner Configuration → Advanced Ticket Settings** interface.
- Discord infrastructure controls remain available for panel channel, open/closed categories, transcript archive and default Admin role.
- Adds optional overflow-category selection.
- Adds lifecycle toggles for:
  - member closure
  - close confirmation
  - required close reason
  - claiming
  - Claim/Close Discord button visibility
  - feedback prompts
  - 1–5 reviews
  - automatic inactivity closure
  - transcript-on-close
  - transcript-before-delete
  - member transcript access
  - archive/delete closed channel after review
- Adds maximum active-ticket count and inactivity warning/close-hour controls.
- Adds ticket panel title, description, colour and new-ticket welcome text.
- Adds per-category routing rows for enablement, support role, notification role and initial priority.
- Adds Save Advanced Settings and Reload Current Settings actions.

### Member/Admin parity

- Member close controls follow the Owner's member-close policy.
- Required close reasons and confirmation prompts are enforced in the dashboard workflow.
- Member rating and transcript controls reflect the configured review/transcript policy.
- Admin Claim is disabled in the UI when ticket claiming is disabled; the API/bot also enforces the policy.

### Security and compatibility

- Requires Bot v1.18.60.
- Owner writes are re-authorized server-side; hidden browser controls are not authorization.
- Role/category choices use server-generated opaque resource keys and are validated against the live Discord guild.
- Existing synchronized tickets, private channels, transcripts, ratings and audit history are preserved.
- No map assets, shop/rental lifecycle, progression data or Railway production persistence are replaced.
- No Livonia work is included.
