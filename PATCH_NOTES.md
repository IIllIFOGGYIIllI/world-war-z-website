# World War Z Website v1.22.84

## Performance

- Extracted the member Appeals and Owner Appeal Settings controller from the eager `account.js` bundle into `appeals.js`.
- Reduced eager `account.js` from about 48.3 KB to 25.6 KB; the 22.8 KB Appeals controller now loads only for the two Appeals workspaces.
- Appeals continues to share the existing lazy Moderation stylesheet and single-flight script loader, including hover/focus preloading and direct-hash navigation.

## Compatibility

- Discord authentication, account summary/economy rendering and dashboard bootstrap remain eager and unchanged.
- No Railway API, authorization, selected-server, map, Shop, Delivery or persistent-data behaviour changed.
