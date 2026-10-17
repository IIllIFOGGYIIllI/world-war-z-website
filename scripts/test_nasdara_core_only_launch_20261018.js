const assert = require('node:assert/strict');
const fs = require('node:fs');
const js = fs.readFileSync('assets/js/dashboard/world-manager.js', 'utf8');
for (const token of ['AUTHORIZE NASDARA GAMEPLAY','accept_untested_backup_and_rollback',
    'defer_map_dependent_shop_and_services','/api/admin/world-profiles/activation']) {
  assert(js.includes(token), 'missing ' + token);
}
assert(js.includes('activationProof.replaceChildren()'));
assert(!js.includes('Type AUTHORIZE BADLANDS GAMEPLAY'));
console.log('Nasdara-only core owner consent and cache regression passed');
