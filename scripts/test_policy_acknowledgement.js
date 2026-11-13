'use strict';
// V3.18.1: one actionable, verified policy acceptance — after Discord/server choice.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const api=require('../assets/js/site-policy-acceptance.js');
const account=require('../assets/js/dashboard/policy-account-v318.js');
const js=read('assets/js/site-policy-acceptance.js');
const accountJs=read('assets/js/dashboard/policy-account-v318.js');
const sw=read('sw.js');

const legacy={version:api.POLICY_REVISION,agreedToTerms:true,acknowledgedPrivacy:true,acceptedAt:'2026-11-12'};
assert.equal(api.POLICY_REVISION,'2026-11-13.1');
assert.equal(account.VERSION,api.POLICY_REVISION);
assert.equal(api.read({getItem:()=>JSON.stringify(legacy)}),true);
for(const bad of [{...legacy,version:'old'},{...legacy,agreedToTerms:false},{...legacy,acknowledgedPrivacy:false},{}]){
  assert.equal(api.read({getItem:()=>JSON.stringify(bad)}),false);
}
assert.equal(api.read({getItem:()=>'{broken'}),false);

const publicPages=['index.html','dashboard.html','shop.html','donations.html',
  'flags.html','companion.html','map-link.html','changelog.html'];
for(const page of publicPages){
  assert.ok(read(page).includes('site-policy-acceptance.js?v=1.1.1&amp;rev=single-account-prompt-1'),page);
}
for(const page of ['terms.html','privacy.html','legal.html','rules.html',
  'community-guidelines.html','moderation-policy.html']){
  assert.ok(api.EXEMPT.has(page));
  assert.ok(!read(page).includes('site-policy-acceptance.js?v='),page);
}

// Historical browser preferences must not create a second mandatory popup,
// or be treated as proof of the Discord-linked record.
assert.ok(!/showModal\s*\(|createElement\s*\(|wwz-policy-pending|localStorage\.setItem|sessionStorage\.setItem/.test(js));
let publicDomAccesses=0;
const browserWindow={sessionStorage:{getItem(){return null;}},localStorage:{getItem(){return null;}}};
const browserDocument=new Proxy({}, {get(){publicDomAccesses++;throw new Error('Public policy script must not alter the document');}});
vm.runInNewContext(js,{window:browserWindow,document:browserDocument});
assert.equal(publicDomAccesses,0,'The visitor notice must never create a blocking dialog');
assert.ok(accountJs.includes('showDialog(server)'));
assert.ok(accountJs.includes('requires_acceptance'));
assert.ok(accountJs.includes('safeRequest(ACCEPT_URL'));
assert.ok(accountJs.includes('wwz-account-policy-dialog'));
assert.ok(read('terms.html').includes('without a blocking acceptance popup'));
assert.ok(read('privacy.html').includes('without a blocking acceptance popup'));
assert.ok(read('legal.html').includes('without a blocking acknowledgement'));
assert.ok(sw.includes('2026-11-14-policy-audit-v319-1'));
assert.ok(sw.includes('./assets/js/site-policy-acceptance.js?v=1.1.1&rev=single-account-prompt-1'));
new vm.Script(js);
console.log('PASS: no duplicate public modal; one verified Discord policy gate after server selection');
