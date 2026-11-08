/* Full WWZ V3 dashboard/site redesign regression and safety contract. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const dash=read('dashboard.html'),shop=read('shop.html'),home=read('index.html');
const css=read('assets/css/command-centre-v3.css');
const js=read('assets/js/command-centre-v3.js');
const sw=read('sw.js');
const style='assets/css/command-centre-v3.css?v=3.0.0&amp;rev=command-centre-redesign-1';
const script='assets/js/command-centre-v3.js?v=3.0.0&amp;rev=command-centre-redesign-1';

for (const [name,page] of [['dashboard',dash],['shop',shop],['home',home]]) {
  assert.equal(page.split(style).length-1,1,name+' loads the V3 design once');
  assert.ok(page.indexOf(style)>page.indexOf('site-refinement.css'),name+' V3 styles load after old base');
  assert.ok(page.lastIndexOf(style)<page.indexOf('</head>'),name+' CSS belongs in head');
}
const publicPages=['donations.html','companion.html','rules.html','flags.html',
  'legal.html','terms.html','privacy.html','community-guidelines.html',
  'moderation-policy.html','changelog.html','offline.html','404.html'];
for(const path of publicPages){
  const page=read(path);
  assert.equal(page.split(style).length-1,1,path+' must load V3 visual theme once');
  assert.match(page,/<body[^>]+class="[^"]*wwz-v3-public/,'Missing V3 scope on '+path);
}
const map=read('map-link.html');
assert.ok(!map.includes('command-centre-v3.css'),'Map canvas must preserve its established render CSS');
assert.ok(!map.includes('wwz-v3-public'),'Map viewport remains isolated from full-site redesign');
assert.ok(!read('dashboard.html').includes('Shop &amp; Trader'),'No retired Trader group');
assert.ok(read('dashboard.html').includes('<strong>Survivor Shop</strong><small>3</small>'),'Shop group remains reachable');
assert.ok(dash.includes('class="dashboard-gated wwz-v3 wwz-v3-dashboard"'));
assert.ok(shop.includes('class="member-shop-page wwz-v3"'));
assert.ok(home.includes('class="wwz-v3 wwz-v3-home"'));
assert.equal(dash.split(script).length-1,1);
assert.equal(shop.split(script).length-1,0,'Shop must not execute dashboard-only logic');
assert.equal(home.split(script).length-1,0,'Home must not execute dashboard-only logic');
assert.ok(dash.indexOf(script)>dash.indexOf('workspace-phase2.js'));
assert.ok(dash.includes('<div class="wwz-v3-command-intro">'));
assert.ok(dash.includes('<div class="wwz-v3-section-heading"><h2>Network at a glance'));
assert.ok(dash.includes('data-v3-live-status'));
assert.ok(dash.includes('data-v3-wide-toggle'));
assert.ok(dash.includes('data-wwz-selected-server-logo'));
assert.ok(dash.includes('data-raid-damage-controls'), 'Owner Raid Weekend controls retained');
assert.ok(dash.includes('data-server-action="restart"'), 'No server action removed');
assert.ok(dash.includes('data-auth-cta'), 'Discord login handler preserved');
assert.ok(dash.includes('data-restart-progress'), 'Live restart widget preserved');
assert.ok(dash.includes('data-wwz-selected-server-logo'), 'PvE/PvP branding preserved');
assert.ok(dash.includes('data-profile-playtime'), 'Survivor stats remain');
assert.ok(dash.includes('data-view-panel="map"'), 'Map workspace remains');
assert.ok(dash.includes('data-view-panel="zones"'), 'Admin zones workspace remains');
assert.ok(dash.includes('data-view-panel="staff"'), 'Admin workspace remains');
assert.ok(dash.includes('data-view-panel="shop"'), 'Shop workspace remains');
assert.ok(dash.includes('data-open-command-search'), 'Original command search still available');
assert.ok(shop.includes('<div class="wwz-v3-shop-intro">'), 'Shop hero and server selector recompose');
assert.ok(dash.includes('Survivor Shop'), 'Remove retired Trader sidebar group');
assert.ok(!dash.includes('Shop &amp; Trader'), 'No obsolete Trader label');
assert.ok(shop.includes('data-shop-server-buttons'), 'Server switcher stays scoped');
assert.ok(shop.includes('data-member-shop-catalogue'), 'Live catalogue retained');
assert.ok(shop.includes('data-member-cart-checkout'), 'Checkout is still wired');
assert.ok(shop.includes('data-member-rental-cart'), 'Multi-vehicle rentals retained');
assert.ok(home.includes('class="wwz-v3-home-feature"'), 'Hero restructured into two-column composition');
assert.ok(home.includes('id="getting-started"'), 'Existing anchors remain');
assert.ok(!home.includes('100 Commands'), 'Stale static command count removed');

for (const token of [
  '.wwz-v3-command-intro',
  '.wwz-v3-shop-intro',
  '.wwz-v3-home-feature',
  '.wwz-v3-layout-control',
  '.wwz-v3-hero-live',
  '[data-view-panel=',
  '.wwz-v3-section-heading',
  'grid-template-columns',
  'minmax(0,1.65fr)',
  'minmax(0,1.45fr)',
  '@media(max-width:980px)',
  '@media(max-width:700px)',
  '@media(prefers-reduced-motion:reduce)',
  'forced-colors:active',
  "url('../world-war-z-dashboard-bg.webp')",
])assert.ok(css.includes(token),'Missing genuine V3 styling '+token);
assert.ok(!css.includes("url('..//"),'Hero image path must resolve inside assets');
assert.ok(js.includes('localStorage.setItem(key'), 'Wide mode saves presentation preference only');
assert.ok(js.includes("new MutationObserver(sync).observe(liveSource"));
assert.ok(js.includes('body.classList.toggle'), 'Wide mode actually changes grid layout');
assert.ok(!/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|restartServer|nitrado_action/i.test(js),
  'V3 UI is fully presentation-only with zero game-server calls');
assert.ok(sw.includes('./assets/css/command-centre-v3.css?v=3.0.0&rev=command-centre-redesign-1'));
const recovery='assets/css/command-centre-v3-layout-recovery.css?v=3.0.1&amp;rev=v3-layout-recovery-1';
const recoveryCss=read('assets/css/command-centre-v3-layout-recovery.css');
for(const [name,page] of [['dashboard',dash],['shop',shop],['home',home]]) {
  assert.equal(page.split(recovery).length-1,1,name+' must load V3 layout recovery once');
  assert.ok(page.indexOf(recovery)>page.indexOf(style),name+' recovery CSS must win the cascade');
}
assert.ok(sw.includes('./assets/css/command-centre-v3-layout-recovery.css?v=3.0.1&rev=v3-layout-recovery-1'));
assert.ok(recoveryCss.includes('grid-column:1!important; grid-row:1!important'), 'Hero position stays fixed');
assert.ok(recoveryCss.includes('overflow-wrap:anywhere!important'), 'Long account names must not collapse the layout');
assert.ok(recoveryCss.includes('grid-column:1!important; grid-row:2!important'), 'Mobile shortcuts stack below hero');
assert.ok(!recoveryCss.includes('fetch(') && !recoveryCss.includes('XMLHttpRequest') && !recoveryCss.includes('WebSocket'), 'Presentation-only recovery');

assert.ok(sw.includes('./assets/js/command-centre-v3.js?v=3.0.0&rev=command-centre-redesign-1'));
assert.ok(sw.includes("const WWZ_PWA_UPDATE_REVISION = '2026-11-08-command-centre-v3-layout-recovery-1';"));
new vm.Script(js,{filename:'command-centre-v3.js'});
console.log('PASS: genuine home, dashboard and shop V3 layouts with unchanged protected flows');
