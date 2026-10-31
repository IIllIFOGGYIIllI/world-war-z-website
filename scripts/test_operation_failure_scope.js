'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const admin = fs.readFileSync('assets/js/dashboard/administration.js','utf8');
const lazy = fs.readFileSync('assets/js/dashboard/lazy-assets.js','utf8');
for (const guard of [
  'const operationFailureServerKey = () =>',
  'renderOperationFailures = (payload, serverKey) =>',
  'operationFailureServerKey() !== serverKey',
  'if (!requestedServerKey) return;',
  'if (operationFailureServerKey() !== requestedServerKey) return;',
  "window.addEventListener('wwz:serverchange'",
  'Boolean(failure?.retry_pending)',
  'Manual retry queued',
  'server_key: serverKey'
]) assert.ok(admin.includes(guard), 'Missing retry scope safeguard: ' + guard);
assert.ok(lazy.includes('administration.js?v=1.54.0&rev=player-leaderboard-1'));
console.log('PASS: Server-isolated operation failures and retries');
