'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/js/dashboard/server-context.js', 'utf8');
const loader = fs.readFileSync('assets/js/pages/dashboard-map-loader.js', 'utf8');
const storage = new Map();
function openContext(search) {
  const location = { search, reload(){} };
  const context = {
    document: { querySelector: () => null, querySelectorAll: () => [], body: { classList: { toggle(){} } } },
    window: { clearTimeout(){}, setTimeout(){ return 1; }, dispatchEvent(){} },
    location,
    sessionStorage: {
      setItem(k, v) { storage.set(k,v); },
      getItem(k) { return storage.has(k) ? storage.get(k) : null; },
      removeItem(k) { storage.delete(k); }
    },
    URLSearchParams,
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } }
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.window.WWZServerContext;
}
const choose = (app, key, mode) => app.selectServer({
  key, name: `World War Z | Nasdara ${mode}`, map_key: 'badlands', gameplay_mode: mode
}, {restored: true});

let app = openContext('?map=badlands&server=nasdara-pvp&poi=market');
let link = app.getMapDeepLink();
assert.equal(link.x, null, 'a POI-only URL must not invent X=0');
assert.equal(link.z, null, 'a POI-only URL must not invent Z=0');
assert.equal(link.server_key, 'nasdara-pvp');
assert.equal(choose(app, 'nasdara-pve', 'pve'), true);
assert.equal(app.matchesMapDeepLink(link), false, 'PvP link must not open against PvE');
assert.equal(choose(app, 'nasdara-pvp', 'pvp'), true);
assert.equal(app.matchesMapDeepLink(link), true);

// Discord OAuth redirects and browser refreshes can remove URL query data.
app = openContext('');
link = app.getMapDeepLink();
assert.equal(link.server_key, 'nasdara-pvp', 'server key survives a reload');
assert.equal(link.poi, 'market');
assert.equal(link.x, null, 'missing coordinates stay absent on reload');
assert.equal(link.z, null);

app = openContext('?map=badlands&server=nasdara-pve&x=1024&z=2048');
link = app.getMapDeepLink();
assert.equal(link.x, 1024);
assert.equal(link.z, 2048);
app = openContext('');
assert.equal(app.getMapDeepLink().x, 1024);
assert.equal(app.getMapDeepLink().z, 2048);

app = openContext('?map=badlands&x=&z=&poi=only-poi');
assert.equal(app.getMapDeepLink().x, null);
assert.equal(app.getMapDeepLink().z, null);
app = openContext('?map=badlands&x=16385&z=1000');
assert.equal(app.getMapDeepLink(), null, 'out-of-bounds coordinates must be rejected');
app = openContext('?map=badlands&x=50&z=');
assert.equal(app.getMapDeepLink(), null, 'incomplete coordinates must not become (50, 0)');
assert.match(loader, /matchesMapDeepLink\?\.\(link\)/, 'map loader must check the selected server');
console.log('PASS: PvE/PvP map-link binding, refresh restoration, POI-only and boundary guards');
