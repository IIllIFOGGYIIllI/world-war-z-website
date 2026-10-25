'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync('dashboard.html','utf8');
const js = fs.readFileSync('assets/js/dashboard/community.js','utf8');
const css = fs.readFileSync('assets/css/dashboard/raid-controls.css','utf8');
const lazy = fs.readFileSync('assets/js/dashboard/lazy-assets.js','utf8');
const sw = fs.readFileSync('sw.js','utf8');
for (const mark of ['data-raid-next-window','data-raid-phase-readout','data-raid-damage-alert','data-raid-damage-status']) {
  assert.ok(html.includes(mark), 'Missing raid status element: ' + mark);
  assert.ok(js.includes(mark), 'Missing raid status renderer: ' + mark);
}
assert.ok(js.includes('raid.attention_required'), 'Unresolved restorations must be visible');
assert.ok(js.includes('raid.blocked_weekend'), 'Previous stuck raids must be visible');
assert.ok(js.includes('raidToggle.disabled = !live || Boolean(raid.attention_required && !raid.enabled)'));
assert.ok(js.includes('Full-map PvP enforcement is NOT automated'));
assert.ok(js.includes('Never arm another weekend while the backend reports an unresolved restore'));
assert.ok(css.includes('.raid-operator-alert[hidden]'));
assert.ok(lazy.includes('stage6=raid-damage-1&lifecycle=2'));
assert.ok(html.includes('rev=manual-coords-1&amp;lifecycle=2'));
assert.ok(sw.includes('2026-10-26-events-reliability-1'));
console.log('PASS: Raid lifecycle states, next schedule, attention handling and PWA cache revision');
