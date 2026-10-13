"use strict";
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const read = name => fs.readFileSync(path.join(root,name),'utf8');
const index=read('index.html'), dash=read('dashboard.html'), changelog=read('changelog.html');
const js=read('assets/js/dashboard/world-manager.js'), sw=read('sw.js');
const roadmap=read('docs/WORLD_PROFILES_ROADMAP.md'), checklist=read('docs/RELEASE_CHECKLIST.md');
for (const token of ['Website v2.11.1 · Bot v1.74.1','Stage 2B · Phase 3 partial integration','No Badlands activation']) assert(index.includes(token),token);
for (const token of ['data-world-member-panel','data-world-member-form','data-world-member-id','data-world-member-preview','Stage 2B']) assert(dash.includes(token),token);
assert(js.includes('encodeURIComponent(memberId)'));
assert(js.includes('member_route_preview'));
assert(js.includes('read_only')===false); // the endpoint, not client, enforces read-only
assert(js.includes('/api/admin/world-profiles/role-dry-run'));
assert(changelog.includes('Version 2.9.0') && changelog.includes('Version 2.10.0')); // preserve historical entry
for(const version of ['2.6.1','2.6.0','2.5.0','2.4.2','2.4.1','2.4.0','2.3.0','2.2.0','2.1.0']) assert(changelog.includes('Version '+version));
assert(roadmap.includes('Stage 2B Phase 3') && roadmap.includes('Guarded write adapters'));
assert(checklist.includes('changelog.html') && checklist.includes('index.html#roadmap'));
assert(sw.includes("WWZ_PWA_VERSION = '2.11.1'"));
assert(sw.includes("WWZ_PWA_CACHE_RELEASE_VERSION = '1.27.0'"));
console.log('v2.8.0 world gateway and release hygiene checks passed');
