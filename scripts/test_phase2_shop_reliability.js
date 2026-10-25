'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = path => fs.readFileSync(path, 'utf8');
const shop = read('assets/js/dashboard/shop.js');
const lazy = read('assets/js/dashboard/lazy-assets.js');
const publicShop = read('assets/js/pages/shop.js');
const dashboard = read('dashboard.html');
const checkout = read('assets/js/core/checkout-idempotency.js');
for (const part of [
  'window.WWZCheckoutIdempotency.prepare({',
  'window.WWZCheckoutIdempotency.clear(purchaseKey)',
  'request: purchaseRequest',
  'checkoutRequestSent = true',
  'Retrying the same checkout keeps the original payment key.',
  'if (shopRequestInProgress) { shopRefreshPending = true; return false; }',
  'if (!shopScopeCurrent(scope)) return false;',
  'shopRequestEpoch += 1;',
  'adminShopRequestEpoch += 1;',
  "window.addEventListener('wwz:authchange'",
  'Rental active · remaining restarts are tracked separately for this vehicle.',
  'Waiting for first spawn · rental restart tracking begins after activation.',
  'shop.html?section=rentals'
]) assert.ok(shop.includes(part), 'missing Phase 2 shop guard: ' + part);
assert.ok(!shop.includes('window.setTimeout(() => loadMemberShop(sessionToken), 250)'), 'remove stacked refresh retries');
assert.ok(!shop.includes('const purchaseKey = `${Date.now().toString(36)}'), 'remove fresh purchase key on every retry');
const helper = lazy.indexOf('const ensureCheckoutIdempotency');
const controller = lazy.indexOf('const ensureShopController');
assert.ok(helper >= 0 && helper < controller, 'key generator loads before dashboard shop');
assert.ok(lazy.includes('ensureShopHelpers(), ensureCheckoutIdempotency()'));
assert.ok(lazy.includes('shop.js?v=2.1.1&rev=phase2-reliability-1'));
assert.ok(publicShop.includes("window.setInterval(() => { if (!document.hidden) void loadRestartStatus(); }, 30_000)"));
assert.ok(checkout.includes('server_key:') && checkout.includes('discord_id:'));
assert.ok(dashboard.includes('shop-phase2.css?v=1.22.93&rev=phase2-1'));
console.log('PASS: Phase 2 dashboard checkout retry safety, rental management and refresh coalescing');
