/* WWZ V3.11: final, strictly presentational workspace cleanup. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const dash=read('dashboard.html'),sw=read('sw.js'),css=read('assets/css/dashboard/workspace-v311-final.css');
const uri='assets/css/dashboard/workspace-v311-final.css?v=3.11.0&amp;rev=workspace-complete-1';
assert.equal(dash.split(uri).length-1,1,'V3.11 CSS must load exactly once');
assert.ok(dash.indexOf(uri)>dash.indexOf('sidebar-v310.css'),'V3.11 styling must load after prior fixes');
assert.ok(!read('shop.html').includes(uri)&&!read('map-link.html').includes(uri),
  'Protected store and standalone map must not load dashboard overrides');
for(const token of [
  '[data-view-panel="staff"]','[data-view-panel="serverconfig"]',
  '[data-view-panel="shopadmin"]','[data-view-panel="configuration"]',
  '[data-view-panel="economy"]','[data-view-panel="players"]',
  '.wwz-v33-workspace-navigation','.wwz-v33-more-workspaces',
  '.wwz-admin-hub-links','.service-overview-grid',
  '.config-studio-tabs','.shop-admin-tabs',
  '.wwz-v32-finance-intro','.wwz-v32-finance-navigation',
  '.wwz-v32-wallet-overview','[data-economy-content]:not([hidden])',
  '.wwz-v32-profile-navigation','[data-profile-content]:not([hidden])',
  '.discord-profile-card','.survivor-identity',
  'overflow-x: auto','overscroll-behavior-x: contain',
  '@media (max-width: 920px)','@media (max-width: 620px)',
  'prefers-reduced-motion','forced-colors'
]) assert.ok(css.includes(token),'Missing V3.11 scoped refinement '+token);
assert.ok(!/\.leaflet-|\.wwz-gps-map|#wwz-detection-map|body\.member-shop-page/.test(css),
  'No map geometry or storefront styling');
assert.ok(!/fetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage/.test(css),
  'No network/storage operations allowed');
for(const hook of [
  'data-raid-damage-controls','data-server-action="restart"',
  'data-view-panel="staff"','data-view-panel="serverconfig"',
  'data-view-panel="shopadmin"','data-view-panel="configuration"',
  'data-view-panel="economy"','data-view-panel="players"',
  'data-bank-action="deposit"','data-bank-action="withdraw"',
  'data-treasury-admin','data-profile-psn',
  'data-v32-profile-tab="identity"','data-admin-gps-audit',
  'data-staff-only','data-owner-only'
]) assert.ok(dash.includes(hook),'Protected or existing UI hook missing '+hook);
assert.ok(read('shop.html').includes('data-member-cart-checkout'));
assert.ok(read('assets/js/dashboard/my-wwz.js').includes('data-my-wwz-gps'));
assert.ok(sw.includes('./assets/css/dashboard/workspace-v311-final.css?v=3.11.0&rev=workspace-complete-1'));
assert.match(sw, /const WWZ_PWA_UPDATE_REVISION = '[^']+';/, 'PWA revision must exist');
console.log('PASS: Admin/Owner, Economy and Survivor Profile responsive refinements with protected handlers intact');
