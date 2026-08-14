# World War Z Website v1.22.90

## Full Zone Configuration

- Expanded the circular and polygon zone editor with the full requested DayZ++-style settings matrix.
- Added Ping on Detection, Ping Bounties, Location, Verbose Mode, entry/exit alerts and a configurable radar interval.
- Added Temporary Ban plus automatic ban controls for detection, login, combat, construction/actions and supported death events.
- Added Kill Zone, Kill Zone Ignore Bounty Kills and Hit Zone controls.
- Added Ignored Events and Allowed Events selectors driven by the Railway API event catalogue.
- Added Allowlist Management Users alongside Ping Roles, Allowlist Roles and PlayStation-name allowlists.
- Added named Dynamic Ignore/Allow Lists with active state, mode and player-name entries.
- Added detection payout configuration metadata.

## Base Radar UX

- Ping on Detection is presented explicitly as the recurring base-radar function rather than an entry-only alert.
- New radar zones default to a five-minute pulse.
- Saving a radar-enabled zone now requires a Discord alert channel.
- Saved zone cards show radar interval and whether an alert channel is configured.

## Safety and compatibility

- All automatic ban controls default OFF.
- The existing validated Chernarus/Livonia map stack and corrected DayZ X/Z coordinates are unchanged.
- Existing Zones, Zone Map and Online Players workspaces remain in place.
- PWA cache revision bumped so installed clients refresh the new zone assets.
- Pairs with Bot v1.18.94.
