'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('dashboard.html', 'utf8');
const js = fs.readFileSync('assets/js/dashboard/community.js', 'utf8');
const css = fs.readFileSync('assets/css/dashboard/community.css', 'utf8');
const loader = fs.readFileSync('assets/js/dashboard/lazy-assets.js', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');
for (const marker of [
  'data-automation-history-owner',
  'data-automation-raid-history',
  'data-automation-wipe-history',
  'data-automation-history-count',
  'data-automation-history-note',
]) {
  assert.ok(html.includes(marker), `Missing history UI marker: ${marker}`);
}
assert.match(js, /const renderAutomationHistory\s*=/);
assert.match(js, /dashboardAccessLevel === 'owner'/);
assert.ok(js.includes('renderAutomationHistory(payload.automation_execution_history || null)'));
assert.ok(js.includes('renderAutomationHistory(adminPayload?.automation_execution_history || null)'));
const from = js.indexOf('const renderAutomationHistory =');
const to = js.indexOf('const renderPlanner', from);
const renderer = js.slice(from, to);
assert.ok(from >= 0 && to > from);
assert.ok(!/fetch\s*\(|XMLHttpRequest|adminAction\s*\(|restartServer|window\.location\s*=/.test(renderer),
  'History must have no external calls or live actions');
assert.ok(renderer.includes('document.createElement') &&
  !renderer.includes('innerHTML'), 'History must render untrusted values as text');
assert.ok(css.includes('.wwz-automation-history-grid'));
assert.ok(css.includes('@media(max-width:850px)'));
assert.ok(loader.includes('&automationhistory=1'), 'Lazy assets should be cache busted');
assert.ok(sw.includes("2026-11-24-automation-history-1"), 'PWA revision must refresh');
new vm.Script(js, {filename: 'community.js'});
console.log('PASS: Owner-only, server-scoped, read-only automation history UI');
