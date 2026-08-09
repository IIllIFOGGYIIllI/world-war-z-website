## Website v1.22.59 — Structured Configuration Studio

This patch adds purpose-built Owner controls for the DayZ configuration systems already present in Bot v1.18.57.

- Adds a new **Structured Controls** workspace alongside the existing raw Mission File Editor.
- Adds gameplay and monthly temperature controls for common `cfggameplay.json` values.
- Adds weather controls and existing weather presets while deliberately preserving Chernarus snowfall values.
- Adds live `messages.xml` management including restart/shutdown deadline fields used by the existing restart intelligence.
- Adds targeted `types.xml` search/edit controls so thousands of loot records are not rendered at once.
- Adds event settings, child entries, event positions and optional Event Zone controls.
- Adds ordinary server-event creation using Event XML plus an optional Event Zone.
- Every structured change can be previewed as an exact diff before applying.
- The existing raw editor remains available for advanced/rare fields.

Requires Bot v1.18.57. No persistent Railway data or Chernarus map assets are replaced.
