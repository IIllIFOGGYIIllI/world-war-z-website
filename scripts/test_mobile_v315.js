'use strict';
// V3.15: responsive dashboard refinements must stay presentation-only.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const css=read('assets/css/dashboard/mobile-v315.css');
const dashboard=read('dashboard.html');
const sw=read('sw.js');
const stylesheet='assets/css/dashboard/mobile-v315.css?v=3.15.0&amp;rev=mobile-usability-1';
assert.equal(dashboard.split(stylesheet).length-1,1,'V3.15 stylesheet loads once');
assert.ok(dashboard.indexOf(stylesheet)>dashboard.indexOf('command-palette-v314.css'),
 'V3.15 follows the prior touch-search sheet');
assert.ok(!read('index.html').includes(stylesheet),'No public-site side effects');
assert.ok(!read('shop.html').includes(stylesheet),'No standalone shop changes');
for(const token of [
 'body.wwz-v3-dashboard','--wwz-v315-hit: 44px',
 '.dashboard-sidebar','.wwz-v32-finance-navigation',
 '.wwz-v33-workspace-navigation','.action-centre-toolbar',
 '.zone-toolbar','.shop-management-toolbar','.wwz-v312-directory-controls',
 '.responsive-table','.wwz-ios-auth-panel','.wwz-ios-auth-actions',
 '.wwz-policy-gate','.command-palette','.wwz-rental-map-dialog',
 'env(safe-area-inset-bottom, 0px)','font-size: 16px !important',
 'prefers-reduced-motion','forced-colors: active'
])assert.ok(css.includes(token),'Missing mobile safety/UX coverage: '+token);
assert.ok(css.includes('overflow-x: auto')&&css.includes('touch-action: manipulation'));
assert.ok(!/display\s*:\s*none\s*!important/i.test(css),'Cannot hide actions or features');
assert.ok(!/pointer-events\s*:\s*none/i.test(css),'Cannot disable actions');
assert.ok(!/\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage/i.test(css));
assert.ok(!/\.leaflet-|maplibregl|#wwz-detection-map/i.test(css),'No map gesture changes');
assert.ok(sw.includes('./assets/css/dashboard/mobile-v315.css?v=3.15.0&rev=mobile-usability-1'),
 'PWA precaches V3.15');
assert.ok(sw.includes('2026-11-13-discord-policy-v318-1'),'PWA revision bumped');
for(const hook of [
 'data-ios-auth-transfer-submit','data-ios-auth-copy-link',
 'data-open-command-search','data-v312-directory',
 'data-server-action="restart"','data-raid-damage-controls'
])assert.ok(dashboard.includes(hook),'Existing control missing: '+hook);
assert.ok(read('assets/js/dashboard/ios-auth-handoff.js').includes('parseTransferLink'));
assert.ok(read('assets/js/dashboard/shell.js').includes('setCommandPaletteSelection'));
console.log('PASS: V3.15 mobile filter, navigation, dialog and iPhone handoff presentation safeguards');
