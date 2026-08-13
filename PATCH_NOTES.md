# World War Z Website v1.22.80

## Hidden administration refresh optimisation

- Removes the unconditional post-action refresh of hidden Moderation Cases and Ban Lists after protected player administration actions.
- Cases and ban lists continue to refresh through their existing workspace activation loaders when an Admin actually opens those sections.
- Eliminates two invisible follow-up API requests after common player actions such as notes and economy adjustments.
- Avoids an unnecessary potentially Nitrado-backed ban-list read when the Ban Lists workspace is not visible.
- Keeps the protected action response, selected player detail refresh, authorization checks and audit behaviour unchanged.
- Extends site validation so hidden post-action refreshes cannot silently return.

## Compatibility

- Pair with Bot v1.18.79.
- No Railway API contract, moderation rule, Nitrado write, selected-server routing, map geometry or persistent-record changes.
