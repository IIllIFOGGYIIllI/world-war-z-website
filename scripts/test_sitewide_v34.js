
/* World War Z V3.4 shared UI, safety and performance regression. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {Script}=require('node:vm');
const read=x=>fs.readFileSync(x,'utf8');
const pages=['index.html','dashboard.html','shop.html','donations.html','companion.html','rules.html','flags.html','legal.html','terms.html','privacy.html','community-guidelines.html','moderation-policy.html','changelog.html','map-link.html','offline.html','404.html'];
for(const p of pages){
  const html=read(p);
  assert.ok(html.includes('assets/css/site-refinement.css?v=2.1.0&amp;rev=sitewide-ui-1'),p+' missing shared CSS');
  assert.ok(html.includes('assets/js/site-refinement.js?v=2.1.0&amp;rev=sitewide-ui-1'),p+' missing shared JS');
}
const css=read('assets/css/site-refinement.css'),js=read('assets/js/site-refinement.js'),sw=read('sw.js');
for(const token of [
  'V3.4 · Shared finishing pass','--wwz-v34-focus','[aria-invalid="true"]',
  '[data-wwz-v34-overflowing="true"]','dialog:not(.wwz-rental-map-dialog)',
  '.skip-link,.wwz-skip-link','@media(max-width:620px)',
  'prefers-reduced-motion','forced-colors'
])assert.ok(css.includes(token),'V3.4 CSS missing '+token);
for(const token of [
  "const VERSION='3.4.0'","const removeDuplicateSkip=",
  "a.skip-link[href^=\"#\"]","generated.remove()",
  ".leaflet-container",".wwz-gps-map","[data-map]",
  "img.loading='lazy'","img.decoding='async'",
  "new ResizeObserver","region.tabIndex=0",
  "region.setAttribute('role','region')",
  "new MutationObserver","window.requestIdleCallback",
  "observer.observe(root,{childList:true,subtree:true})",
  "document.body.dataset.wwzV34Ready='1'"
])assert.ok(js.includes(token),'V3.4 JS missing '+token);
assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|showModal\s*\(/.test(js),
  'Shared UI must not fetch, persist identity, invoke modal actions or mutate data');
assert.ok(sw.includes("const WWZ_PWA_VERSION = '2.21.12';"));
assert.match(sw, /const WWZ_PWA_UPDATE_REVISION = '[^']+';/, 'Missing PWA revision token');
assert.ok(read('dashboard.html').includes('data-raid-damage-controls'));
assert.ok(read('dashboard.html').includes('data-server-action="restart"'));
assert.ok(read('shop.html').includes('data-rental-cart-checkout'));
new Script(js,{filename:'site-refinement.js'});
console.log('PASS: 16 pages use V3.4 polish, accessible tables, no duplicate skip links, safe lazy media');
