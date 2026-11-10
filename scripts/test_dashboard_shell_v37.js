/* V3.7 responsive shell and nested dashboard cards safety contract. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const dash=read('dashboard.html'),sw=read('sw.js');
const style=read('assets/css/dashboard/shell-v37.css');
const asset='assets/css/dashboard/shell-v37.css?v=3.7.0&amp;rev=responsive-shell-1';
assert.equal(dash.split(asset).length-1,1,'Dedicated dashboard layout sheet must load exactly once');
assert.ok(dash.indexOf(asset)>dash.indexOf('workspace-v33-administration.css'),'Scoped sheet must follow all workspace CSS');
assert.ok(!read('index.html').includes(asset)&&!read('shop.html').includes(asset)
  &&!read('map-link.html').includes(asset),'Authenticated dashboard shell must not affect public pages');
for(const token of ['--wwz-v37-work-width: 1750px','.topbar-workspace',
  '.dashboard-search-trigger','.account-menu-trigger','.server-switcher',
  '.dashboard-main > :is(.preview-banner,.auth-message,.wwz-location-bar)',
  '.dashboard-view .panel .inset-panel','.sidebar-scrim',
  '@media (max-width: 1380px)','@media (max-width: 1180px)',
  '@media (max-width: 980px)','@media (max-width: 760px)',
  '@media (max-width: 600px)','@media (max-width: 360px)',
  'prefers-reduced-motion','forced-colors: active']){
  assert.ok(style.includes(token),'Missing safe responsive shell refinement: '+token);
}
for(const hook of ['data-server-action="restart"','data-raid-damage-controls',
  'data-sidebar-toggle','data-change-server','data-open-login',
  'data-open-command-search','data-view-panel="map"','data-view-panel="players"',
  'data-member-cart-checkout','data-profile-playtime','data-my-wwz-gps']){
  const sources=hook==='data-my-wwz-gps'?read('assets/js/dashboard/my-wwz.js')
    :hook==='data-member-cart-checkout'?read('shop.html'):dash;
  assert.ok(sources.includes(hook),'Protected existing flow missing: '+hook);
}
assert.ok(dash.includes('aria-label="Change World War Z server"'));
assert.ok(dash.includes('aria-label="Install or update World War Z app"'));
assert.ok(dash.includes('aria-label="Discord account and sign-in"'));
assert.ok(!/\.leaflet-|#wwz-detection-map|wwz-v3-map|wwz-v3-public/.test(style),
  'Shell styles must not modify map internals or public pages');
assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage/.test(style),
  'V3.7 shell update must contain CSS only, no data or server actions');
assert.match(sw, /const WWZ_PWA_UPDATE_REVISION = '[^']+';/, 'Missing PWA revision token');
assert.ok(sw.includes('./assets/css/dashboard/shell-v37.css?v=3.7.0&rev=responsive-shell-1'));
console.log('PASS: scoped responsive dashboard header, nested cards and mobile drawer, preserving original routes');
