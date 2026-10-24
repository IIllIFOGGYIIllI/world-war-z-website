'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/js/dashboard/command-centre.js', 'utf8');
const html = fs.readFileSync('assets/js/dashboard/lazy-assets.js', 'utf8');
const expected = 'assets/js/dashboard/command-centre.js?v=1.46.1&rev=stage6-world-scope-1';
assert.ok(html.includes(expected), 'Stage 6 Command Centre bundle must be loaded.');
for (const phrase of [
  'const serverKey = commandCentreSelectedKey();',
  'const epoch = ++commandCentreRequestEpoch;',
  'if (!commandCentreRequestCurrent(epoch, serverKey, sessionToken)) return false;',
  "payload?.scope?.server_key || ''",
  "Command Centre snapshot does not match the selected server.",
  'if (epoch === commandCentreRequestEpoch)',
  "window.addEventListener('wwz:serverchange'",
  'commandCentreRequestEpoch += 1;',
  'commandCentreLastPayload = null;',
  'commandCentreRequestInProgress = false;',
  'commandCentreMonitorArmed || commandCentreViewActive'
]) assert.ok(source.includes(phrase), 'Missing Command Centre scope guard: '+phrase);
const declaration = source.match(/const commandCentreRequestCurrent = \(epoch, key, token\) =>\n([\s\S]*?);/);
assert.ok(declaration, 'The epoch and selected-world request guard must be pure.');
for (const [epoch, currentEpoch, selectedKey, original, token, session, expected] of [
  [5, 5, 'pve', 'pve', 'session', 'session', true],
  [5, 6, 'pve', 'pve', 'session', 'session', false],
  [5, 5, 'pvp', 'pve', 'session', 'session', false],
  [5, 5, 'pve', 'pve', 'old', 'new', false],
]) {
  const sandbox = {
    commandCentreRequestEpoch: currentEpoch,
    commandCentreSelectedKey: () => selectedKey,
    storageGet: () => session,
    AUTH_SESSION_KEY: 'test'
  };
  const expr = 'const commandCentreRequestCurrent = (epoch, key, token) => ' +
    declaration[1].trim() + '; commandCentreRequestCurrent(' +
    JSON.stringify(epoch) + ',' + JSON.stringify(original) + ',' + JSON.stringify(token) + ')';
  assert.equal(vm.runInNewContext(expr, sandbox), expected);
}
console.log('PASS: Command Centre excludes stale PvE/PvP snapshots and sessions.');
