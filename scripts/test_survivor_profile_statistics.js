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
  'data-profile-last-kill'
]) {
  assert.ok(page.includes(selector), 'Account Centre is missing ' + selector);
  assert.ok(account.includes(selector), 'Account renderer is missing ' + selector);
}

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
assert.ok(bootstrap.includes('my-wwz.js?v=1.41.0&rev=survivor-statistics-1'));
assert.ok(bootstrap.includes('my-wwz.css?v=1.41.0&rev=survivor-statistics-1'));
assert.ok(page.includes('account.js?v=1.59.0&amp;rev=survivor-profile-1'));
assert.ok(serviceWorker.includes("const WWZ_PWA_UPDATE_REVISION = '2026-11-01-survivor-statistics-1';"));

console.log('PASS: Server-scoped survivor profile and performance statistics');
