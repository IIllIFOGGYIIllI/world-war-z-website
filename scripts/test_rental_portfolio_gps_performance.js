// Regression checks for rental portfolios, survivor stats, GPS and lazy-load safety.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const read = (path) => fs.readFileSync(path, 'utf8');

const dashboard = read('assets/js/dashboard/shop.js');
const storefront = read('assets/js/pages/shop.js');
const html = read('dashboard.html');
const shopHtml = read('shop.html');
const account = read('assets/js/dashboard/account.js');
const home = read('assets/js/dashboard/my-wwz.js');
const loader = read('assets/js/dashboard/lazy-assets.js');

for (const source of [dashboard, storefront]) {
  assert.match(source, /rental_portfolio/, 'Both shop views need the persistent rental API');
  assert.match(source, /portfolio\.rentals/, 'Active rentals must merge with recent orders');
  assert.match(source, /new Map\(\)/, 'Duplicate historical orders must be deduplicated');
}
assert.match(html, /data-rental-portfolio-notice/, 'Dashboard must surface truncated rental state');
assert.match(html, /shop\.html\?section=rentals/, 'Multi-vehicle purchase stays discoverable');
assert.match(storefront, /rentalCart\.lines\(\)/, 'Do not regress the working multi-vehicle cart');
assert.match(shopHtml, /pages\/shop\.js\?v=.*portfolio=1/, 'Storefront asset cache must update');

for (const field of [
  'data-profile-travel-24h',
  'data-profile-travel-7d',
  'data-profile-best-session-7d',
  'data-profile-travel-legs',
  'data-profile-travel-interruptions',
]) {
  assert.ok(html.includes(field), 'Missing profile field: ' + field);
  assert.ok(account.includes(field), 'Profile controller does not populate ' + field);
}
assert.match(home, /travel_summary/, 'Member-home stats must use server-scoped travel');
assert.match(home, /active_rentals/, 'Member home must show active rentals');
assert.match(home, /data-my-gps-interruptions/, 'GPS data quality must be visible');

// Pointer hovering the shop should no longer load Leaflet. Actual map views
// still load it from activateCommerceView when the user navigates there.
for (const view of ['shop', 'shopadmin', 'locations', 'delivery']) {
  assert.ok(loader.includes("['" + view + "', ensureCommerceRuntime]"),
    'Hover preload must avoid loading the entire map runtime for ' + view);
}
assert.match(loader, /mapDependentCommerceView\(detail\) \? ensureMapRuntime\(\)/);

const progressFrames = [];
let projectedCount = 0;
let polylineCount = 0;
let mapDestroyCount = 0;
const layer = () => ({
  addTo() { return this; },
  clearLayers() { return this; },
});
const fakeWindow = {
  WWZMap: {
    create() {
      return { map: { fitBounds() {}, setView() {} }, destroy() { mapDestroyCount++; } };
    },
    worldToLeaflet(coords) {
      projectedCount++;
      return [coords[0], coords[1]];
    },
  },
  L: {
    map: () => ({}),
    layerGroup: layer,
    polyline(points) {
      assert.ok(points.length >= 2, 'Do not invent route points');
      polylineCount++;
      return layer();
    },
    circleMarker() { return { bindTooltip() { return layer(); }, addTo() { return this; } }; },
    latLngBounds(points) { return points; },
  },
  requestAnimationFrame(callback) {
    progressFrames.push(callback);
    return progressFrames.length;
  },
  cancelAnimationFrame() {},
};
const fakeDocument = {
  createElement() {
    return { textContent: '', remove() {} };
  },
};
const context = { window: fakeWindow, document: fakeDocument };
vm.runInNewContext(read('assets/js/dashboard/gps-tracker.js'), context);
const container = { replaceChildren() {}, append() {} };
const timeline = { disabled: true };
const status = { textContent: '' };
const data = {
  samples: [
    { x: 1, z: 1, observed_at: '2026-11-07T00:00:00+00:00', session_key: 'a', rejection_reason: 'chain_start' },
    { x: 2, z: 2, observed_at: '2026-11-07T00:01:00+00:00', session_key: 'a', rejection_reason: null },
    { x: 10, z: 10, observed_at: '2026-11-07T00:02:00+00:00', session_key: 'a', rejection_reason: 'impossible_speed' },
    { x: 11, z: 11, observed_at: '2026-11-07T00:03:00+00:00', session_key: 'a', rejection_reason: null },
  ],
  interrupted_leg_count: 1,
  truncated: false,
};
(async () => {
  const map = await fakeWindow.WWZGpsTracker.mount({
    container, payload: data, mapKey: 'badlands', timeline, status,
  });
  assert.ok(map, 'GPS should render');
  assert.ok(status.textContent.includes('1 interrupted legs'), 'Gaps should be visible');
  const projections = projectedCount;
  for (const sliderValue of ['1', '2', '3']) {
    timeline.value = sliderValue;
    timeline.oninput();
    progressFrames.pop()?.();
    assert.equal(projectedCount, projections, 'Scrubbing must reuse projected route');
  }
  assert.ok(polylineCount >= 4, 'The cyan and magenta routes remain visible');
  map.destroy();
  assert.equal(mapDestroyCount, 1);
  console.log('PASS: rental portfolio, travel stats, cached GPS replay and lazy loading');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
