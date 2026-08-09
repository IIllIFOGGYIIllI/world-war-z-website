# world-war-z-website v1.22.45

## Added
- Adds a shared **DayZ Wiki preview resolver** for the member Survivor Shop and Dashboard Shop.
- Visible catalogue cards progressively resolve real DayZ Wiki article/file thumbnails when no manual HTTPS preview is configured.
- Adds common DayZ classname/display-name aliases for weapons, medical items, vehicle parts and the live rental vehicles.
- Adds browser-side preview caching for approximately 30 days.
- Adds source/attribution notes for third-party Wiki previews.

## Performance & Safety
- Wiki lookups are lazy: only cards near the viewport attempt resolution.
- Third-party lookups are concurrency-limited to four requests at a time.
- Existing manual `preview_image_url` values always take priority.
- Existing category SVG artwork remains the fallback for missing, incorrect or unavailable Wiki previews.
- A DayZ Wiki/Fandom outage cannot block catalogue rendering, checkout, delivery or Railway actions.

## Compatibility
- **Website-only patch. Bot remains v1.18.44.**
- No shop prices are changed.
- Vehicle rentals remain exactly `$1 / restart`.
- No catalogue records, orders, delivery logic, map geometry or Railway database records are changed.

## Files To Delete
- NONE
