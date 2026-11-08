/* WWZ V3.2 - profile and GPS visual integration contract. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {Script}=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const html=read('dashboard.html');
const sw=read('sw.js');
const member=read('assets/js/dashboard/my-wwz.js');
const account=read('assets/js/dashboard/account.js');
const gps=read('assets/js/dashboard/gps-tracker.js');
const css=read('assets/css/dashboard/workspace-v32-profile-gps.css');
const js=read('assets/js/dashboard/workspace-v32-profile-gps.js');
const script='assets/js/dashboard/workspace-v32-profile-gps.js?v=3.2.0&amp;rev=profile-gps-v32-1';
const sheet='assets/css/dashboard/workspace-v32-profile-gps.css?v=3.2.0&amp;rev=profile-gps-v32-1';

assert.equal(html.split(script).length-1,1,'V3.2 enhancement loaded exactly once');
assert.equal(html.split(sheet).length-1,1,'V3.2 stylesheet loaded exactly once');
assert.ok(html.indexOf(sheet)>html.indexOf('navigation-v31.css'),'V3.2 styles follow V3.1');
assert.ok(html.indexOf(script)>html.indexOf('navigation-v31.js'),'V3.2 script follows V3.1');
assert.ok(sw.includes('./assets/css/dashboard/workspace-v32-profile-gps.css?v=3.2.0&rev=profile-gps-v32-1')&&sw.includes('./assets/js/dashboard/workspace-v32-profile-gps.js?v=3.2.0&rev=profile-gps-v32-1'),'V3.2 assets included in PWA shell');
assert.ok(sw.includes("const WWZ_PWA_UPDATE_REVISION = '2026-11-08-v3-2-survivor-profile-gps-1';"));
for(const token of [
  'class="wwz-v32-profile-navigation"',
  'data-v32-profile-tab="identity"',
  'data-v32-profile-tab="activity"',
  'data-v32-profile-tab="records"',
  'data-v32-journey-open',
  'id="dashboard-profile-career"',
  'data-profile-content=""',
  'data-profile-discord-name',
  'data-profile-psn',
  'data-profile-travel-7d',
  'data-profile-career-achievements',
  'data-admin-gps-audit',
])assert.ok(html.includes(token),'Profile/administrator markup changed unexpectedly: '+token);
for(const token of [
  'wwz-v32-route-legend',
  'Recorded route',
  'Timeline replay',
  'First position',
  'Latest position',
  'data-my-gps-map',
  'data-my-gps-timeline',
  'data-my-gps-range',
  'data-v32-profile-return',
  'Historical ADM snapshots only',
])assert.ok(member.includes(token),'Member GPS functionality or legend missing: '+token);
for(const token of [
  '[data-profile-content]:not([hidden])',
  '.wwz-v32-profile-navigation',
  '.account-data-grid',
  '[data-my-wwz-gps]',
  '[data-admin-player-gps]',
  '.wwz-v32-route-legend',
  '.wwz-gps-timeline',
  '@media(max-width:700px)',
  'prefers-reduced-motion',
  'forced-colors',
])assert.ok(css.includes(token),'Missing responsive V3.2 CSS: '+token);
for(const token of [
  "link.click()",
  "link?.click()",
  "findExistingRoute('overview', 'summary')",
  "findExistingRoute('players', 'identity')",
  "journeyObserver.observe(overview",
  "window.addEventListener('wwz:viewchange'",
])assert.ok(js.includes(token),'Missing route-safe V3.2 interaction: '+token);
assert.ok(!/\bfetch\s*\(|\bXMLHttpRequest\b|WebSocket|nitrado_action|restartServer/.test(js),
  'V3.2 enhancement must not call external services or game servers');
assert.ok(account.includes("document.querySelector('[data-profile-content]')?.removeAttribute('hidden')"),
  'Profile auth gating remains with the original controller');
assert.ok(gps.includes('splitSamples(samples)'),'GPS gap preservation remains unchanged');
assert.ok(gps.includes('scheduleProgress'),'GPS replay remains unchanged');
assert.ok(html.includes('data-raid-damage-controls'),'Raid controls preserved');
assert.ok(html.includes('data-server-action="restart"'),'Server restart control preserved');
new Script(js,{filename:'workspace-v32-profile-gps.js'});
console.log('PASS: V3.2 profile and GPS redesign with auth, map, and replay safeguards');
