# World War Z Website v1.22.73

## Behaviour-preserving dashboard access organisation

- Moves the shared protected-dashboard authorization response handler from `administration.js` into `assets/js/dashboard/admin-access.js`.
- Loads the new access helper after dashboard core state and before Administration, Command Centre, Shop, Delivery and Configuration Studio.
- Moves the account economy transaction renderer out of `administration.js` and into `account.js`, its actual owner and only consumer.
- Keeps both moved JavaScript function bodies as literal moves from Website v1.22.72.
- Adds website validation that rejects duplicate definitions, missing helper ownership or unsafe script ordering.
- Refreshes local asset cache versions so GitHub Pages clients receive the reorganised scripts immediately.

## Compatibility

- Pair with Bot v1.18.72.
- No Railway API contract, authentication rule, selected-server behaviour, protected action, shop workflow, map tile, road geometry, label data or persistent record is changed.
