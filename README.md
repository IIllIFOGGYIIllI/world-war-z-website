# World War Z Bot Website — v1.22.95

Website v1.22.95 adds an Owner-only Discord Onboarding workspace. The Owner can configure safe automatic join roles, a public welcome message, an optional private welcome DM and a leave message without editing Railway variables or Discord IDs manually.

The browser receives only opaque role/channel resource keys. Railway validates live role hierarchy, dangerous permissions and channel send/embed permissions before saving. The existing `Linked` role remains separate from automatic join roles.
