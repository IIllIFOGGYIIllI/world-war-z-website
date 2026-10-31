'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const text = fs.readFileSync('assets/js/dashboard/account.js','utf8');
const html = fs.readFileSync('dashboard.html','utf8');
const scoped = text.split('// Admin identity-sync controls. Settings are always scoped by the selected WWZ server.')[1];
assert.ok(scoped);
assert.ok(html.includes('assets/js/dashboard/account.js?v='), 'Account script must remain loaded by the dashboard');
for (const part of [
  'requestEpoch += 1',
  'selectedServerKey() === key && authorized()',
  'if (!current(epoch, serverKey)) return',
  "payload?.server?.key || ''",
  "window.addEventListener('wwz:serverchange'",
  "window.addEventListener('wwz:authchange'",
  "window.addEventListener('wwz:accesschange'",
  'if (!loaded || busy || !authorized()) return',
  'if (resultBody) resultBody.replaceChildren()',
  'const needsAttention = Boolean(payload.needs_attention',
  "needsAttention ? 'error' : 'success'",
  "result.guild_available === false ? 'Not run'"
]) assert.ok(scoped.includes(part), 'Missing Identity Sync scope guard: '+part);
const match = scoped.match(/const current = \(epoch, key\) => ([^\n]+);/);
assert.ok(match);
const cases = [
 [5,5,'nasdara-pve','nasdara-pve',true,true],
 [5,6,'nasdara-pve','nasdara-pve',true,false],
 [5,5,'nasdara-pve','nasdara-pvp',true,false],
 [5,5,'nasdara-pve','nasdara-pve',false,false]
];
for (const [oldEpoch,liveEpoch,oldKey,newKey,staff,expected] of cases) {
 const sandbox = {requestEpoch:liveEpoch,selectedServerKey:()=>newKey,authorized:()=>staff};
 const expr = 'const current = (epoch,key) => ' + match[1] + '; current(' + oldEpoch + ',' + JSON.stringify(oldKey) + ')';
 assert.equal(vm.runInNewContext(expr,sandbox),expected);
}
console.log('PASS: Identity Sync per-guild access and stale response guards');
