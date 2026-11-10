/* WWZ V3.8: screenshot-driven authenticated Overview density regression. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { Script } = require('node:vm');
const read = path => fs.readFileSync(path, 'utf8');
const dash = read('dashboard.html');
const css = read('assets/css/dashboard/overview-v38.css');
const nav = read('assets/js/dashboard/navigation-v31.js');
const pwa = read('sw.js');
const overviewCss='assets/css/dashboard/overview-v38.css?v=3.8.0&amp;rev=overview-compact-1';
const navJs='assets/js/dashboard/navigation-v31.js?v=3.1.1&amp;rev=sidebar-density-1';
assert.equal(dash.split(overviewCss).length - 1, 1,'Overview compact CSS once');
assert.ok(dash.indexOf(overviewCss) > dash.indexOf('shell-v37.css'),
  'Screenshot refinements must override V3.7 shell');
assert.equal(dash.split(navJs).length - 1, 1,'Cache-busted navigation script once');
assert.ok(nav.includes('saved.open = false;'),'Pinned/recent must start collapsed, but remain expandable');
assert.ok(nav.includes('saved.append(savedSummary)'),'Native disclosure must be preserved');
assert.ok(nav.includes('savedPanels.forEach((panel) => saved.append(panel))'),
  'Existing pinned and recent items must retain their buttons');
assert.ok(nav.includes('new MutationObserver(syncSaved)'),'Saved shortcut count remains live');
for(const token of [
  '[data-view-panel="overview"].member-home-ready > .metric-grid',
  '.metric-card .status-next-refresh',
  '.my-wwz-hero', '.my-wwz-metrics', '.my-wwz-hero-badges',
  '.dashboard-sidebar.wwz-v31-ready',
  '@media (max-width: 1360px)', '@media (max-width: 760px)',
  '@media (max-width: 420px)', 'prefers-reduced-motion','forced-colors'
]) assert.ok(css.includes(token),'Missing scoped Overview style '+token);
assert.ok(!css.includes('display: none'),'Updated tiles and controls cannot be hidden');
assert.ok(!/\.leaflet-|#wwz-detection-map|data-my-gps-map|wwz-v3-map/.test(css),
  'No map or GPS styling');
assert.ok(!/fetch\s*\(|XMLHttpRequest|WebSocket|localStorage/.test(css),
  'No app or game server actions');
assert.ok(dash.includes('data-server-action="restart"'));
assert.ok(dash.includes('data-raid-damage-controls'));
assert.ok(dash.includes('data-view-panel="map"'));
assert.ok(dash.includes('data-open-command-search'));
assert.ok(read('assets/js/dashboard/my-wwz.js').includes('v3NetworkTiles.insertAdjacentElement'),
  'Live network tiles and authenticated member overview must stay in their established order');
assert.ok(read('assets/js/dashboard/my-wwz.js').includes('data-my-wwz-gps'),
  'Personal GPS history stays wired');
assert.ok(read('shop.html').includes('data-member-cart-checkout'));
assert.ok(pwa.includes("const WWZ_PWA_UPDATE_REVISION = '2026-11-11-v3-8-overview-density-1';"));
assert.ok(pwa.includes('./assets/css/dashboard/overview-v38.css?v=3.8.0&rev=overview-compact-1'));
assert.ok(pwa.includes('./assets/js/dashboard/navigation-v31.js?v=3.1.1&rev=sidebar-density-1'));
new Script(nav,{filename:'navigation-v31.js'});
console.log('PASS: compact overview, preserved live status and signed-in widgets, accessible collapsed sidebar');
