/* WWZ V3.10 — sidebar density, permission-aware category jumps. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { Script } = require('node:vm');
const read = path => fs.readFileSync(path, 'utf8');
const dash = read('dashboard.html'), sw = read('sw.js');
const css = read('assets/css/dashboard/sidebar-v310.css');
const js = read('assets/js/dashboard/sidebar-v310.js');
const style = 'assets/css/dashboard/sidebar-v310.css?v=3.10.0&amp;rev=category-jump-1';
const script = 'assets/js/dashboard/sidebar-v310.js?v=3.10.0&amp;rev=category-jump-1';
assert.equal(dash.split(style).length-1,1,'Dashboard sidebar style loads once');
assert.equal(dash.split(script).length-1,1,'Dashboard sidebar code loads once');
assert.ok(dash.indexOf(style)>dash.indexOf('overview-v38.css'),
  'Sidebar refinement must follow existing dashboard styles');
assert.ok(dash.indexOf(script)>dash.indexOf('navigation-v31.js'),
  'Existing nav routing and pin/recent handlers must initialise first');
assert.ok(!read('shop.html').includes(style) && !read('map-link.html').includes(script),
  'Sidebar enhancement must be dashboard-only');
assert.ok(dash.includes('data-wwz-selected-server-logo') && dash.includes('data-dashboard-mode'),
  'Selected server context retains original bindings');
assert.ok(dash.includes('data-pwa-install') && read('assets/js/pwa.js').includes('link.dataset.companionSidebarLink'),
  'Original install action and companion link remain');
for (const token of [
  '.service-context-card', '.service-context-icon', '.service-context-state',
  '.pwa-companion-sidebar', '.wwz-workspace-discovery',
  '.wwz-v310-category-jump', 'position: sticky', 'scroll-margin-top',
  '@media (max-width: 980px)', 'prefers-reduced-motion', 'forced-colors'
]) assert.ok(css.includes(token),'Missing V3.10 sidebar style '+token);
for (const token of [
  "details[data-nav-group]", ".side-link[data-view]",
  "element.closest('[hidden]')", "routeCount(group) > 0",
  "categoryName(group)", "picker.replaceChildren(placeholder)",
  "picker.addEventListener('change'", "group.open = true",
  "search.dispatchEvent(new Event('input'", "summary?.focus({ preventScroll: true })",
  "window.addEventListener('wwz:accesschange', refresh)",
  "window.addEventListener('wwz:authchange', refresh)",
  "window.addEventListener('wwz:viewchange', refresh)",
  "attributeFilter: ['hidden', 'disabled']"
]) assert.ok(js.includes(token),'Missing accessible permission-aware category behavior: '+token);
assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|\.click\s*\(\s*\)/.test(js),
  'Jump control must never fetch, persist or trigger protected navigation');
assert.ok(sw.includes('./assets/css/dashboard/sidebar-v310.css?v=3.10.0&rev=category-jump-1'));
assert.ok(sw.includes('./assets/js/dashboard/sidebar-v310.js?v=3.10.0&rev=category-jump-1'));
assert.match(sw, /const WWZ_PWA_UPDATE_REVISION = '[^']+';/, 'Missing PWA revision');
for (const hook of ['data-open-command-search','data-sidebar-toggle',
  'data-raid-damage-controls','data-server-action="restart"',
  'data-view-panel="players"','data-view-panel="map"'])
  assert.ok(dash.includes(hook),'Original protected dashboard hook missing: '+hook);
new Script(js,{filename:'sidebar-v310.js'});
console.log('PASS: V3.10 compact server/Companion sections, accessible group jump and role-safe category listings');
