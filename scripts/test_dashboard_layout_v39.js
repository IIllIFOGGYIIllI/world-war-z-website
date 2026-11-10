/* V3.9 — screenshot-driven breadcrumb and vertical offset regression. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = path => fs.readFileSync(path,'utf8');
const pages = ['index.html','dashboard.html','shop.html','donations.html',
  'companion.html','rules.html','flags.html','legal.html','terms.html',
  'privacy.html','community-guidelines.html','moderation-policy.html',
  'changelog.html','map-link.html','offline.html','404.html'];
const uri='assets/js/site-refinement.js?v=2.1.1&amp;rev=breadcrumb-fix-1';
for(const path of pages){
  const html = read(path);
  assert.equal(html.split(uri).length - 1,1,path+' must load breadcrumb fix version once');
}
const dash=read('dashboard.html');
const js=read('assets/js/site-refinement.js');
const css=read('assets/css/dashboard/shell-v37.css');
const sw=read('sw.js');
assert.match(js, /querySelector\(':scope > summary strong'\)/,
  'Breadcrumb must read group title only, not the tool count badge');
assert.ok(js.includes("area.toLowerCase() !== 'dashboard'"),
  'Dashboard root must not be repeated in its own breadcrumb');
assert.ok(!js.includes("querySelector(':scope > summary')?.textContent"),
  'Legacy summary text would reintroduce Dashboard2');
assert.ok(js.includes("active.dataset.navLabel") && js.includes("active.setAttribute('aria-current', 'page')"),
  'Preserve existing route and active-page labels');
assert.ok(js.includes("if (allowed(prevButton)) prevButton.click()"),
  'Preserve access-checked previous-workspace navigation');
assert.match(css,/body\.wwz-v3-dashboard \.dashboard-shell \{\s*padding-top:\s*0\s*!important;\s*\}/,
  'Sticky V3 header must not retain the old fixed header top padding');
assert.equal(dash.split('assets/css/dashboard/shell-v37.css?v=3.7.1&amp;rev=top-offset-1').length - 1,1);
assert.ok(sw.includes('./assets/css/dashboard/shell-v37.css?v=3.7.1&rev=top-offset-1'));
assert.ok(sw.includes('./assets/js/site-refinement.js?v=2.1.1&rev=breadcrumb-fix-1'));
assert.match(sw, /const WWZ_PWA_UPDATE_REVISION = '[^']+';/, 'Missing PWA revision token');
for(const hook of ['data-raid-damage-controls','data-server-action="restart"',
  'data-open-command-search','data-sidebar-toggle','data-change-server',
  'data-view-panel="overview"','data-view-panel="map"']){
  assert.ok(dash.includes(hook),'Protected dashboard hook missing: '+hook);
}
assert.ok(read('shop.html').includes('data-member-cart-checkout'));
assert.ok(read('assets/js/dashboard/my-wwz.js').includes('data-my-wwz-gps'));
assert.ok(!/fetch\s*\(|XMLHttpRequest|WebSocket|localStorage/.test(js),
  'Shared UI code must not gain external data or storage operations');
console.log('PASS: V3.9 no double header gap, no Dashboard2 breadcrumb, 16-page asset version and protected controls');
