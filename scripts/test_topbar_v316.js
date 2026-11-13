'use strict';
// V3.16: the mobile topbar exposes search and selected server without rerouting.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=(path)=>fs.readFileSync(path,'utf8');
const html=read('dashboard.html');
const css=read('assets/css/dashboard/topbar-v316.css');
const server=read('assets/js/dashboard/server-context.js');
const shell=read('assets/js/dashboard/shell.js');
const sw=read('sw.js');

const style='assets/css/dashboard/topbar-v316.css?v=3.16.0&amp;rev=mobile-header-1';
assert.equal(html.split(style).length-1,1,'V3.16 stylesheet must load exactly once');
assert.ok(html.indexOf(style)>html.indexOf('assets/css/dashboard/mobile-v315.css'),
 'V3.16 must override the V3.15 mobile layout');
assert.ok(!read('index.html').includes(style)&&!read('shop.html').includes(style),
 'The header improvement is limited to the authenticated dashboard');
assert.ok(html.includes('aria-label="Search dashboard tools"'));
assert.ok(html.includes('class="wwz-topbar-search-icon"'));
assert.ok(html.includes('class="wwz-topbar-search-label">Search tools</span>'));
assert.ok(html.includes('data-open-command-search'),'The old search handler stays attached');
assert.ok(html.includes('data-change-server'),'The existing switch action stays attached');
assert.ok(html.includes('class="server-switcher wwz-topbar-server-chip"'));
assert.ok(html.includes('data-topbar-server-mode>Server</strong>'));
assert.ok(html.includes('aria-label="Change World War Z server"'));
assert.ok(html.includes('server-context.js?v=3.0.3&amp;rev=topbar-mode-1'));
assert.ok(html.includes('data-server-action="restart"'),'DayZ server actions are preserved');
assert.ok(html.includes('data-raid-damage-controls'),'Raid weekend controls remain intact');

for(const token of [
 'body.wwz-v3-dashboard','.wwz-topbar-server-chip[hidden]',
 '.wwz-topbar-server-copy','.wwz-topbar-search-label',
 '@media (max-width: 980px)','@media (max-width: 760px)',
 '@media (max-width: 440px)','@media (max-width: 380px)',
 'data-wwz-selected-server="pve"','data-wwz-selected-server="pvp"',
 'display: block !important','touch-action: manipulation',
 'prefers-reduced-motion','forced-colors'
])assert.ok(css.includes(token),'Missing V3.16 responsive constraint: '+token);
assert.ok(!/\.leaflet-|maplibregl|#wwz-detection-map/.test(css));
assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage/.test(css));
assert.ok(server.includes("topbarMode.textContent = server.selector_label"));
assert.ok(server.includes("Change server. Currently Nasdara ${server.selector_label}"));
assert.ok(server.includes("changeServerButton?.addEventListener('click', () => showServerSelection())"));
assert.ok(server.includes("changeServerButton?.removeAttribute('hidden')"));
assert.ok(server.includes('const STORAGE_KEY = \'wwz_dashboard_server\''));
assert.ok(shell.includes("commandPaletteOpeners.forEach((button) => button.addEventListener('click', openCommandPalette))"));
assert.ok(sw.includes('2026-11-14-player-language-v322-1'));
assert.ok(sw.includes('./assets/css/dashboard/topbar-v316.css?v=3.16.0&rev=mobile-header-1'));
assert.ok(sw.includes('./assets/js/dashboard/server-context.js?v=3.0.3&rev=topbar-mode-1'));
new vm.Script(server);
console.log('PASS: V3.16 search label, selected PvE/PvP chip, compact widths, original handlers and safe PWA cache');
