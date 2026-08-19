# World War Z Website v1.22.95

## Added — Discord member onboarding configuration
- Added Owner Configuration → Discord Onboarding.
- Added safe multi-role selection for automatic join roles.
- Added configurable public welcome channel, message, embed title and colour.
- Added optional private welcome DM configuration.
- Added configurable leave channel, message, embed title and colour, with welcome-channel fallback.
- Added template placeholder reference chips directly in the editor.

## Safety
- The dashboard only offers join roles Railway confirms are below the bot and non-privileged.
- Discord role/channel IDs stay server-side behind opaque resource keys.
- Bot accounts are ignored and closed DMs are explicitly non-blocking.
- The existing Linked role remains separate from automatic join roles.

## Compatibility
- Requires Bot v1.18.103 or later.
- Existing dashboard, PWA, maps, Zones, Server Feeds, tickets and account linking are unchanged.
