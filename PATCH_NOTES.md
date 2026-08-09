# World War Z Website v1.22.59

## Structured Configuration Studio

- Adds a new Owner-only **Structured Controls** section inside the DayZ Configuration Control Centre.
- Keeps the existing Mission File Editor as the advanced/raw fallback rather than replacing it.

### Gameplay
- Common base/container damage, respawn, personal-light, night-lighting, stamina, map/navigation and building-placement settings.
- Full 12-month minimum/maximum environment temperature editor.

### Weather
- Weather enable/reset controls.
- Existing Rare Rain, Clear Event Weather, No Rain, Heavy Fog, Stormy and Bohemia Example presets.
- Structured overcast, fog, rain, wind and storm values.
- Chernarus snowfall is intentionally shown as protected/preserved rather than casually enabled.

### Messages & Restarts
- Live active/disabled message overview.
- Add and edit message text, delay, repeat, on-connect, deadline and shutdown fields.
- Prepare enable, disable and permanent removal operations.
- Explicitly explains that the existing restart intelligence reads `messages.xml`; quest timers remain independent.

### Loot
- Targeted live `types.xml` classname search.
- Edit nominal, minimum, lifetime, restock, quantity bounds, cost, category, usage, tier/value and tags.
- Managed enable/disable controls.
- Results are capped to avoid rendering thousands of entries in the browser.

### Events & Positions
- Edit event population/radius/state fields.
- Add/edit/remove event children.
- Add/edit/remove event positions.
- Set/edit/remove optional Event Zones.
- Remove events with position cleanup choice.
- Create ordinary server events from one complete Event XML element plus an optional Event Zone.

## Safety & UX

- Preview produces exact server-generated diffs without writing.
- Apply requires a reason and explicit browser confirmation.
- Railway still enforces Owner authorization and protected-write gating server-side.
- Successful applies refresh service state, backup history and event data.
- Responsive styling added for the new configuration workspace.
