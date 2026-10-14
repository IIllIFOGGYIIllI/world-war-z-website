# World War Z / Badlands release readiness

Website v2.17.0 improves World Manager launch-check accessibility and displays a quarantined Badlands state when the primary Bot reports it. It cannot activate a DayZ mission, move economy records or execute Discord roles.

- Primary Chernarus and independent Livonia remain the active baseline unless the operator configures a *verified* Badlands mission.
- A new Badlands database is physically separate from the existing Chernarus/Livonia persistence; Bot v1.80.0 keeps primary gameplay interactions paused while migration verification is outstanding.
- `Admin → World Manager → Badlands Launch Gate` remains read-only. No green status is assigned for untested external backups, Nitrado map confirmation, role reconciliation or rollback tests.
- Read-only labels and diagnostic detail now wrap onto separate lines.
- Full operator and rollback guidance is in the Bot release's `docs/BADLANDS_LAUNCH_CUTOVER_V180.md`.
