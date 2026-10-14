const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root=path.resolve(__dirname,'..');
const read=(name)=>fs.readFileSync(path.join(root,name),'utf8');
const dash=read('dashboard.html');
const client=read('assets/js/dashboard/world-manager.js');
const lazy=read('assets/js/dashboard/lazy-assets.js');
const sw=read('sw.js');
for(const key of ['data-world-role-executor','data-world-role-action','data-world-role-journal','data-world-role-confirm','data-world-role-apply','data-world-role-execution-status']){
  assert(dash.includes(key),'Missing role control '+key);
  assert(client.includes(key),'Missing role wiring '+key);
}
assert(client.includes("payload.server_map === 'badlands' && payload.quarantined === true"));
assert(client.includes('MIGRATE BADLANDS ROLES'));
assert(client.includes('RESTORE CHERNARUS ROLES'));
assert(client.includes('/api/admin/world-profiles/roles/transition'));
assert(client.includes('roleConfirm?.value?.trim() !== requiredRoleConfirmation()'));
assert(lazy.includes('world-manager.js?v=2.19.0'));
assert(sw.includes("WWZ_PWA_VERSION = '2.19.0'"));
console.log('Badlands journalled role cutover UI regression passed');
