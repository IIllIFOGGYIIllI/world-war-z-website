'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const dashboard=read('dashboard.html');const js=read('assets/js/dashboard/world-manager.js');
const roadmap=read('docs/WORLD_PROFILES_ROADMAP.md');const changelog=read('changelog.html');const sw=read('sw.js');
for(const needle of ['data-world-managed-messages','data-world-managed-message-summary','data-world-managed-message-items','Read-only inventory']) assert(dashboard.includes(needle),needle);
for(const needle of ['payload.managed_messages','refresh_execution_enabled','registry audit','not automatically']) {
  assert((js+dashboard+roadmap).toLowerCase().includes(needle.toLowerCase()),needle);
}
assert(js.includes('element(\'small\'') && js.includes('itemsRoot.replaceChildren()'));
assert(!js.includes('refresh_managed_message') && !js.includes('execute_managed_message'));
assert(changelog.includes('Version 2.13.0'));
assert(sw.includes("WWZ_PWA_VERSION = '2.14.0'"));
console.log('Stage 2D2 website registry assertions passed');
