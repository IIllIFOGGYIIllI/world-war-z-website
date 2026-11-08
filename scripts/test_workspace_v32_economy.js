/* World War Z V3.2 Economy & Banking presentation + safety contract. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {Script}=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const dashboard=read('dashboard.html'),shop=read('shop.html'),sw=read('sw.js');
const css=read('assets/css/dashboard/workspace-v32-economy.css'),js=read('assets/js/dashboard/workspace-v32-economy.js');
const bank=read('assets/js/dashboard/account.js'),treasury=read('assets/js/dashboard/treasury.js');
const shopJs=read('assets/js/pages/shop.js');
const style='assets/css/dashboard/workspace-v32-economy.css?v=3.2.1&amp;rev=v3-2-finance-1',script='assets/js/dashboard/workspace-v32-economy.js?v=3.2.1&amp;rev=v3-2-finance-1';
assert.equal(dashboard.split(style).length-1,1,'Economy styles load once on dashboard');
assert.equal(shop.split(style).length-1,1,'Rental layout styles load once on shop');
assert.equal(dashboard.split(script).length-1,1,'Economy navigation loads once on dashboard');
assert.ok(!shop.includes(script),'Shop must not execute dashboard routing');
assert.ok(dashboard.indexOf(style)>dashboard.indexOf('workspace-v32-profile-gps.css'),'Economy theme loads last');
assert.ok(dashboard.indexOf(script)>dashboard.indexOf('workspace-v32-profile-gps.js'),'Economy controller loads last');
assert.ok(sw.includes('./assets/css/dashboard/workspace-v32-economy.css?v=3.2.1&rev=v3-2-finance-1') && sw.includes('./assets/js/dashboard/workspace-v32-economy.js?v=3.2.1&rev=v3-2-finance-1'),'Finance release assets included in PWA shell');
assert.ok(sw.includes("const WWZ_PWA_UPDATE_REVISION = '2026-11-09-v3-2-economy-banking-1';"));
for(const token of [
  'data-economy-content=""',
  'class="wwz-v32-finance-navigation"',
  'class="metric-grid wwz-v32-wallet-overview"',
  'data-v32-finance-target="wallet"',
  'data-v32-finance-target="banking"',
  'data-v32-finance-target="treasury"',
  'data-v32-finance-target="ledger"',
  'shop.html?section=rentals',
  'id="dashboard-economy-banking"',
  'id="dashboard-economy-treasury"',
  'id="dashboard-economy-ledger"',
  'data-bank-action="deposit"',
  'data-bank-action="withdraw"',
  'data-bank-amount',
  'data-treasury-contribute',
  'data-treasury-admin',
  'data-economy-transactions',
  'data-bank-transactions',
  'data-economy-earned',
  'data-economy-balance',
])assert.ok(dashboard.includes(token),'Missing protected economy feature: '+token);
for(const token of [
  'id="rentals" data-member-rental-cart',
  'id="orders"',
  'data-rental-cart-checkout',
  'data-member-orders-scope',
  'data-member-orders-active-rentals',
])assert.ok(shop.includes(token),'Rental checkout or history missing: '+token);
for(const token of [
  '[data-economy-content][hidden]',
  'wwz-v32-finance-navigation',
  '#dashboard-economy-banking',
  '#dashboard-economy-treasury',
  '#dashboard-economy-ledger',
  'treasury-admin][hidden]',
  'bank-metric-grid',
  'treasury-metric-grid',
  'member-shop-page.wwz-v3',
  '#rentals',
  '#orders',
  '@media(max-width:700px)',
  'prefers-reduced-motion',
  'forced-colors',
])assert.ok(css.includes(token),'Missing V3.2 finance styling: '+token);
for(const token of [
  "allowedSections=new Set(['wallet','banking','treasury','ledger'])",
  'existing.click()',
  "window.addEventListener('wwz:viewchange'",
  "link.closest('[hidden]')",
])assert.ok(js.includes(token),'Economy nav must delegate to original router: '+token);
assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|requestJson|nitrado_action/.test(js),'Finance nav must not call network');
assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket/.test(css),'Finance styles must be presentation only');
assert.ok(bank.includes('data-bank-balance'),'Original bank model remains');
assert.ok(treasury.includes('/api/account/treasury/action'),'Original treasury action endpoint unchanged');
assert.ok(shopJs.includes("requestedSection === 'rentals'"),'Existing My Rentals filter retained');
assert.ok(dashboard.includes('data-server-action="restart"'),'Server controls remain');
assert.ok(dashboard.includes('data-raid-damage-controls'),'Raid Weekend controls remain');
new Script(js,{filename:'workspace-v32-economy.js'});
console.log('PASS: V3.2 Economy, bank, treasury, ledger and rentals UI with original finance controls');
