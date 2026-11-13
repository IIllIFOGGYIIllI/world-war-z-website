'use strict';
// V3.17 — scoped desktop/mobile workspace polish without functional changes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = path => fs.readFileSync(path, 'utf8');
const dash = read('dashboard.html');
const css = read('assets/css/dashboard/workspace-v317.css');
const sw = read('sw.js');
const url = 'assets/css/dashboard/workspace-v317.css?v=3.17.0&amp;rev=workspace-polish-1';
assert.equal(dash.split(url).length - 1, 1, 'V3.17 stylesheet loads exactly once');
assert.ok(dash.indexOf(url) > dash.indexOf('topbar-v316.css'), 'V3.17 overrides prior shell only where scoped');
assert.ok(!read('index.html').includes(url) && !read('shop.html').includes(url),
  'No V3.17 overrides on public or standalone shopping pages');
for (const token of [
  'body.wwz-v3-dashboard', '--wwz-v317-line',
  '[data-view-panel="players"]', '[data-view-panel="economy"]',
  '[data-view-panel="staff"]', '[data-view-panel="serverconfig"]',
  '[data-view-panel="shopadmin"]', '[data-view-panel="configuration"]',
  '.wwz-v32-profile-navigation', '.wwz-v32-finance-navigation',
  '.wwz-v33-workspace-navigation', '.wwz-v33-more-workspaces',
  '.profile-quick-links', '.bank-metric-grid', '.treasury-metric-grid',
  '.config-studio-tabs', '.shop-admin-tabs', '.wwz-admin-hub-links',
  'font-variant-numeric: tabular-nums', 'overflow-wrap: anywhere',
  'min-height: 44px', 'focus-visible', 'aria-current="location"',
  '@media (max-width: 620px)', '@media (max-width: 420px)',
  'prefers-reduced-motion', 'forced-colors: active'
]) assert.ok(css.includes(token), 'Missing V3.17 UI requirement: ' + token);
assert.ok(!/display\s*:\s*none\s*!important|pointer-events\s*:\s*none/i.test(css),
  'V3.17 may not hide controls or disable events');
assert.ok(!/\.leaflet-|maplibregl|\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage/i.test(css),
  'No GPS/map, network or account side effects');
assert.ok(sw.includes('./assets/css/dashboard/workspace-v317.css?v=3.17.0&rev=workspace-polish-1'));
assert.ok(sw.includes('2026-11-14-alt-admin-v321-1'));
for(const hook of [
  'data-open-command-search', 'data-change-server',
  'data-v32-profile-tab="identity"', 'data-v32-finance-target="banking"',
  'data-server-action="restart"', 'data-raid-damage-controls',
  'data-staff-only', 'data-owner-only',
  'data-bank-balance', 'data-treasury-admin'
]) assert.ok(dash.includes(hook), 'Protected functionality absent: ' + hook);
assert.ok(read('assets/js/dashboard/server-context.js').includes('wwz_dashboard_server'),
  'Server selection and isolation remains owned by the original handler');
console.log('PASS: V3.17 profile/economy/admin workspace UI, desktop/mobile, protected actions intact');
