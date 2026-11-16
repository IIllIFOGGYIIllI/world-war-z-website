'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const js = fs.readFileSync('assets/js/dashboard/community.js', 'utf8');
const html = fs.readFileSync('dashboard.html', 'utf8');
const css = fs.readFileSync('assets/css/dashboard/community.css', 'utf8');
const lazy = fs.readFileSync('assets/js/dashboard/lazy-assets.js', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');

const start = js.indexOf('  const renderRaidPreflightReport = (report) => {');
const end = js.indexOf("  qs('[data-raid-preflight]')?.addEventListener", start);
assert.ok(start >= 0 && end > start, 'Raid report renderer must exist');
const escape = value => String(value ?? '').replace(/[&<>"']/g, c =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const context = {esc:escape,fmtSydney:()=> '16 Nov 2026, 9:38 am'};
vm.runInNewContext(js.slice(start, end) + '\nthis.format = renderRaidPreflightReport;', context);
const base = {
  ready:true, mission_file_verified:true, base_damage_enabled:false,
  container_damage_enabled:false, messages_file_verified:true,
  player_kill_ban_verified:true, checked_at:'2026-11-15T22:38:00Z',
  manual_checks:['Confirm enableCfgGameplayFile is enabled in the active mission configuration.',
    'Confirm full-map PvP and PvE enforcement changes are handled separately in DayZ++.'],
  blockers:[],
};
const good = context.format(base);
assert.ok(good.includes('RAID READINESS PASSED'));
assert.equal((good.match(/data-check="passed"/g)||[]).length,5);
for (const label of ['Nasdara Mission File','Base Damage','Container Damage',
    'In-Game Raid Notices','WWZ Full Map PvE Zone',
    'Owner Review — Not Yet Confirmed','No Server Restarts Were Requested']) {
  assert.ok(good.includes(label), 'Missing structured item: '+label);
}
assert.ok(good.includes('enableCfgGameplayFile'));
assert.ok(!good.includes('DayZ++'), 'Retired external-zone manual check hidden');
assert.ok(!good.includes('Items Requiring Attention'), 'No false issues');
const bad = context.format({...base,ready:false,base_damage_enabled:true,
  blockers:['Unsafe <script>alert(1)</script>']});
assert.ok(bad.includes('Raid Readiness Needs Attention'));
assert.ok(bad.includes('data-check="blocked"'));
assert.ok(bad.includes('Items Requiring Attention'));
assert.ok(bad.includes('&lt;script&gt;') && !bad.includes('<script>'));
assert.ok(html.includes('class="raid-preflight-result wwz-raid-inspection"'), 'Div container supports structured child elements');
assert.ok(js.includes('output.innerHTML = renderRaidPreflightReport(report)'));
assert.ok(js.includes('if (scope !== selectedScope()) return;'), 'Reject server-switch races');
assert.ok(css.includes('wwz-raid-report .wwz-maintenance-check strong'));
assert.ok(lazy.includes('raidlayout=1'));
assert.ok(sw.includes("url.pathname.endsWith('/assets/js/dashboard/zones.js')"), 'Fetch latest Zone Management controllers');
assert.ok(sw.includes("url.pathname.endsWith('/assets/js/dashboard/community.js')"), 'Fetch latest raid controller');
assert.ok(sw.includes('2026-11-16-78-independent-workspace-pages-1'));
console.log('PASS: structured safe raid readiness cards, mobile styles, server scope, cache refresh');
