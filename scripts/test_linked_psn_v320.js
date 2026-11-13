'use strict';
// V3.20: verify navigation, auth scoping, and live secondary-PSN workflow.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const html=read('dashboard.html');
const js=read('assets/js/dashboard/linked-psn-v320.js');
const css=read('assets/css/dashboard/linked-psn-v320.css');
const sw=read('sw.js');
const asset='assets/js/dashboard/linked-psn-v320.js?v=3.20.1&amp;rev=psn-alts-2';
const style='assets/css/dashboard/linked-psn-v320.css?v=3.20.0&amp;rev=psn-alts-1';
assert.equal(html.split(asset).length-1,1,'Script linked once');
assert.equal(html.split(style).length-1,1,'Styles linked once');
assert.ok(html.includes('data-nav-label="Linked PSN Accounts" data-section="overview" data-view="linked-psns"'));
assert.ok(html.includes('data-view-panel="linked-psns" hidden=""'));
assert.ok(html.includes('data-dashboard-section="overview" id="dashboard-linked-psn-overview"'));
for(const token of ['data-psn-alt-primary','data-psn-alt-count','data-psn-alt-form','data-psn-alt-list',
 'data-psn-alt-pending','data-psn-alt-message','data-psn-alt-guest','data-psn-alt-content'])
  assert.ok(html.includes(token),'Missing PSN workspace hook '+token);
for(const token of ['/api/account/psn-alts','/api/account/psn-alts/action','wwz:authchange',
 'wwz:viewchange','wwz:serverchange',"action: 'link'","action: 'cancel'",
 "action: 'deactivate'",'confirm: true','psnValid','requestId',
 "getToken() !== token", 'getServer()?.key !== serverKey', "status('Unable to"])
  assert.ok(js.includes(token),'Missing authenticated linking safeguard '+token);
assert.ok(!js.includes('localStorage') && !js.includes('innerHTML') &&
          !js.includes('document.cookie'),'No local identity storage/unsafe HTML');
for(const token of ['.wwz-psn-alt-summary','.wwz-psn-alt-manager',
 '.wwz-psn-alt-form','min-height: 44px','@media (max-width: 460px)',
 'focus-visible','prefers-reduced-motion','forced-colors'])assert.ok(css.includes(token));
assert.ok(sw.includes('2026-11-14-alt-admin-v321-1'));
assert.ok(sw.includes('./assets/js/dashboard/linked-psn-v320.js?v=3.20.2&rev=psn-alts-3'));
assert.ok(sw.includes('./assets/css/dashboard/linked-psn-v320.css?v=3.20.0&rev=psn-alts-1'));
assert.ok(html.includes('data-server-action="restart"'),'Game controls left intact');
assert.ok(html.includes('data-change-server'),'Server isolation remains');
assert.ok(html.includes('policy-account-v318.js'),'Discord policy gate preserved');
new vm.Script(js);

class El {
 constructor(tag='div'){
  this.tagName=tag;this.children=[];this.listeners={};this.attributes={};
  this.hidden=false;this.disabled=false;this.value='';this.textContent='';
  this.name='';this.className='';this.style={};
 }
 append(...nodes){for(const n of nodes){this.children.push(n);n.parentNode=this;}}
 replaceChildren(...nodes){this.children=[];this.append(...nodes);}
 setAttribute(name,value){this.attributes[name]=value;}
 addEventListener(type,listener){this.listeners[type]=listener;}
}
const selectors=['data-psn-alt-content','data-psn-alt-guest','data-psn-alt-primary',
 'data-psn-alt-count','data-psn-alt-list','data-psn-alt-pending','data-psn-alt-form',
 'data-psn-alt-input','data-psn-alt-submit','data-psn-alt-message',
 'data-psn-alt-refresh','data-psn-alt-server'];
const fields=Object.fromEntries(selectors.map(k=>[k,new El(k==='data-psn-alt-form'?'form':'div')]));
const panel={querySelector:selector=>fields[selector.slice(1,-1)]};
const document={querySelector:selector=>selector==='[data-view-panel="linked-psns"]'?panel:null,
  createElement:tag=>new El(tag)};
let selected={key:'world-war-z',name:'Nasdara PvE'};
const handlers={};
const calls=[];
const base={status:'ok',primary_psn:'Main_123',alts:[],max_alts:2,pending:null};
let verified=false;
const intervals=new Map();
let nextInterval=1;
const root={
 sessionStorage:{getItem:name=>name==='wwz_dashboard_session'?'a'.repeat(64):null},
 WWZServerContext:{getSelectedServer:()=>selected},
 WWZHttp:{request:async(url,options)=>{
  calls.push({url,options});
  const body=options.body?JSON.parse(options.body):null;
  return {ok:true,json:async()=>body?.action==='link'?{...base,pending:{
   psn_id:body.psn_id,guild_id:'1410680659126784074',
   expires_at:'2026-11-14T01:00:00+00:00'}}:
   verified?{...base,alts:[{psn_id:'ALT_123',verified_at:'2026-11-14T01:00:00+00:00'}]}:base};
 }},
 addEventListener:(event,fn)=>{handlers[event]=fn;},
 confirm:()=>true,
 setInterval:(fn,delay)=>{assert.equal(delay,20000);const id=nextInterval++;intervals.set(id,fn);return id;},
 clearInterval:id=>intervals.delete(id),
};
vm.runInNewContext(js,{window:root,document,console});
const settle=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
(async()=>{
 handlers['wwz:authchange']({detail:{authenticated:true}});
 handlers['wwz:viewchange']({detail:{view:'linked-psns'}});
 await settle();
 assert.equal(fields['data-psn-alt-primary'].textContent,'Main_123');
 assert.equal(fields['data-psn-alt-guest'].hidden,true);
 assert.equal(fields['data-psn-alt-content'].hidden,false);
 assert.equal(fields['data-psn-alt-submit'].disabled,false);
 assert.ok(calls.some(x=>x.url.endsWith('/api/account/psn-alts')));
 fields['data-psn-alt-input'].value='ALT_123';
 fields['data-psn-alt-form'].listeners.submit({preventDefault(){}});
 await settle();
 const writes=calls.filter(x=>x.url.includes('/api/account/psn-alts/action'));
 assert.equal(writes.length,1);
 assert.deepEqual(JSON.parse(JSON.stringify(JSON.parse(writes[0].options.body))),
                  {action:'link',psn_id:'ALT_123'});
 assert.ok(fields['data-psn-alt-pending'].children.length>0);
 assert.equal(intervals.size,1,'Pending verification should poll while visible');
 verified=true;
 [...intervals.values()][0]();
 await settle();
 assert.equal(intervals.size,0,'Auto polling stops once DayZ verifies the PSN');
 assert.equal(fields['data-psn-alt-pending'].hidden,true);
 assert.ok(fields['data-psn-alt-message'].textContent.includes('verified and linked'));
 assert.ok(fields['data-psn-alt-list'].children.some(
   item=>item.children?.[0]?.children?.[0]?.textContent==='ALT_123'
 ));
 // Expiry should not silently vanish after the pending PSN disappears.
 verified=false;
 fields['data-psn-alt-input'].value='ALT_456';
 fields['data-psn-alt-form'].listeners.submit({preventDefault(){}});
 await settle();
 assert.equal(intervals.size,1);
 [...intervals.values()][0]();
 await settle();
 assert.ok(fields['data-psn-alt-message'].textContent.includes('expired or was cancelled'));
 assert.equal(intervals.size,0);
 selected={key:'nasdara-pvp',name:'Nasdara PvP'};
 handlers['wwz:serverchange']();
 await settle();
 assert.equal(fields['data-psn-alt-server'].textContent,'Nasdara PvP');
 handlers['wwz:authchange']({detail:{authenticated:false}});
 assert.equal(fields['data-psn-alt-content'].hidden,true);
 assert.equal(fields['data-psn-alt-primary'].textContent,'—');
 assert.equal(fields['data-psn-alt-submit'].disabled,true);
 console.log('PASS: V3.20 verified-alt navigation, authenticated actions, PvE/PvP switch and logout isolation');
})().catch(error=>{console.error(error);process.exitCode=1;});
