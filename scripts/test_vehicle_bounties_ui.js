'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const page = fs.readFileSync('dashboard.html','utf8');
const lazy = fs.readFileSync('assets/js/dashboard/lazy-assets.js','utf8');
const script = fs.readFileSync('assets/js/dashboard/vehicle-bounties.js','utf8');
const map = fs.readFileSync('assets/js/pages/dashboard-map-loader.js','utf8');
const sw = fs.readFileSync('sw.js','utf8');

assert.ok(page.includes('data-view="community" type="button"') && page.includes('data-section="bounties"'));
assert.ok(page.includes('data-dashboard-section="bounties"'));
for (const field of ['vehicle_name', 'before_image', 'after_image', 'notes', 'name="x"', 'name="z"']) {
  assert.ok(page.includes(field), 'Missing field: ' + field);
}
for (const marker of ['data-bounty-staff', 'data-bounty-queue', 'data-bounty-refresh', 'data-bounty-use-selection']) {
  assert.ok(page.includes(marker));
}
assert.ok(lazy.includes('vehicle-bounties.js?v=2'));
assert.ok(lazy.includes('vehicle-bounties.css?v=2'));
assert.ok(script.includes('/api/account/vehicle-bounties'));
assert.ok(script.includes('/api/admin/vehicle-bounties'));
assert.ok(script.includes('initialScope !== scope()'));
assert.ok(script.includes('token !== session()'));
assert.ok(script.includes('window.WWZHttp.json'));
assert.ok(script.includes("row.status === 'pending'"));
assert.ok(script.includes("body: fields"), 'Screenshots must be uploaded directly with FormData');
assert.ok(script.includes("body instanceof FormData"), 'Browser must set multipart boundary');
assert.ok(!script.includes('localStorage.setItem('), 'Never persist a bearer token or claim evidence');
assert.ok(map.includes('window.WWZBountyMapSelection = {'));
assert.ok(map.includes('serverKey: String(window.WWZServerContext?.getSelectedServer?.()?.key || \'\')'));
assert.ok(sw.includes('2026-10-27-vehicle-bounties-images-2'));
console.log('PASS: Dual-server vehicle bounties, staff reviews and map point handoff');
