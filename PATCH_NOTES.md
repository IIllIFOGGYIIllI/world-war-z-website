# World War Z Website v1.54.2 — Zone Enforcement & Shop Classname Administration

## Zone Management
- Pairs with Bot v1.55.2's Chernarus PvE enforcement, where both killer and victim must be inside the same authorised PvP area for a normal player kill to be legal.
- Keeps the seven managed military polygons visually locked to the requested profile: Active, Verbose Mode, Kill Zone and Ban on Build ON; Location and unrelated automatic rule toggles OFF.
- Preserves exact four-decimal polygon vertices when an Admin opens/saves polygon geometry and continues to support the full 151-point NWAF boundary.
- Removes the old non-functional Detection Payout control from the Admin editor while retaining database compatibility.

## Shop Administration
- Normal catalogue Types are explicitly editable and described as the real DayZ classnames Railway uses for delivery.
- Event/rental DayZ child classnames are now editable instead of read-only; changing one updates the Event XML child before save.
- Changed classnames, event attachments and event cargo are validated against the selected server's live Central Economy by Railway before the item is saved.
- Owner-edited source-backed classnames are labelled as Owner overrides and are preserved from future automatic catalogue reconciliation.
- Owner catalogue tables show the current delivery classname(s), making a bad/stale type visible without opening every item.
- Catalogue-sync feedback reports repaired classname values and unresolved legacy values that require Owner review.

## PWA / compatibility
- Advances the public website/PWA release to v1.54.2 and refreshes the changed Zone and Shop Administration lazy-loaded assets.
- Pairs with Bot v1.55.2; Livonia remains isolated and Full PvP.
- The bounded map-tile/map-data cache generation remains unchanged.
- No database wipe, DayZ mission upload or Nitrado configuration change is required.
