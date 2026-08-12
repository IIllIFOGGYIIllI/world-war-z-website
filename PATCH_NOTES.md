# World War Z Website v1.22.75

## Command-library lazy loading

- Removes the command catalogue bundle from the dashboard's unconditional startup scripts.
- Loads the approximately 20.5 KB command-library JavaScript only when the Commands workspace is requested.
- Opportunistically warms the command bundle when the Commands navigation control is hovered or keyboard-focused so intentional navigation remains responsive.
- Preserves direct `#commands` entry by loading the catalogue immediately when that is the requested initial view.
- Prevents duplicate script injection when multiple view/focus events request the command library while it is still loading.
- Avoids constructing the 128 command cards during ordinary Overview and unrelated workspace visits.
- Adds site validation that rejects a return to eager command-library loading and verifies the lazy asset uses the current cache version.
- Refreshes local GitHub Pages asset cache versions.

## Compatibility

- Pair with Bot v1.18.74.
- No Railway API contract, selected-server routing, authorization rule, command definition, protected write, map geometry or persistent record changes.
