# World War Z Website v1.22.82

## Lazy workspace stylesheets

- Removes Tickets, Moderation/Appeals, Progression, Objectives and Factions stylesheets from ordinary dashboard startup.
- Defers 56,624 bytes of workspace-specific CSS until the corresponding workspace is requested.
- Loads each stylesheet through the same single-flight lazy asset layer as its controller, preventing duplicate stylesheet injection.
- Member Appeals and Owner Appeal Settings explicitly request the shared moderation/appeals stylesheet even though they do not need the Administration controller.
- Existing hover/focus preloading remains available so intentional navigation can warm the required styles before the workspace opens.
- Extends site validation so these five stylesheets cannot silently return to the eager dashboard `<head>`.

## Compatibility

- Pair with Bot v1.18.81.
- No Railway API contract, authorization rule, selected-server routing, DOM structure, Shop transaction, map geometry or persistent-record changes.
