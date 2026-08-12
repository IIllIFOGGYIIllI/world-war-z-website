# World War Z Website v1.22.76

## View-specific dashboard lazy loading

- Removes the approximately 40.9 KB interactive-map controller from unconditional dashboard startup and loads it only when the Map workspace is requested.
- Removes the approximately 41.7 KB Structured Configuration Studio from unconditional startup and loads it only for Server Configuration → Structured Controls.
- Defers the approximately 17.9 KB DayZ Wiki preview resolver on the dashboard until the member Shop or Owner Shop workspace is requested; the standalone public Shop keeps its direct resolver.
- Prevents Structured Configuration preloading/hover from triggering a live configuration API request until the structured workspace is actually visible.
- Keeps first-use Shop rendering deterministic by awaiting the optional preview resolver before catalogue rendering, while retaining category SVG fallbacks if it cannot load.
- Stops Progression from issuing a member progression API refresh on every server switch when neither Progression nor Players is active.
- Extends site validation so these view-specific assets cannot silently return to eager dashboard loading.
- Refreshes GitHub Pages cache versions.

## Compatibility

- Pair with Bot v1.18.75.
- No Railway API contract, selected-server routing, authorization rule, map geometry, Shop transaction, structured configuration action or persistent record changes.
