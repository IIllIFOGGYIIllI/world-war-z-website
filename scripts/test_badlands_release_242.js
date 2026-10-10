'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname,'..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const h=read('dashboard.html'), js=read('assets/js/dashboard/community.js'), sw=read('sw.js');
for (const bit of ['data-event-end-condition-field hidden', 'name="end_condition"', 'badlands_playstation_release', 'When Badlands officially releases on PlayStation']) {
  assert.ok(h.includes(bit), `Missing release option ${bit}`);
}
for (const bit of ["end_condition:'badlands_playstation_release'", "end_condition:'manual'", 'isBadlandsEvent', 'eventEnding', 'Confirm Badlands Released & End Event', 'confirm_badlands_release:release']) {
  assert.ok(js.includes(bit), `Missing UI or confirmation wiring: ${bit}`);
}
assert.ok(sw.includes("WWZ_PWA_VERSION = '2.6.0'"));
assert.ok(sw.includes("MAP_CACHE_RELEASE = `${WWZ_PWA_CACHE_RELEASE_VERSION}-${WWZ_PWA_CACHE_REVISION}`"));
console.log('Badlands release-linked event UI: 12 assertions passed');
