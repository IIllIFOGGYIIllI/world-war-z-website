'use strict';
// World War Z V3.13: scoped, CSS-only form and navigation treatment.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=(path)=>fs.readFileSync(path,'utf8');
const css=read('assets/css/sitewide-v313-controls.css');
const sw=read('sw.js');
const pages=["index.html","dashboard.html","shop.html","donations.html","companion.html","rules.html","flags.html","legal.html","terms.html","privacy.html","community-guidelines.html","moderation-policy.html","changelog.html","map-link.html","offline.html","404.html"];
const style='assets/css/sitewide-v313-controls.css?v=3.13.0&amp;rev=forms-navigation-1';
for(const file of pages){
 const html=read(file);
 assert.equal(html.split(style).length-1,1,file+' must include V3.13 exactly once');
 assert.ok(html.indexOf(style)>html.indexOf('assets/css/site-refinement.css'),file+' must load V3.13 after the shared layer');
 assert.ok(html.includes('wwz-v3'),file+' must use V3 scope');
}
for(const token of [
 'body.wwz-v3','--wwz-v313-control','input[type="checkbox"]',
 'input[type="file"]::file-selector-button','[aria-invalid="true"]',
 '.member-catalogue-toolbar','.action-centre-toolbar','.flag-toolbar',
 'dialog.wwz-policy-gate','prefers-reduced-motion','forced-colors'
])assert.ok(css.includes(token),'Missing V3.13 token '+token);
assert.ok(!css.includes('display:none!important'),'V3.13 must not hide functional controls');
assert.ok(!css.includes('pointer-events:none'),'V3.13 must not disable functional controls');
assert.ok(sw.includes('./assets/css/sitewide-v313-controls.css?v=3.13.0&rev=forms-navigation-1'));
assert.ok(sw.includes('2026-11-14-policy-audit-v319-1'));
assert.ok(read('dashboard.html').includes('data-server-action="restart"'));
assert.ok(read('shop.html').includes('data-member-cart-checkout'));
console.log('PASS: V3.13 on 16 pages, consistent form states, toolbars and policy dialog');
