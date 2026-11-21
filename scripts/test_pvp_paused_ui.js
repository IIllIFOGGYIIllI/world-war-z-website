/* Live PvE/PvP service availability, without removing the secure selector gate. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const read = path => fs.readFileSync(path, 'utf8');

const index = read('index.html');
const dashboard = read('dashboard.html');
const selector = read('assets/js/dashboard/server-context.js');
const branding = read('assets/js/world-branding.js');
const sw = read('sw.js');

assert.match(index, /data-wwz-availability-banner/);
assert.match(index, /data-wwz-service-notice/);
assert.match(index, /data-wwz-pvp-service-status/);
assert.match(index, /data-wwz-pvp-description/);
assert.match(index, /data-wwz-pvp-operations/);
assert.match(index, /data-wwz-network-state/);
assert.doesNotMatch(index, /Nasdara Full PvP is temporarily unavailable/);
assert.doesNotMatch(index, /PvP paused/);
assert.doesNotMatch(index, /available when PvP resumes/);
assert.ok(index.includes('assets/css/pages/home.css?v=1.22.95&amp;rev=live-availability-1'));
assert.ok(index.includes('assets/js/world-branding.js?v=3.0.1&rev=live-availability-1'));
assert.ok(sw.includes('./assets/css/pages/home.css?v=1.22.95&rev=live-availability-1'));
assert.ok(sw.includes('./assets/js/world-branding.js?v=3.0.1&rev=live-availability-1'));
assert.match(sw, /const WWZ_PWA_UPDATE_REVISION = '[^']+';/);

// Prevent an unauthenticated selector from accepting a paused / ineligible world.
assert.ok(dashboard.includes('assets/js/dashboard/server-context.js?v=3.0.3&amp;rev=topbar-mode-1'));
for (const required of [
  'paused: value.paused === true',
  'available: value.available !== false && value.paused !== true',
  "state.textContent = server.paused ? 'Temporarily unavailable'",
  'card.disabled = !server.available',
  'if (requested?.available)',
  'if (eventTarget?.available)',
  'if (restored?.available)',
  'if (!normalized || !normalized.available) return false'
]) assert.ok(selector.includes(required), 'Missing selector safeguard: ' + required);

new vm.Script(selector, { filename: 'server-context.js' });
new vm.Script(branding, { filename: 'world-branding.js' });

const mockBranding = (initialState = 'active', responseError = false) => {
  const fields = new Map();
  for (const name of [
    'data-wwz-service-notice', 'data-wwz-network-state',
    'data-wwz-pvp-service-status', 'data-wwz-pvp-description',
    'data-wwz-pvp-operations', 'data-wwz-availability-banner'
  ]) fields.set('[' + name + ']', [{ textContent: 'Checking availability', dataset: {} }]);
  let state = initialState;
  const ctx = {
    document: {
      readyState: 'loading', addEventListener() {},
      querySelectorAll: selector => fields.get(selector) || [],
      dispatchEvent() {}
    },
    window: {},
    CustomEvent: class { constructor(type, values) { this.type = type; this.detail = values?.detail; } },
    fetch: async () => {
      if (responseError) throw new Error('Temporary unavailable network');
      return {
        ok: true,
        json: async () => ({
          primary: { server_key: 'world-war-z', map_key: 'badlands', world_name: 'Nasdara', primary: true, status: 'active' },
          servers: [
            { server_key: 'world-war-z', map_key: 'badlands', world_name: 'Nasdara', primary: true, status: 'active' },
            { server_key: 'world-war-z-livonia', map_key: 'badlands', world_name: 'Nasdara', primary: false, status: state }
          ]
        })
      };
    }
  };
  vm.runInNewContext(branding, ctx);
  const get = key => fields.get('[' + key + ']')[0];
  return { refresh: ctx.window.WWZWorldBranding.refresh, get, setState: next => { state = next; } };
};

(async () => {
  const page = mockBranding();
  assert.equal(await page.refresh(), true);
  assert.match(page.get('data-wwz-service-notice').textContent, /Nasdara Full PvP services are available/);
  assert.equal(page.get('data-wwz-availability-banner').dataset.availabilityState, 'active');
  assert.match(page.get('data-wwz-pvp-service-status').textContent, /Service available/);
  assert.match(page.get('data-wwz-pvp-operations').textContent, /active bot monitoring/);

  page.setState('quarantined');
  assert.equal(await page.refresh(), true);
  assert.match(page.get('data-wwz-service-notice').textContent, /temporarily unavailable/);
  assert.equal(page.get('data-wwz-availability-banner').dataset.availabilityState, 'paused');
  assert.match(page.get('data-wwz-pvp-service-status').textContent, /Temporarily unavailable/);

  const offline = mockBranding('active', true);
  assert.equal(await offline.refresh(), false);
  assert.equal(offline.get('data-wwz-service-notice').textContent, 'Checking availability');
  console.log('PASS: homepage follows WWZ live service registry, safe offline fallback, authenticated PvP selector protected');
})().catch(error => { console.error(error); process.exitCode = 1; });
