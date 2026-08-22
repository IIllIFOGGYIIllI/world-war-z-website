# World War Z Website v1.22.97

## Configuration Regression Hardening

- Clarified that Notification Routes use WWZ-managed webhook destinations rather than raw Discord channels.
- When no managed webhook exists, notification route selectors now explain what must be created first instead of presenting an ambiguous standalone “No destination” option.
- Route enable/save controls stay unavailable until a valid managed destination exists.
- Community Tools Embed Builder now gives the same explicit dependency state and disables publishing until a managed webhook is available.
- Added validation guards for the notification-routing dependency state and refreshed PWA/cache revisions.

Pairs with Bot v1.18.105.
