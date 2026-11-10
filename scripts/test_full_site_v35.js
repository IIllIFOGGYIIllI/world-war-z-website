/* V3.5: every public page carries V3, without modifying Nasdara map runtime. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const pages=['index.html','dashboard.html','shop.html','donations.html',
  'companion.html','rules.html','flags.html','legal.html','terms.html',
  'privacy.html','community-guidelines.html','moderation-policy.html',
  'changelog.html','map-link.html','offline.html','404.html'];
const theme='assets/css/command-centre-v3.css?v=3.0.0&amp;rev=command-centre-redesign-1';
for(const path of pages){
  const html=read(path);
  assert.equal(html.split(theme).length-1,1,path+' must load V3 exactly once');
  assert.match(html,/<body[^>]+class="[^"]*wwz-v3(?:\s|")/,path+' must activate V3 scope');
  assert.ok(html.indexOf(theme)>html.indexOf('site-refinement.css'),path+' must apply V3 after older style');
}
const map=read('map-link.html'),css=read('assets/css/map-hub-v35.css');
assert.match(map,/<body class="wwz-v3 wwz-v3-map">/);
assert.ok(!map.includes('wwz-v3-public'),'Map layout must use the isolated V3 map shell');
assert.equal(map.split('assets/css/map-hub-v35.css?v=3.5.0&amp;rev=all-pages-1').length-1,1);
for(const hook of ['id="wwz-detection-map"','data-layer-pois','data-layer-zones',
  'data-layer-roads','data-layer-names','data-layer-structures','data-map-hub-search',
  'data-public-poi-list','data-copy-coordinates','data-dashboard-map-link',
  'data-marker-zoom-in','data-marker-zoom-out','data-marker-reset',
  'data-marker-fullscreen','data-marker-coordinates','data-marker-loading']){
  assert.ok(map.includes(hook),'Protected map DOM hook missing '+hook);
}
for(const asset of ['assets/css/components/wwz-map.css?v=1.29.2',
  'assets/js/map/wwz-map.js?v=1.29.2',
  'assets/js/pages/map-link.js?v=1.28.2']){
  assert.ok(map.includes(asset),'Map engine asset/version must remain intact: '+asset);
}
assert.ok(!css.includes('.leaflet-'),'V3.5 must not style Leaflet internals');
assert.ok(!css.includes('#wwz-detection-map'),'V3.5 must not change map geometry');
assert.ok(!/fetch\s*\(|XMLHttpRequest|WebSocket|localStorage/.test(css),'Map shell is CSS only');
for(const p of ['rules.html','flags.html','donations.html','404.html']){
  assert.ok(!/Badlands (?:and|&) Livonia/i.test(read(p)),p+' still has retired-world current copy');
}
const dash=read('dashboard.html');
assert.ok(!dash.includes('Chernarus Live</h2>'),'Map fallback title must be Nasdara');
assert.ok(!dash.includes('Create reusable areas for Chernarus or Livonia'),'Zone help must reflect current servers');
assert.ok(dash.includes('data-raid-damage-controls'),'Raid controls retained');
assert.ok(dash.includes('data-server-action="restart"'),'Server action wiring retained');
assert.ok(read('shop.html').includes('data-member-cart-checkout'),'Shop checkout retained');
const sw=read('sw.js');
assert.match(sw, /const WWZ_PWA_UPDATE_REVISION = '[^']+';/, 'PWA update revision must be present');
assert.ok(sw.includes('./assets/css/map-hub-v35.css?v=3.5.0&rev=all-pages-1'),
  'Installed PWA shell must include the new stylesheet');
console.log('PASS: 16/16 V3 pages, map geometry isolated, Nasdara copy and protected handlers retained');
