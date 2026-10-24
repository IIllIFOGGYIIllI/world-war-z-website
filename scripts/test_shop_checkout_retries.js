/* Standalone Node checks: no browser and no live purchases required. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const store = new Map();
let next = 0;
const context = {
  window: {},
  sessionStorage: {
    getItem: key => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: key => store.delete(key)
  },
  Date: { now: () => ++next },
  Math: { random: () => (next + 100) / 10000 },
  JSON, String
};
context.globalThis = context;
vm.runInNewContext(fs.readFileSync('assets/js/core/checkout-idempotency.js', 'utf8'), context);
const checkout = context.window.WWZCheckoutIdempotency;
const pve = { key:'world-war-z', map_key:'badlands' };
const pvp = { key:'nasdara-pvp', map_key:'badlands' };
const request = {items:[{item_id:9, quantity:1, event_restarts:30000, delivery:{x:200,y:0,z:900,rotation:0}}],payment_method:'bank'};
const first = checkout.prepare({server:pve, identity:'1',request});
assert.ok(first.length >= 12);
assert.equal(checkout.prepare({server:pve,identity:'1',request}),first,'retry must not create a second payment key');
const changed = checkout.prepare({server:pve,identity:'1',request:{...request,items:[{...request.items[0],event_restarts:2}]}});
assert.notEqual(changed,first,'changing rental duration must start a new checkout');
const otherServer = checkout.prepare({server:pvp,identity:'1',request});
assert.notEqual(otherServer,changed,'PvE and PvP cannot share a checkout key');
const otherAccount = checkout.prepare({server:pve,identity:'2',request});
assert.notEqual(otherAccount,otherServer,'different Discord users cannot share a checkout key');
checkout.clear(otherAccount);
const nextPurchase = checkout.prepare({server:pve,identity:'2',request});
assert.notEqual(nextPurchase,otherAccount,'confirmed purchases permit a new order');
const storefront = fs.readFileSync('assets/js/pages/shop.js','utf8');
assert.match(storefront,/WWZCheckoutIdempotency\.prepare/);
assert.match(storefront,/WWZCheckoutIdempotency\.clear/);
assert.match(storefront,/items: rentalCart\.lines\(\)/);
const html = fs.readFileSync('shop.html','utf8');
assert.ok(html.includes('assets/js/core/checkout-idempotency.js'));
console.log('PASS: checkout retry idempotency, PvE/PvP isolation, server/client wiring');
