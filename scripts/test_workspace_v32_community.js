/* WWZ V3.2 Community / Factions / Quests / Progression UI safety contract. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');const {Script}=require('node:vm');
const read=x=>fs.readFileSync(x,'utf8');
const page=read('dashboard.html'),sw=read('sw.js');
const js=read('assets/js/dashboard/workspace-v32-community.js'),css=read('assets/css/dashboard/workspace-v32-community.css');
const sheet='assets/css/dashboard/workspace-v32-community.css?v=3.2.2&amp;rev=v3-2-community-1',script='assets/js/dashboard/workspace-v32-community.js?v=3.2.2&amp;rev=v3-2-community-1';
assert.equal(page.split(sheet).length-1,1,'Community stylesheet loaded once');
assert.equal(page.split(script).length-1,1,'Community navigation loaded once');
assert.ok(page.indexOf(sheet)>page.indexOf('workspace-v32-economy.css'),'Shared V3 theme must win cascade');
assert.ok(page.indexOf(script)>page.indexOf('workspace-v32-economy.js'),'Existing navigation must initialise first');
assert.ok(sw.includes('./assets/css/dashboard/workspace-v32-community.css?v=3.2.2&rev=v3-2-community-1'));
assert.ok(sw.includes('./assets/js/dashboard/workspace-v32-community.js?v=3.2.2&rev=v3-2-community-1'));
assert.ok(sw.includes("const WWZ_PWA_UPDATE_REVISION = '2026-11-09-v3-2-community-factions-1';"));
for(const token of [
  'data-view-panel="community"','data-view-panel="factions"',
  'data-view-panel="objectives"','data-view-panel="progression"',
  'data-community-calendar','data-community-events','data-community-my-signups',
  'data-community-chart','data-faction-content','data-my-faction-roster',
  'data-faction-registration-card','data-my-faction-invites',
  'data-objectives-content','data-objectives-daily-list','data-objectives-weekly-list',
  'data-objective-action="claim_all_quests"','data-objectives-my-contracts',
  'data-progression-content','data-progression-level','data-progression-leaderboard',
  'data-raid-damage-controls','data-server-action="restart"'
])assert.ok(page.includes(token),'Existing data/control missing: '+token);
for(const token of [
  "link.dataset.view === view",
  "link.dataset.section || ''",
  "link.closest('[hidden]')",
  'if (link) link.click()',
  "'factions'","'objectives'","'progression'","'community'",
  'window.addEventListener(\'wwz:viewchange\',sync)',
  'window.addEventListener(\'wwz:accesschange\',sync)',
  'window.addEventListener(\'wwz:authchange\',sync)',
  'scope.prepend(nav)',
  "insertHeading(factionContent.querySelector('.faction-summary-grid')",
  "insertHeading(objectiveContent.querySelector('.quest-career-panel')",
  "insertHeading(progressionContent.querySelector('.progression-hero')",
])assert.ok(js.includes(token),'Navigation/regrouping missing: '+token);
for(const token of [
 '.wwz-v32-community-switcher','.wwz-v32-community-localnav',
 '.wwz-v32-community-section-heading','[data-faction-content][hidden]',
 '[data-objectives-content][hidden]','[data-progression-content][hidden]',
 '.community-calendar-toolbar','.faction-summary-grid','.quest-career-stats',
 '.progression-leaderboard','@media(max-width:820px)',
 'prefers-reduced-motion','forced-colors'
])assert.ok(css.includes(token),'V3.2 style missing: '+token);
assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|requestJson|nitrado_action|restartServer/.test(js),
  'Presentation-only navigator must not make server calls');
new Script(js,{filename:'workspace-v32-community.js'});
console.log('PASS: Community, Factions, Objectives and XP V3.2 navigation and data safeguards');
