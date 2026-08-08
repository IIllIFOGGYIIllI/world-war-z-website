# Website v1.22.37 — Existing-Role Progression Sync

## Changed

- **Sync Discord Roles** now reflects Bot v1.18.37: it never creates Discord roles.
- Sync expects the four WWZ progression header/footer roles and official Level/Prestige roles to already exist.
- The dashboard reports existing header/footer role discovery and member synchronization.
- Every non-bot member is included in manual sync; previously untracked members are initialized at Level 1 without free XP or economy rewards.
- Searchable role pickers, Save All Changes and economy reward controls are unchanged.

## Compatibility

- Pairs with Bot v1.18.37.
- Existing XP, prestige, economy balances, role bindings, map assets and Railway persistent records are preserved.
