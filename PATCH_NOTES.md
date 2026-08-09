# World War Z Website v1.22.58

## Configuration Control parity

- Replaces the placeholder/example Backup History panel with live Configuration Control backups from Railway.
- Adds managed-file filtering and real backup metadata including validation state, actor, timestamp and checksum.
- Adds Owner-only manual backup creation.
- Adds backup-to-live diff with the existing exact diff output surface.
- Adds confirmed restore actions using the Bot v1.18.56 recovery-backup and checksum-verification workflow.
- Restore actions deliberately do not force a DayZ restart.

## Fixed

- Fixes the mission-file editor post-apply refresh path so its own in-progress guard no longer prevents the live file and service state from reloading.
- Successful mission-file applies now also refresh the backup list.

## Security & compatibility

- Requires Bot v1.18.56 for the protected backup APIs.
- Owner authorization remains enforced by Railway for every read/write action.
- Backup metadata responses omit Railway-local backup filesystem paths.
- No Chernarus map, shop/rental, ticket, progression, Objectives or persistent database content is replaced.
