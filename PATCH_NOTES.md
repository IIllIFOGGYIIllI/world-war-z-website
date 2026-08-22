# World War Z Website v1.22.98

## Fixed
- Discord Onboarding roles, channels and message fields remain configurable before their individual enable toggles are switched on.
- Discord channel choices are no longer hidden/locked solely because the bot is missing a permission; the channel remains selectable and the Railway API returns the precise permission error when saving or publishing.
- Applied the same selectable-channel behaviour to Managed Webhook creation, Discord Logs and Community Tools.
- Refreshed the dashboard lazy-asset revision so browsers/PWA installs cannot keep using the older Administration controller after deployment.

## Preserved
- Notification Routes still require a WWZ-managed webhook destination; that selector is intentionally not a raw Discord-channel selector.
- Backend permission enforcement remains unchanged: selecting a channel never grants the bot access it does not have.

Pairs with Bot v1.18.106.
