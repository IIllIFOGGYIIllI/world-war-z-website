# World War Z Website v1.22.63

## Faction editor modal hotfix

- Fixes the Faction Administration create/edit modal overflowing its generic 540px dialog shell.
- Expands the desktop faction editor to a responsive 920px maximum width.
- Keeps all form controls inside the modal and removes horizontal scrolling/clipping.
- Retains the existing two-column desktop form and collapses cleanly to one column on mobile.
- Caps the modal height and scrolls only the form body vertically when required.
- Adds a sticky Save Faction / Cancel action area so controls remain reachable on long forms.
- Improves wrapping for long labels and linked-map helper text.
- No faction API, bot, database, permission, map, or membership behaviour changes.

## Deployment

Website-only patch. Keep Bot v1.18.61 deployed.

Files to delete: NONE
