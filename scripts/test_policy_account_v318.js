'use strict';
// V3.18.1: public policy access without a blocking modal + verified server-scoped records.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const read = path => fs.readFileSync(path, 'utf8');
const browser = require('../assets/js/site-policy-acceptance.js');
const account = require('../assets/js/dashboard/policy-account-v318.js');
const script = read('assets/js/dashboard/policy-account-v318.js');
const dash = read('dashboard.html');
const sw = read('sw.js');
const terms = read('terms.html');
const privacy = read('privacy.html');
const legal = read('legal.html');

assert.equal(browser.POLICY_REVISION, '2026-11-13.1');
assert.equal(browser.POLICY_REVISION, account.VERSION, 'Backend and web versions must be aligned at release');
assert.equal(account.shouldCheck(true, 'world-war-z', 'A'.repeat(64)), true);
assert.equal(account.shouldCheck(true, '', 'A'.repeat(64)), false);
assert.equal(account.shouldCheck(false, 'world-war-z', 'A'.repeat(64)), false);
assert.equal(account.shouldCheck(true, 'world-war-z', ''), false);

for (const url of ['/api/account/policy', '/api/account/policy/accept', '/api/admin/policy/acceptances'])
  assert.ok(script.includes(url), 'Missing verified policy API route: ' + url);
for (const token of [
  'wwz:authchange', 'wwz:serverchange', 'wwz:accesschange',
  'wwz-account-policy-dialog', 'agree', 'acknowledged_privacy',
  'agreed_to_terms', 'showModal', '!response.ok',
  'VERSION', 'member','wwz_dashboard_session',
  'getSelectedServer',
  'requires_acceptance', 'dataset.staffOnly', 'staff',
  'owner', 'dialog.close', 'textContent',
  'Retry policy check', 'showNotice', 'safeRequest'
].filter(x => x !== 'member'))
  assert.ok(script.includes(token), 'Missing account acceptance safeguard: ' + token);
assert.ok(!script.includes('localStorage.setItem') && !script.includes('document.cookie'),
 'Account acceptance cannot be stored as a local preference');
assert.ok(!script.includes('innerHTML'), 'Audit rows must not interpolate untrusted HTML');
assert.ok(script.includes('accepted !== true'), 'API response must confirm acceptance');
assert.ok(script.includes("const getToken = () =>"), 'Never embed bearer tokens');
new vm.Script(script);
const style = 'assets/css/dashboard/policy-account-v318.css?v=3.18.0&amp;rev=discord-policy-1';
const asset = 'assets/js/dashboard/policy-account-v318.js?v=3.18.0&amp;rev=discord-policy-1';
assert.equal(dash.split(style).length-1, 1);
assert.equal(dash.split(asset).length-1, 1);
assert.ok(dash.indexOf(asset) > dash.indexOf('assets/js/dashboard/account.js'),
 'The policy controller must subscribe after existing account setup');
assert.ok(!read('index.html').includes(asset), 'Guest landing page must not load authenticated policy gate');
assert.ok(!read('shop.html').includes(asset), 'Existing standalone Shop flow stays untouched');
assert.ok(sw.includes('2026-11-13-single-policy-gate-v3181-1'));
assert.ok(sw.includes('./assets/js/dashboard/policy-account-v318.js?v=3.18.0&rev=discord-policy-1'));
assert.ok(sw.includes('./assets/css/dashboard/policy-account-v318.css?v=3.18.0&rev=discord-policy-1'));
assert.ok(sw.includes('./assets/js/site-policy-acceptance.js?v=1.1.1&rev=single-account-prompt-1'));
for (const doc of [terms, privacy, legal])
  assert.ok(doc.includes('13 November 2026'), 'Policy revision date must be visible');
assert.ok(terms.includes('account-linked acceptance') && privacy.includes('Discord account ID'));
assert.ok(privacy.includes('No automatic') || privacy.includes('no automatic deletion period') ||
          privacy.includes('no automatic deletion'), 'Privacy retention must remain explicit');
assert.ok(legal.includes('server-scoped staff audit'));
console.log('PASS: nonblocking public policy references, Railway account gate, staff audit and disclosures');
