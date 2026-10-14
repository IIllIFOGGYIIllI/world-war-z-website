// Static regression test for admin Badlands launch-gate wiring.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const dash = read('dashboard.html');
const js = read('assets/js/dashboard/world-manager.js');
const lazy = read('assets/js/dashboard/lazy-assets.js');
const sw = read('sw.js');
for (const selector of ['data-world-launch-audit','data-world-launch-summary',
                        'data-world-launch-checks','data-world-launch-note']) {
  assert(dash.includes(selector), `Missing Admin-only launch gate selector: ${selector}`);
  assert(js.includes(selector), `Missing safe rendering: ${selector}`);
}
assert(js.includes('renderLaunchAudit(payload.launch_audit)'));
assert(js.includes('items.replaceChildren()'));
assert(!dash.includes('data-world-activate-button'));
assert(sw.includes("WWZ_PWA_VERSION = '2.18.0'"));
assert(lazy.includes('world-manager.js?v=2.18.0'));
assert(dash.includes('Read-only: this section never updates Nitrado'));
console.log('Badlands launch gate UI regression passed');
