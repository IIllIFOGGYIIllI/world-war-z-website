"use strict";
const assert = require('assert'); const fs = require('fs'); const path = require('path');
const root=path.join(__dirname,'..'); const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const h=read('dashboard.html'), js=read('assets/js/dashboard/community.js'), obj=read('assets/js/dashboard/objectives.js'), lazy=read('assets/js/dashboard/lazy-assets.js'), sw=read('sw.js');
for(const k of ['nasdara_desert_relief','nasdara_rescue_patrol','nasdara_shelter_challenge','nasdara_military_recon']) {
  assert(h.includes(`data-event-preset="${k}"`),`Missing ${k} button`);
  assert(js.includes(`${k}:{name:`),`Missing ${k} template`);
}
assert(h.includes('data-quest-admin-community-grid'));
assert(obj.includes('payload.nasdara_community'));
assert(js.includes("location_source==='killzone'&&!template.zone_id"));
assert(js.includes('data-nasdara-event-preset'));
assert(js.includes('attendance_money:0'));
assert(lazy.includes('rev=nasdara-eventdesk-1'));
assert(sw.includes('nasdara-eventdesk-1'));
console.log('Nasdara Event Operations static checks passed');
