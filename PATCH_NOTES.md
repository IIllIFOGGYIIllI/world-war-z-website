# World War Z Website v1.22.51

## Bulk Catalogue Administration

### Added
- Multi-select checkboxes for the Owner regular-item catalogue.
- Select This Page, Select All Filtered and Clear Selection controls.
- Status filter for active/inactive catalogue entries.
- Source filter for DayZ-synced versus manually created items.
- Protected bulk actions for availability, exact/percentage pricing, stock, per-order/per-player limits and timed purchase windows.
- Live selection/action preview before applying a batch change.
- Confirmation prompt showing affected item/category counts before Railway receives the write.

### Safety
- Requires Bot v1.18.47 for the protected bulk endpoint.
- Bulk pricing targets regular items only; rental/Event Item pricing remains $1 per restart.
- Existing orders retain their original snapshots and are never rewritten by catalogue edits.
- No map, delivery, economy, progression or persistent-data workflow is replaced.

## Files to delete
NONE
