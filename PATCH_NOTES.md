# World War Z Website v1.34.0 — Faction System Upgrade

## Member Faction Centre
- Adds faction application submission/withdrawal and invitation accept/decline flows.
- Adds leader/officer recruitment queues, member invitations and roster management.
- Adds officer promotion/demotion, leadership transfer, managed removals and protected voluntary leave workflows.
- Adds faction profile/recruitment editing, motto/description presentation and leader rename requests.
- Adds faction activity history, current flag claims and server-scoped bounty/contract statistics.

## Admin Faction Operations
- Adds application and rename-review queues.
- Adds faction suspend/reactivate controls, private Admin notes and audited faction-bank adjustments.
- Expands Admin roster controls without exposing private Admin notes to member/public views.

## Isolation / compatibility
- Chernarus and Livonia faction data remain independently server-scoped.
- Website advances to v1.34.0 with Bot v1.27.0.
- Existing legacy map-link fields are retained only for backward compatibility; this upgrade does not add new base-location or map-marker creation.
- Faction assets and installed-app revision are advanced so the upgraded interface refreshes cleanly after deployment.
