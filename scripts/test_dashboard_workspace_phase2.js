/* Phase 2 browser-safe UX contract. No backend or DayZ changes. */
'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const dash=read('dashboard.html');
const shop=read('shop.html');
const js=read('assets/js/dashboard/workspace-phase2.js');
const css=read('assets/css/workspace-phase2.css');
const acc=read('assets/js/dashboard/modern-navigation.js');
const sw=read('sw.js');
const script='assets/js/dashboard/workspace-phase2.js?v=2.2.0&amp;rev=dashboard-phase2-1';
const sheet='assets/css/workspace-phase2.css?v=2.2.0&amp;rev=dashboard-phase2-1';

assert.equal(dash.split(script).length-1,1,'Load route-safe UX once, on dashboard only');
assert.equal(dash.split(sheet).length-1,1,'Load shared view CSS once on dashboard');
assert.equal(shop.split(sheet).length-1,1,'Load shared view CSS once on shop');
assert.ok(!shop.includes(script),'Do not execute dashboard routing in shop');
assert.ok(dash.indexOf(script)>dash.indexOf('site-refinement.js'),
  'Workspace plugin must load after existing shell and location bar');
assert.ok(dash.indexOf(sheet)>dash.indexOf('site-refinement.css'),
  'Targeted styles must override existing design foundation');
assert.ok(sw.includes('./assets/js/dashboard/workspace-phase2.js?v=2.2.0&rev=dashboard-phase2-1'));
assert.ok(sw.includes('./assets/css/workspace-phase2.css?v=2.2.0&rev=dashboard-phase2-1'));
assert.ok(sw.includes("const WWZ_PWA_UPDATE_REVISION = '2026-11-08-v3-member-home-layout-2';"));

for(const signal of [
  "const groups = $$('details[data-nav-group]', root)",
  "'Server & World': [",
  "'Administration': [",
  "'Owner Configuration': [",
  'host.append(...items)',
  'wwz:dashboard:pins:v2',
  'wwz:dashboard:recent:v2',
  'localStorage.getItem',
  'localStorage.setItem',
  'link.hidden',
  "link.closest('[hidden]')",
  "if (canShow(target)) target.click()",
  "if (allowed(prevButton)) prevButton.click()",
  'wwz:accesschange',
  'wwz:authchange',
  'wwz:viewchange',
  "event.key === 'Escape'",
  'wwz-sidebar-searching',
  'const eligibleField =',
  'field.validity.valid',
  'field.validity.valueMissing',
  "field.insertAdjacentElement('afterend', feedback)",
  'aria-describedby',
  "document.addEventListener('reset'",
]) { if(signal==='if (allowed(prevButton)) prevButton.click()')continue;
  assert.ok(js.includes(signal),'Missing protected UX behaviour: '+signal);
}
assert.ok(!js.includes("link.closest('[hidden], [inert]"),
  'Mobile drawer inert must not erase legitimate saved workspaces');
assert.ok(!/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b/.test(js),
  'Navigation enhancer must never call network endpoints');
assert.ok(!/\.preventDefault\s*\(/.test(js),
  'Do not intercept form submission or checkout');
assert.ok(acc.includes("document.body.classList.contains('wwz-sidebar-searching')"),
  'Multiple matching groups must remain open during sidebar search');
for(const selector of [
  '.wwz-workspace-discovery', '.wwz-discovery-link',
  '.wwz-nav-filtered-out', '.wwz-workspace-empty-role',
  '.wwz-pin-workspace', '.wwz-inline-field-feedback',
  '.member-shop-page .member-results-head',
  "[data-view-panel='players']", "@media (max-width: 640px)",
  'prefers-reduced-motion'
])assert.ok(css.includes(selector),'Missing presentation rule: '+selector);
assert.ok(dash.includes('data-raid-damage-controls'),'Raid controls must remain untouched');
assert.ok(dash.includes('data-server-action="restart"'),'Original server controls remain under original permissions');
assert.ok(shop.includes('data-member-cart-checkout'),'Protected checkout button must remain unchanged');
assert.ok(shop.includes('data-member-shop-catalogue'),'Live catalogue render must remain');
new vm.Script(js,{filename:'workspace-phase2.js'});
console.log('PASS: routing, permission boundaries, admin forms, checkout and responsive UX checks');
