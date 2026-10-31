'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = (path) => fs.readFileSync(path, 'utf8');
const page = read('dashboard.html');
const account = read('assets/js/dashboard/account.js');
const home = read('assets/js/dashboard/my-wwz.js');
const homeCss = read('assets/css/dashboard/my-wwz.css');
const bootstrap = read('assets/js/dashboard/bootstrap.js');
const serviceWorker = read('sw.js');

for (const selector of [
  'data-profile-best-streak',
  'data-profile-favourite-opponent',
  'data-profile-nemesis',
  'data-profile-last-kill',
  'data-profile-distance-travelled',
  'data-profile-distance-tracked-since'
]) {
  assert.ok(page.includes(selector), 'Account Centre is missing ' + selector);
  assert.ok(account.includes(selector), 'Account renderer is missing ' + selector);
}

assert.ok(account.includes('profile.distance_travelled_metres'), 'Account Profile must render validated travel distance');
assert.ok(account.includes('profile.distance_tracked_since'), 'Account Profile must show the travel tracking baseline');
assert.ok(home.includes('profile.distance_travelled_metres'), 'Personal home must render validated travel distance');
assert.ok(home.includes('profile.distance_tracked_since'), 'Personal home must indicate when distance tracking began');

for (const field of [
  'best_streak',
  'favourite_opponent',
  'nemesis',
  'last_confirmed_kill'
]) {
  assert.ok(account.includes('pvp.' + field), 'Account renderer does not read ' + field);
  assert.ok(home.includes('pvp.' + field), 'Personal home does not read ' + field);
}

assert.ok(home.includes('data-my-wwz-survivor-stats'), 'Personal home Survivor Performance card is missing');
assert.ok(home.includes('renderSurvivorStats(snapshot)'), 'Survivor Performance card is not rendered with the member snapshot');
assert.ok(home.includes("scope + ' · This server only'"), 'Stats must be labelled as belonging to the selected server');
assert.ok(home.includes("nav('players', 'identity')"), 'The performance card must link to the full Survivor Profile');

for (const label of [
  "metric('Playtime'",
  "metric('Sessions'",
  "metric('Kills'",
  "metric('Deaths'",
  "metric('K/D ratio'",
  "metric('Best streak'",
  "metric('Longest kill'",
  "metric('Event wins'",
  "metric('Flags captured'",
  "metric('Reputation'"
]) assert.ok(home.includes(label), 'Missing personal stat tile: ' + label);

assert.ok(homeCss.includes('.my-wwz-stat-grid'), 'Survivor stat grid styling is missing');
assert.ok(homeCss.includes('@media (max-width: 720px)'), 'Tablet/mobile stat layout is missing');
assert.ok(homeCss.includes('@media (max-width: 520px)'), 'Small-screen stat layout is missing');
assert.ok(bootstrap.includes('my-wwz.js?v=1.41.1&rev=travel-distance-1'));
assert.ok(bootstrap.includes('my-wwz.css?v=1.41.1&rev=travel-distance-1'));
assert.ok(page.includes('account.js?v=1.59.1&amp;rev=travel-distance-1'));
assert.ok(serviceWorker.includes("const WWZ_PWA_UPDATE_REVISION = '2026-11-01-travel-distance-1';"));

console.log('PASS: Server-scoped survivor profile and performance statistics');
