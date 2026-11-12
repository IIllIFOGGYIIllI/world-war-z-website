'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8'),api=require('../assets/js/site-policy-acceptance.js');
const js=read('assets/js/site-policy-acceptance.js');
const value={version:api.POLICY_REVISION,agreedToTerms:true,acknowledgedPrivacy:true,acceptedAt:'2026-11-12'};
assert.equal(api.read({getItem:()=>JSON.stringify(value)}),true);
for(const bad of [{...value,version:'old'},{...value,agreedToTerms:false},{...value,acknowledgedPrivacy:false},{}])
assert.equal(Boolean(api.read({getItem:()=>JSON.stringify(bad)})),false);
assert.equal(api.read({getItem:()=>'{broken'}),false);
for(const page of ['index.html','dashboard.html','shop.html','donations.html','flags.html','companion.html','map-link.html','changelog.html']){
const html=read(page);
assert.ok(html.includes('site-policy-acceptance.js?v=1.0.0&amp;rev=policy-20261112-1'),page);
}
for(const page of ['terms.html','privacy.html','legal.html','rules.html','community-guidelines.html','moderation-policy.html']){
assert.ok(api.EXEMPT.has(page));
assert.ok(!read(page).includes('site-policy-acceptance.js?v='),page);
}
assert.ok(read('privacy.html').includes('route-history'));
assert.ok(read('terms.html').includes('not linked to their Discord account'));
assert.ok(js.includes('dialog.showModal')&&js.includes('agreeInput.checked&&privacyInput.checked'));
assert.ok(js.includes('root.localStorage.setItem')&&js.includes('root.sessionStorage.setItem'));
assert.ok(!js.includes('fetch(')&&!js.includes('document.cookie'));
assert.ok(read('sw.js').includes('2026-11-13-mobile-usability-v315-1'));
new vm.Script(js);console.log('PASS: policy acknowledgement, local-only, accessible policy links and reacceptance');
