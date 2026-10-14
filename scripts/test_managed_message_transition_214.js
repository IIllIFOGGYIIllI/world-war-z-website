'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const site=read('dashboard.html'), ui=read('assets/js/dashboard/world-manager.js'), home=read('index.html'),
  changelog=read('changelog.html'),roadmap=read('docs/WORLD_PROFILES_ROADMAP.md'), sw=read('sw.js');
for(const key of ['data-world-managed-refresh-plan-summary','data-world-managed-refresh-plan','data-world-managed-messages']) assert(site.includes(key),key);
for(const key of ['inventory.refresh_plan','refreshPlan.items','proposed_action','execution_enabled']) {
 assert((ui+roadmap).includes(key),key);
}
assert(ui.includes('replaceChildren()') && ui.includes('textContent'));
assert(!ui.includes('refresh_managed_message') && !ui.includes('execute_managed_message'));
assert(roadmap.includes('Chernarus Radio Zenit Trader'));
assert(changelog.includes('Version 2.14.0'));
assert(home.includes('Website v2.15.0 · Bot v1.78.0'));
assert(sw.includes("WWZ_PWA_VERSION = '2.15.0'"));
console.log('Stage 2D3 transition UI assertions passed');
