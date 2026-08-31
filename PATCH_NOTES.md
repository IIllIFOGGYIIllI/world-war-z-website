# World War Z Website v1.25.5

## Chernarus Console PvE Telemetry Hotfix
- Replaces inferred infected/predator/wildlife kill displays with console-safe expedition participation telemetry from periodic ADM positions.
- PvE leaderboards now rank check-ins, first visits and expedition objective coverage rather than unsupported NPC-kill counts.
- Weekly community goals, faction standings, records, recent activity and the PvE heatmap now use the same participation model.
- Actual player deaths to infected, bears and wolves remain visible separately when the bot receives those ADM death causes.
- Clearly identifies the telemetry source as console ADM positions and states that NPC-kill inference is not used.
- Removes the unsupported NPC Kill zone-rule control from the Command Centre.

## Chernarus Travel Quests
- The paired Bot v1.19.5 introduces a Chernarus travel/PvE-heavy quest rotation and validated distance-travelled objectives.
- Quest progress displayed by the existing quest surfaces automatically reflects the new travel, named-location, patrol and expedition objectives.

## Isolation / PWA
- Chernarus-only correction; Livonia PvP Operations remain unchanged and isolated.
- Advances the installed PWA/service-worker cache to v1.25.5 and cache-busts the corrected Chernarus PvE, map-intelligence and zone modules.
