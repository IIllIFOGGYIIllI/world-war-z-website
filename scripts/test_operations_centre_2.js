'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class Element {
  constructor(tag='div') { this.tagName=tag; this.children=[]; this.listeners={}; this.textContent=''; this.attributes={}; this.dataset={}; this.hidden=false; this.disabled=false; }
  append(...args){ this.children.push(...args); }
  replaceChildren(...args){ this.children=[...args]; }
  addEventListener(name, callback){this.listeners[name]=callback;}
  setAttribute(name, value){this.attributes[name]=value;}
  removeAttribute(name){delete this.attributes[name];}
  fire(name){this.listeners[name]?.();}
}
const elements=new Map();
const root = new Element('main');
root.querySelector=(s)=>{ if(!elements.has(s)) elements.set(s,new Element()); return elements.get(s); };
root.querySelectorAll=()=>[];
const document={
  querySelector:(s)=>s==='[data-dashboard-section="server-audit"]'?root:null,
  createElement:(tag)=>new Element(tag), addEventListener:()=>{}, visibilityState:'visible'
};
const response={
  status:'ok', checked_at:'2026-10-09T04:00:00Z', scope:{map_name:'Chernarus'},
  health:{score:96,state:'healthy'}, workers:[{state:'critical',label:'Shop delivery',status:'Stopped'}],
  worker_summary:{total:1,running:0,attention:1},
  services:[],signals:[],recent_errors:[],history:[],runtime:{},restart_summary:{},adm:{},
  failure_count:1, audit:{failures_24h:1},
  delivery_queue:{available:true,open:6,failed:2,approvals:1,cleanup_due:1,
    items:{queued:2,failed:1},rentals:{awaiting_approval:1,failed:1,active:1},
    oldest_waiting_at:'2026-10-09T03:00:00Z',last_updated_at:'2026-10-09T04:00:00Z'}
};
const location={hash:'#staff/server-audit'};
const window={addEventListener:()=>{},clearInterval:()=>{},setInterval:()=>0};
const context={window,document,location,AUTH_SESSION_KEY:'WWZ',ADMIN_OPERATIONS_CENTRE_URL:'/api/admin/operations/centre',
  storageGet:()=> 'test',hasServerActionAccess:()=>true,
  authFetch:async()=>({ok:true,status:200,json:async()=>response}),
  formatUpdatedAt:v=>v, Date,
};
vm.runInNewContext(fs.readFileSync('assets/js/dashboard/operations-centre.js','utf8'),context,{filename:'operations-centre.js'});
(async()=>{
 await window.WWZOperationsCentre.refresh();
 const text=(q)=>elements.get(q)?.textContent;
 assert.equal(text('[data-operations-delivery-open]'),'6');
 assert.equal(text('[data-operations-delivery-failed]'),'2');
 assert.equal(text('[data-operations-delivery-approvals]'),'1');
 assert.match(text('[data-operations-delivery-items]'),/2 queued/);
 const actions=elements.get('[data-operations-next-actions]').children;
 assert.ok(actions.length>=3);
 assert.match(actions[0].children[0].children[0].textContent,/failed deliveries/i);
 actions[0].children[1].fire('click');
 assert.equal(location.hash,'#delivery/queue');
 response.delivery_queue={available:false};
 response.workers=[];response.worker_summary={total:0,running:0,attention:0};response.failure_count=0;
 await window.WWZOperationsCentre.refresh();
 assert.equal(text('[data-operations-delivery-open]'),'—');
 assert.match(text('[data-operations-delivery-note]'),/Do not assume/);
 assert.match(elements.get('[data-operations-next-actions]').children[0].children[0].children[0].textContent,/diagnostics/i);
 console.log('Operations Centre 2.0 interaction checks passed: queue totals, action routing, unavailable-state guard.');
})().catch(err=>{console.error(err);process.exitCode=1});
