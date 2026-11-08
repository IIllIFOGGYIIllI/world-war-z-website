/* WWZ V3.1 navigation regression and accessibility contract. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {Script}=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const dashboard=read('dashboard.html');
const shop=read('shop.html');
const map=read('map-link.html');
const sw=read('sw.js');
const js=read('assets/js/dashboard/navigation-v31.js');
const css=read('assets/css/dashboard/navigation-v31.css');
const script='assets/js/dashboard/navigation-v31.js?v=3.1.0&amp;rev=nav-overhaul-1';
const sheet='assets/css/dashboard/navigation-v31.css?v=3.1.0&amp;rev=nav-overhaul-1';

assert.equal(dashboard.split(script).length-1,1,'V3.1 script loads exactly once');
assert.equal(dashboard.split(sheet).length-1,1,'V3.1 stylesheet loads exactly once');
assert.ok(dashboard.indexOf(script)>dashboard.indexOf('workspace-phase2.js'),'Phase 2 navigation must initialise first');
assert.ok(dashboard.indexOf(script)>dashboard.indexOf('command-centre-v3.js'),'V3 presentation must initialise first');
assert.ok(dashboard.indexOf(sheet)>dashboard.indexOf('command-centre-v3-layout-recovery.css'),'V3.1 styles must win the cascade');
assert.ok(!shop.includes('navigation-v31.js')&&!map.includes('navigation-v31.js'),'Dashboard-only navigation must not run on other pages');
assert.ok(sw.includes('./assets/css/dashboard/navigation-v31.css?v=3.1.0&rev=nav-overhaul-1')&&sw.includes('./assets/js/dashboard/navigation-v31.js?v=3.1.0&rev=nav-overhaul-1'),'PWA must cache both new assets');
assert.ok(sw.includes("const WWZ_PWA_UPDATE_REVISION = '2026-11-09-v3-2-community-factions-2';"));

for(const token of [
  "document.querySelector('body.wwz-v3-dashboard .dashboard-sidebar')",
  "primary.append(item)",
  "primary.after(discovery)",
  "quick.replaceWith(more)",
  "more.append(quick)",
  "savedPanels.forEach((panel) => saved.append(panel))",
  "new MutationObserver(syncSaved)",
  "marker.setAttribute('aria-hidden', 'true')",
  "'Server & World'",
  "'Administration'",
  "'Owner Configuration'",
  "link.closest('[hidden]')",
  "window.addEventListener('wwz:accesschange', syncRoutes)",
  "window.addEventListener('wwz:authchange', syncRoutes)",
  "window.addEventListener('wwz:viewchange', syncRoutes)",
]) assert.ok(js.includes(token),'Missing safe V3.1 navigation behaviour: '+token);

for(const token of [
  '.wwz-v31-primary',
  '.wwz-v31-saved[hidden]',
  '.wwz-v31-more',
  '.wwz-v31-section-label',
  'wwz-sidebar-searching',
  '.nav-group-links',
  '.side-link.active',
  '@media(max-width:980px)',
  'prefers-reduced-motion',
  'forced-colors',
]) assert.ok(css.includes(token),'Missing V3.1 presentation rule: '+token);
assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|nitrado_action|restartServer/.test(js),'Navigation must not make server calls');
assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket/.test(css),'CSS is presentation only');
assert.ok(dashboard.includes('data-server-action="restart"'),'Existing protected server actions must remain');
assert.ok(dashboard.includes('data-raid-damage-controls'),'Existing Raid Weekend controls must remain');
assert.ok(dashboard.includes('data-profile-playtime'),'Survivor stats remain');
assert.ok(dashboard.includes('data-view-panel="map"'),'Map remains');
assert.ok(dashboard.includes('data-open-command-search'),'Existing command search remains');
assert.ok(js.includes("a[href=\"shop.html\"]"),'Shop shortcut keeps its original destination');
new Script(js,{filename:'navigation-v31.js'});
console.log('PASS: V3.1 compact navigation, original routes, permissions, mobile & PWA contracts');
