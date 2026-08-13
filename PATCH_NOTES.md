# World War Z Website v1.22.85

## Performance

- Live server-status polling now pauses while the dashboard tab is hidden and refreshes immediately when the tab becomes visible again.
- Admin Command Centre polling now suspends in background tabs instead of continuing its 30-second aggregation requests.
- Tickets polling now suspends in background tabs instead of running a 15-second member/Admin/Owner refresh cycle while the page is not visible.
- Foreground refresh intervals and manual refresh controls are unchanged.

## Compatibility

- No Railway API, authorization, selected-server, ticket, moderation, map or persistent-data behaviour changed.
- Returning to a visible tab triggers an immediate fresh read before normal polling resumes.
