# World War Z Bot Website — v1.22.82

Behaviour-preserving workspace stylesheet lazy loading.

Railway remains authoritative: Bot v1.18.81 verifies the signed-in member and their live roles in the selected Discord server before every protected operation. The browser never receives raw guild IDs, Nitrado service IDs, tokens or mission paths.

Deploy with Bot v1.18.81.

Website v1.22.82 removes another 56,624 bytes of view-specific CSS from ordinary dashboard startup. Tickets, Moderation/Appeals, Progression, Objectives and Factions styles now load once on demand with their owning workspaces, while member Appeals and Owner Appeal Settings still receive the moderation stylesheet without pulling in the Administration controller.
