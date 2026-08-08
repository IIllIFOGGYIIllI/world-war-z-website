# Website v1.22.38 — Next Restart Display

## Added

- Operational Health now shows the next scheduled DayZ restart, live countdown, configured interval, source and restart-warning text supplied by Bot v1.18.42.
- The Automatic Shop Deliveries workspace shows the same next-restart time/countdown beside the queue summary.
- The standalone Survivor Shop adds a public Next Server Restart metric.
- Pending Normal Item orders display the expected next restart when the bot has synchronized the current DayZ session.
- When the bot knows the `messages.xml` interval but has not yet observed a reliable session anchor, the UI clearly reports that it is waiting for restart synchronization instead of showing a guessed time.

## Compatibility

- Pairs with Bot v1.18.42.
- No map geometry, satellite tiles, shop delivery logic or Railway persistent records are changed.
- GitHub Pages remains fully static; restart data comes only from the existing public Railway `/api/server/status` endpoint.
