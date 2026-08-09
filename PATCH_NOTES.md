# World War Z Website v1.22.57

## Objectives authentication hotfix

- Fixes Daily & Weekly Objectives incorrectly showing the Discord sign-in panel while the dashboard header is already authenticated.
- Member Objectives GET requests now send the current dashboard Bearer session to Railway, matching Account Centre and XP & Prestige.
- Admin/Owner Objective Administration GET requests now use the same authenticated session.
- Preserves HTTP status codes in the Objectives client so expired sessions can be distinguished from temporary API failures.
- Keeps a valid signed-in session visually signed in while a temporary Objectives API error is reported.

## Rotation wording

- Removes the obsolete `UTC day` and `Monday 00:00 UTC` labels from the Objectives page.
- The dashboard now describes Daily quests as a true 24-hour rotation and Weekly quests as a true 7-day rotation, independent of DayZ restarts.
- The actual persisted 24-hour / 7-day rotation timing remains supplied by Bot v1.18.55.

## Compatibility

- Requires Bot v1.18.55 for the corrected persisted quest rotation anchors and legacy verified-link repair.
- No database migration, Chernarus map geometry, shop/rental, ticket, progression or moderation behaviour changed.
