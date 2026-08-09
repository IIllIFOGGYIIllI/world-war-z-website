## Website v1.22.57 — Objectives Authentication Hotfix

This hotfix completes the Bot v1.18.55 quest fix on the GitHub Pages frontend.

- Uses the same authenticated Discord dashboard session for the Objectives member API as the rest of the account dashboard.
- Uses the authenticated Admin/Owner session for Objective Administration.
- Prevents an already signed-in member from being shown the Objectives sign-in gate simply because the Objectives request omitted its Bearer token.
- Reports expired-session and temporary-service failures separately.
- Updates the Daily and Weekly rotation wording to match Bot v1.18.55: 24 hours and 7 days, independent of DayZ restarts.

Requires Bot v1.18.55. Persistent Railway data is unchanged.
