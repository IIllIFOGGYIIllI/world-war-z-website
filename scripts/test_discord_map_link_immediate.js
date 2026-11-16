'use strict';

// Exercise the public Discord map viewer with both optional API requests
// unresolved: a deep-linked X/Z marker must still be visible immediately.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/js/pages/map-link.js', 'utf8');

function launch(search) {
  const markers = [], focused = [];
  const fields = new Map();
  const field = (key) => {
    if (!fields.has(key)) {
      fields.set(key, {
        textContent: '', disabled: true, href: '',
        addEventListener() {}, classList: { add() {}, remove() {} },
      });
    }
    return fields.get(key);
  };
  const container = { querySelector() { return null; } };
  const map = {
    getZoom: () => 4,
    on() {},
    getBounds: () => ({contains: () => true}),
    invalidateSize() {},
  };
  const wwz = {
    getConfig: () => ({name:'Nasdara', mapMetres:16384, mapUnits:16384, labelUrl:null}),
    create: () => ({
      map,
      addPoi(poi) { markers.push(poi); return {}; },
      focus(x,z,zoom) { focused.push({x,z,zoom}); },
    }),
    normaliseMarkerIcon: x => x,
  };
  const leaf = {
    layerGroup: () => ({
      addTo() { return this; }, remove() {}, clearLayers() {}, addLayer() {},
    }),
    DomEvent: { disableClickPropagation() {}, disableScrollPropagation() {} },
  };
  const win = {
    location: { search, origin:'https://example.org' },
    L: leaf,
    WWZMap: wwz,
    setTimeout() {},
  };
  const loading = field('[data-marker-loading]');
  loading.querySelector = () => field('loading-text');
  loading.hidden = true;
  const document = {
    title: '',
    body: {classList: {add() {}}},
    getElementById: key => key === 'wwz-detection-map' ? container : null,
    querySelector: selector =>
      ['[data-marker-loading]','[data-marker-title]','[data-marker-map]',
       '[data-marker-name]','[data-marker-coordinates]','[data-copy-coordinates]',
       '[data-dashboard-map-link]'].includes(selector) ? field(selector) : null,
    querySelectorAll: () => [],
  };
  // No live API response: Promise.allSettled() will never finish.
  const never = new Promise(() => {});
  vm.runInNewContext(source, {
    window: win, document, URLSearchParams, fetch: () => never,
    console, navigator:{},
  }, {timeout: 1000});
  return {markers, focused, fields, loading};
}

const direct = launch(
  '?map=badlands&server=nasdara-pvp&x=10766.7&z=14359.3'
  + '&marker=Rental%20Order%20376&source=rental-delivery',
);
assert.equal(direct.markers.length, 1, 'a deep-link marker must render before optional API responses');
assert.equal(direct.markers[0].name, 'Rental Order 376');
assert.deepEqual([direct.markers[0].x, direct.markers[0].z], [10766.7, 14359.3]);
assert.deepEqual([direct.focused[0].x, direct.focused[0].z], [10766.7, 14359.3]);
assert.match(direct.fields.get('[data-dashboard-map-link]').href, /server=nasdara-pvp/);
assert.match(direct.fields.get('[data-dashboard-map-link]').href, /x=10766\.7/);
assert.match(direct.fields.get('[data-dashboard-map-link]').href, /z=14359\.3/);

const incomplete = launch('?map=badlands&server=world-war-z&x=400&z=');
assert.equal(incomplete.markers.length, 0, 'incomplete vectors must not resolve to zero');
assert.equal(incomplete.focused.length, 0);

const beyondMap = launch('?map=badlands&server=world-war-z&x=16385&z=1000');
assert.equal(beyondMap.markers.length, 0, 'out-of-bounds vectors must not be plotted');
assert.equal(beyondMap.loading.hidden, false, 'invalid marker must show an error');

console.log('PASS: Discord map X/Z marker, independent PvP routing and API-free initial focus');
