'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync('dashboard.html', 'utf8');
const js = fs.readFileSync('assets/js/dashboard/zones.js', 'utf8');
const css = fs.readFileSync('assets/css/dashboard/zones.css', 'utf8');
const lazy = fs.readFileSync('assets/js/dashboard/lazy-assets.js', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');
for (const removed of ['data-killzone-runtime-card', 'data-killzone-runtime-enable', 'data-killzone-runtime-suspend', 'Server-wide PvP policy']) {
  assert.ok(!html.includes(removed), 'Retired server-wide PvP card must not appear: ' + removed);
}
for (const removed of ['setKillzoneRuntime', 'renderKillzoneRuntime', 'data-killzone-runtime-enable', 'data-killzone-runtime-suspend', 'On Chernarus']) {
  assert.ok(!js.includes(removed), 'Legacy panel scripts should be gone: ' + removed);
}
assert.ok(!css.includes('.killzone-runtime-card'), 'Retired card CSS should be gone');
assert.ok(js.includes('state.killzoneRuntime = payload.killzone_runtime'), 'Continue reading runtime state to label zones accurately');
assert.ok(js.includes('state.killzonesEnabled = state.killzoneRuntime.enabled !== false'), 'Preserve actual zone enforcement status');
assert.ok(js.includes('zoneRuntimeSuspended(zone)'), 'Zone rows should still show their true effective status');
assert.ok(js.includes('renderZoneOverlays()'), 'Map overlay rendering must remain intact');
assert.ok(css.includes('.zone-status-pill.suspended'), 'Keep suspended status pill style');
assert.ok(html.includes('data-zone-list'), 'Keep zone management and saved zones');
assert.ok(lazy.includes('nasdara-policy-cleanup-1'), 'Refresh zone CSS and JS browser assets');
assert.ok(sw.includes('2026-11-16-nasdara-zone-cleanup-1'), 'Trigger installed PWA update');
console.log('PASS: Retired KILLZONES global control removed with zone data, indicators, and PWA update retained');
