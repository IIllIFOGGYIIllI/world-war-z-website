'use strict';
// V3.23 browser safety for privacy-preserving DayZ onboarding.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html=fs.readFileSync('dashboard.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const js=fs.readFileSync('assets/js/dashboard/getting-started-v323.js','utf8');
const css=fs.readFileSync('assets/css/dashboard/getting-started-v323.css','utf8');
assert.equal(html.split('data-view-panel="getting-started"').length-1,1);
assert.equal(html.split('data-nav-label="Getting Started"').length-1,1);
for(const field of ['data-v323-count','data-v323-track','data-v323-checklist',
 'data-v323-refresh','data-v323-status']){
 assert.ok(html.includes(field),'Missing setup hook: '+field);
}
assert.ok(html.includes('getting-started-v323.js?v=3.23.0&amp;rev=player-guide-1'));
assert.ok(html.includes('getting-started-v323.css?v=3.23.0&amp;rev=player-guide-1'));
assert.ok(sw.includes('2026-11-14-getting-started-v323-1'));
assert.ok(sw.includes('./assets/js/dashboard/getting-started-v323.js?v=3.23.0&rev=player-guide-1'));
assert.ok(sw.includes('./assets/css/dashboard/getting-started-v323.css?v=3.23.0&rev=player-guide-1'));
for(const term of ['@media (max-width: 480px)','focus-visible','min-height: 44px'])
 assert.ok(css.includes(term));
assert.ok(!/\binnerHTML\b/.test(js), 'Do not render server-sourced HTML');
assert.ok(!js.includes('localStorage'), 'Do not persist identity or setup flags locally');
assert.ok(js.includes("www")===false);
assert.ok(js.includes('/api/account/getting-started'));
new vm.Script(js);
class Element {
 constructor(tag='div'){this.tag=tag;this.children=[];this.listeners={};
 this.dataset={};this.style={};this.attributes={};this.textContent='';
 this.disabled=false;this.hidden=false;this.value='';this.className='';this.closest=()=>null;}
 addEventListener(event,fn){this.listeners[event]=fn;}
 setAttribute(name,value){this.attributes[name]=String(value);}
 replaceChildren(...nodes){this.children=[];this.append(...nodes);}
 append(...nodes){for(const node of nodes){this.children.push(node);node.parentNode=this;}}
 click(){this.listeners.click?.();}
}
const fields=['heading','server','count','track','fill','status','checklist','refresh'];
const els=Object.fromEntries(fields.map(k=>['data-v323-'+k,new Element(k)]));
const buttons=['map','tickets','linked-psns'].map(k=>{const n=new Element('button');n.dataset.v323Route=k;return n;});
const panel={querySelector:s=>els[s.slice(1,-1)],querySelectorAll:s=>s==='[data-v323-route]'?buttons:[]};
const nav={querySelectorAll:()=>[]};
const doc={
 querySelector:s=>s==='[data-view-panel="getting-started"]'?panel:
   s==='.sidebar-navigation'?nav:null,
 createElement:name=>new Element(name),
 readyState:'complete'
};
const events={};
let current={key:'world-war-z',name:'Nasdara PvE'};
let access='x'.repeat(64);
const calls=[];
const payload={status:'ok',server:{key:'world-war-z',name:'Nasdara PvE'},
 ready:false,completed_count:2,total_count:4,steps:[
 {key:'discord',title:'Discord connected',description:'Account confirmed',complete:true},
 {key:'server',title:'Choose server',description:'Nasdara selected',complete:true},
 {key:'playstation',title:'Link PlayStation',description:'Join DayZ',complete:false},
 {key:'policies',title:'Review policies',description:'Accept policies',complete:false}
]};
const root={
 sessionStorage:{getItem:k=>k==='wwz_dashboard_session'?access:null},
 WWZServerContext:{getSelectedServer:()=>current},
 WWZHttp:{request:async(url,opts)=>{
   calls.push({url,opts});
   return {ok:true,json:async()=>payload};
 }},
 addEventListener:(key,fn)=>events[key]=fn,
 location:{hash:''}
};
vm.runInNewContext(js,{window:root,document:doc,console});
const settle=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
(async()=>{
 events['wwz:viewchange']({detail:{view:'getting-started',section:'overview'}});
 await settle();
 assert.equal(calls.length,1);
 assert.ok(calls[0].opts.headers.Authorization.endsWith(access));
 assert.equal(els['data-v323-count'].textContent,'2 of 4 steps complete');
 assert.equal(els['data-v323-checklist'].children.length,4);
 assert.equal(els['data-v323-track'].attributes['aria-valuenow'],'2');
 const incomplete=els['data-v323-checklist'].children.slice(2);
 assert.ok(incomplete.every(x=>x.dataset.complete==='false'));
 assert.equal(incomplete[0].children[2].textContent,'Link PlayStation');
 assert.equal(incomplete[1].children[2].textContent,'Review policies');
 // Policy update immediately rechecks current server without saving a local flag.
 payload.ready=true;payload.steps.forEach(x=>x.complete=true);
 events['wwz:policyaccepted']({});
 await settle();
 assert.equal(els['data-v323-count'].textContent,'4 of 4 steps complete');
 assert.equal(els['data-v323-track'].attributes['aria-valuenow'],'4');
 assert.equal(els['data-v323-checklist'].children[3].children.length,2);
 // Switching server invalidates the original account view and never reuses
 // cached completion from the first Nasdara server.
 current={key:'nasdara-pvp',name:'Nasdara PvP'};
 events['wwz:serverchange']();
 await settle();
 assert.equal(els['data-v323-checklist'].children.length,4);
 assert.ok(els['data-v323-status'].textContent.includes('selected server changed'));
 access='';
 events['wwz:authchange']({detail:{authenticated:false}});
 assert.equal(els['data-v323-checklist'].children.length,0);
 assert.equal(els['data-v323-count'].textContent,'Not checked');
 console.log('PASS: V3.23 authenticated account setup, completion, policy updates, server isolation and logout');
})().catch(err=>{console.error(err);process.exitCode=1;});
