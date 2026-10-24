/* Server-scoped Command Centre access regression contracts.
 * All cases run in GitHub Pages CI without accessing player/production data.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const faction = fs.readFileSync('assets/js/dashboard/factions.js', 'utf8');
const progression = fs.readFileSync('assets/js/dashboard/progression.js', 'utf8');
const lazy = fs.readFileSync('assets/js/dashboard/lazy-assets.js', 'utf8');
const source = faction.split('const loadAll = async', 2)[1].split("treasuryDepositButton?.addEventListener", 1)[0];
assert.ok(source.indexOf('renderMyFaction(); renderFactionRegistration()') < source.indexOf('await apiJson(ADMIN_URL)'),
  'Member faction panel must render before an independent Admin read');
assert.match(source, /if \(isStaff\(\)\) \{\s*try \{/,
  'Do not request an Admin endpoint for an ordinary member');
assert.match(source, /catch \(adminError\)[\s\S]*?adminPayload = null/,
  'Admin denial must discard privileged data');
assert.match(source, /renderAdmin\(\);/,
  'The protected panel must rerender after a scoped denial');
assert.ok(!source.includes('(isStaff() || forceAdmin) ? await apiJson(ADMIN_URL)'),
  'Section routing must never elevate a member into Admin fetches');
const admin = progression.split('const loadAdmin = async', 2)[1].split('const selectedValues', 1)[0];
assert.match(admin, /catch \(error\) \{[\s\S]*?adminData = null;[\s\S]*?adminPanel\?\.setAttribute\('hidden', ''\)/,
  'A rejected config must hide the previous privileged role mappings');
const events = progression.split("window.addEventListener('wwz:authchange'", 2)[1];
assert.match(events, /adminData = null;[\s\S]*?adminPanel\?\.setAttribute\('hidden', ''\)/,
  'Auth refresh must clear previous server Admin data');
assert.match(events, /wwz:serverchange[\s\S]*?adminData = null/,
  'Server switch must clear previous server Admin data');
assert.match(lazy, /faction-scoped-access-1/);
assert.match(lazy, /progression-scoped-access-1/);
console.log('PASS: member factions survive Admin denial; progression Admin data is server scoped');
