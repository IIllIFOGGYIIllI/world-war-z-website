'use strict';
// V3.21 static and simulated API safety for staff PSN identity review.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('dashboard.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const js=fs.readFileSync('assets/js/dashboard/psn-alt-admin-v321.js','utf8');
const css=fs.readFileSync('assets/css/dashboard/psn-alt-admin-v321.css','utf8');
assert.equal(html.split('data-psn-alt-admin=""').length-1,1,'Only one admin PSN panel');
assert.ok(html.includes('data-dashboard-section="identity-sync" data-staff-only="" data-psn-alt-admin=""'));
for(const hook of ['data-alt-admin-form','data-alt-admin-query','data-alt-admin-results',
  'data-alt-admin-history','data-alt-admin-audit','data-alt-admin-status']){
  assert.ok(html.includes(hook),'Missing UI hook '+hook);
}
assert.ok(html.includes('psn-alt-admin-v321.js?v=3.21.0&amp;rev=psn-admin-1'));
assert.ok(html.includes('psn-alt-admin-v321.css?v=3.21.0&amp;rev=psn-admin-1'));
assert.ok(sw.includes('2026-11-14-alt-admin-v321-1'));
assert.ok(sw.includes('./assets/js/dashboard/psn-alt-admin-v321.js?v=3.21.0&rev=psn-admin-1'));
assert.ok(sw.includes('./assets/css/dashboard/psn-alt-admin-v321.css?v=3.21.0&rev=psn-admin-1'));
for(const a of ['@media (max-width: 640px)','min-height: 44px','focus-visible']){
  assert.ok(css.includes(a));
}
for(const v of ['/api/admin/account/psn-alts?q=','/api/admin/account/psn-alts/action',
  'confirm: true','encodeURIComponent(q)','root.confirm','wwz:authchange',
  'wwz:serverchange','wwz:viewchange']){
  assert.ok(js.includes(v),'Missing auth or owner action safeguard: '+v);
}
assert.ok(!js.includes('innerHTML')&&!js.includes('localStorage')&&!js.includes('document.cookie'));
new vm.Script(js);
class Element {
  constructor(name='div'){this.name=name;this.children=[];this.listeners={};
    this.dataset={};this.disabled=false;this.hidden=false;this.value='';this.textContent='';
    this.className='';this.attributes={};}
  append(...items){for(const item of items){this.children.push(item);item.parentNode=this;}}
  replaceChildren(...items){this.children=[];this.append(...items);}
  addEventListener(name,cb){this.listeners[name]=cb;}
  setAttribute(name,value){this.attributes[name]=value;}
}
const selectors=['data-alt-admin-form','data-alt-admin-query','data-alt-admin-status',
  'data-alt-admin-results','data-alt-admin-history','data-alt-admin-audit',
  'data-alt-admin-search'];
const field=Object.fromEntries(selectors.map(x=>[x,new Element(x)]));
const panel={querySelector:s=>field[s.slice(1,-1)]};
const document={querySelector:s=>s==='[data-psn-alt-admin]'?panel:null,
  createElement:name=>new Element(name)};
const events={};const calls=[];let selected={key:'world-war-z'};
const searchResult={status:'ok',can_manage:true,results:[{
  discord_id:'123',primary_psn:'Main_123',primary_verified:true,
  alts:[{psn_id:'ALT_123',active:1}],
  pending:{psn_id:'NEXT_123',expires_at:'2026-11-15T00:00:00+00:00'}
}],history_conflicts:[{psn_id:'Legacy_345',discord_id:'777',server_key:'world-war-z'}],
 audit:[{psn_id:'ALT_123',action:'verified',actor_kind:'live_adm',created_at:'2026-11-14'}]};
const root={
  sessionStorage:{getItem:key=>key==='wwz_dashboard_session'?'x'.repeat(64):null},
  WWZServerContext:{getSelectedServer:()=>selected},
  WWZHttp:{request:async(url,opts)=>{calls.push({url,opts});
    return {ok:true,json:async()=>opts.method==='POST'?
      {status:'ok',message:'Changed',dm_delivered:true}:searchResult};}},
  addEventListener:(name,callback)=>{events[name]=callback;},
  confirm:()=>true,
  location:{hash:'#staff/identity-sync'}
};
vm.runInNewContext(js,{window:root,document,console,encodeURIComponent});
async function settle(){for(let i=0;i<10;i++)await Promise.resolve();}
(async()=>{
  events['wwz:viewchange']({detail:{view:'staff',section:'identity-sync'}});
  field['data-alt-admin-query'].value='ALT_123';
  field['data-alt-admin-form'].listeners.submit({preventDefault(){}});
  await settle();
  assert.ok(calls.some(x=>x.url.includes('q=ALT_123')));
  assert.equal(field['data-alt-admin-results'].children.length,1);
  assert.equal(field['data-alt-admin-history'].children.length,1);
  assert.equal(field['data-alt-admin-audit'].children.length,1);
  const record=field['data-alt-admin-results'].children[0];
  const reason=record.children.find(x=>x.className==='wwz-alt-admin-reason');
  reason.value='Owner reviewed verified alias';
  const alt=record.children.find(x=>x.className==='wwz-alt-admin-psn');
  const button=alt.children.find(x=>x.className.includes('wwz-alt-admin-manage'));
  button.listeners.click();
  await settle();
  const writes=calls.filter(x=>x.opts.method==='POST');
  assert.equal(writes.length,1);
  const payload=JSON.parse(writes[0].opts.body);
  assert.equal(payload.action,'deactivate');
  assert.equal(payload.discord_id,'123');
  assert.equal(payload.psn_id,'ALT_123');
  assert.equal(payload.reason,reason.value);
  assert.equal(payload.confirm,true);
  selected={key:'nasdara-pvp'};
  events['wwz:serverchange']();
  assert.equal(field['data-alt-admin-results'].children.length,0);
  assert.equal(field['data-alt-admin-query'].value,'');
  console.log('PASS: V3.21 admin search, owner audit action, conflict review, PWA and auth resets');
})().catch(error=>{console.error(error);process.exitCode=1;});
