## Website v1.22.58 — Configuration Backup Parity

This patch turns the existing example-only Configuration Backup History surface into a live Owner workflow backed by Bot v1.18.56.

- Lists the real validated Configuration Control backups stored by Railway.
- Filters backup history by managed DayZ file.
- Creates manual live backups with an attributable reason.
- Compares any stored backup against the current live Nitrado file.
- Restores a selected backup only after explicit confirmation and server-side Owner verification.
- Shows the exact diff in the existing dashboard styling.
- Fixes the post-apply refresh path so the editor reloads its live state after a successful deployment.

Requires Bot v1.18.56. No persistent Railway data or Chernarus map assets are replaced.
