# World War Z Website v1.22.78

## Dashboard controller lazy-loading optimisation

- Removes six workspace-specific controllers from unconditional dashboard startup: Administration, Tickets, Progression, Objectives, Factions and Command Centre.
- Loads each controller only when its owning workspace is requested, avoiding 261,530 bytes of JavaScript on a normal Overview visit.
- Keeps Progression available for both the Progression and Players workspaces and scopes Administration loading to the staff/configuration sections that actually use it.
- Preserves direct-hash startup by waiting for the eager dashboard runtime to finish before injecting lazy controllers.
- Keeps pointer/focus preloading for intentional navigation without turning a preload into hidden API work.
- Allows regular members to submit appeals without requiring the Administration controller; the optional staff queue refresh remains best-effort for authorised staff.
- Extends site validation so these controllers cannot silently return to the eager dashboard bundle.
- Refreshes GitHub Pages cache versions.

## Compatibility

- Pair with Bot v1.18.77.
- No Railway API contract, authentication rule, selected-server routing, protected action, workspace behaviour, map geometry or persistent-record changes.
