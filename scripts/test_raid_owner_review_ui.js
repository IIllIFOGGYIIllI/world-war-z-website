'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const page = fs.readFileSync('dashboard.html','utf8');
const app = fs.readFileSync('assets/js/dashboard/community.js','utf8');
const css = fs.readFileSync('assets/css/dashboard/raid-controls.css','utf8');
const cache = fs.readFileSync('sw.js','utf8');
const lazy = fs.readFileSync('assets/js/dashboard/lazy-assets.js','utf8');
for (const name of ['data-raid-restoration-panel hidden',
  'data-raid-restoration-confirm hidden',
  'data-raid-restoration-result role="status" hidden']) {
  assert.ok(page.includes(name), 'Missing guarded Owner recovery widget: ' + name);
}
assert.ok(app.includes('raid.owner_restoration_review_available === true'));
assert.ok(app.includes("dashboardAccessLevel !== 'owner'"));
assert.ok(app.includes("server?.gameplay_mode !== 'pve'"));
assert.ok(app.includes("button.hidden || button.disabled"));
assert.ok(app.includes("action: 'raid_confirm_restoration', owner_verified: true"));
assert.ok(app.includes("scope !== selectedScope()"));
assert.ok(app.includes("confirmed.restart_observation !== 'owner_verified'"));
assert.ok(app.includes('No Nitrado settings or restarts were changed.'));
assert.ok(css.includes('.raid-restore-review[hidden]'));
assert.ok(lazy.includes('ownerreview=1'));
assert.ok(cache.includes('2026-10-26-ios-auth-return-3'));
console.log('PASS: Owner-only restoration recovery, scoped state and PWA cache');
