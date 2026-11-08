/* World War Z V3.3 Admin and Owner navigation safety checks. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {Script}=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const page=read('dashboard.html'),sw=read('sw.js');
const js=read('assets/js/dashboard/workspace-v33-administration.js'),css=read('assets/css/dashboard/workspace-v33-administration.css');
assert.equal(page.split('assets/css/dashboard/workspace-v33-administration.css?v=3.3.0&amp;rev=v33-admin-owner-1').length-1,1);
assert.equal(page.split('assets/js/dashboard/workspace-v33-administration.js?v=3.3.0&amp;rev=v33-admin-owner-1').length-1,1);
assert.ok(page.indexOf('assets/css/dashboard/workspace-v33-administration.css?v=3.3.0&amp;rev=v33-admin-owner-1')>page.indexOf('workspace-v32-community.css'));
assert.ok(page.indexOf('assets/js/dashboard/workspace-v33-administration.js?v=3.3.0&amp;rev=v33-admin-owner-1')>page.indexOf('workspace-v32-community.js'));
assert.ok(sw.includes('./assets/css/dashboard/workspace-v33-administration.css?v=3.3.0&rev=v33-admin-owner-1'));
assert.ok(sw.includes('./assets/js/dashboard/workspace-v33-administration.js?v=3.3.0&rev=v33-admin-owner-1'));
assert.ok(sw.includes("const WWZ_PWA_UPDATE_REVISION = '2026-11-09-v3-3-administration-1';"));
for(const tok of [
 'data-view-panel="staff"','data-view-panel="serverconfig"',
 'data-view-panel="shopadmin"','data-view-panel="configuration"',
 'data-staff-only','data-owner-only','data-server-action="restart"',
 'data-config-studio-apply','data-apply-config-file','data-server-action-history-panel',
 'data-admin-player-search-panel','data-moderation-case-panel',
 'data-shop-discount','data-config-backup-reason','data-save-shop-settings',
 'data-raid-damage-controls','data-command-centre-jump-section="server-audit"'
])assert.ok(page.includes(tok),'Existing protected tool missing: '+tok);
for(const tok of [
 "['Operations','staff','command-centre'",
 "['Players','staff','players'",
 "['Mission files','serverconfig','files'",
 "['Backups','configuration','backups'",
 "'shopadmin','settings'",
 "'community','planner'",
 "link.closest('[hidden]')",
 'findRoute(view,section)?.click()',
 "window.addEventListener('wwz:authchange',sync)",
 "window.addEventListener('wwz:accesschange',sync)",
 "window.addEventListener('wwz:viewchange',sync)"
])assert.ok(js.includes(tok),'Permission-aware navigation missing: '+tok);
for(const tok of [
 '.wwz-v33-workspace-navigation','.wwz-v33-more-workspaces',
 '.wwz-v33-more-inner','.wwz-admin-hub-links',
 '.config-studio-tabs','.mission-file-editor',
 '[data-view-panel="shopadmin"]','.responsive-table',
 '@media(max-width:620px)','prefers-reduced-motion','forced-colors',
 '[hidden]'
])assert.ok(css.includes(tok),'Admin styling missing: '+tok);
assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|nitrado_action|restartServer|applyConfig/.test(js),
 'Visual navigator must never call API or server actions');
new Script(js,{filename:'workspace-v33-administration.js'});
console.log('PASS: V3.3 Admin and Owner navigation, permissions and protected controls');
