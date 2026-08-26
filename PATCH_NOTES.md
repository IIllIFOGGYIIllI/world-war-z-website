# World War Z Website v1.22.100

## Fixed
- Saved dashboard sessions retry transient Discord verification failures before falling back to normal Discord sign-in while preserving the selected WWZ server.
- A failed saved-session refresh no longer claims Discord verification/sign-in itself is unavailable.
- Public Server Rules can load from the Railway public rules endpoint without requiring a dashboard server-selection header.
- Paired Bot v1.18.108 fixes the Rules Manager's `A valid Rules Manager request is required.` error when saving/publishing the full ruleset by accepting the larger validated JSON body.
- Bumped the PWA/account/rules asset revisions so cached v1.22.99 JavaScript cannot keep showing the old behaviour.

## Regression validation
- Full site validation passes across all dashboard workspaces, static/dynamic button wiring, PWA/offline behaviour and shared Chernarus/Livonia map assets.
- All 34 JavaScript/service-worker files pass syntax validation.

## Compatibility
- No quest definitions or quest rotation contents were changed.
- Pairs with Bot v1.18.108.
