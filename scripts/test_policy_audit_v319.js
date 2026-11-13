'use strict';
// V3.19: mobile audit filtering, safe rendering, server isolation and paging.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const read = path => fs.readFileSync(path, 'utf8');
const script = read('assets/js/dashboard/policy-account-v318.js');
const css = read('assets/css/dashboard/policy-account-v318.css');
const html = read('dashboard.html');
const sw = read('sw.js');

for (const token of [
 'AUDIT_PAGE_SIZE = 25', 'URLSearchParams', "query.set('discord', prefix)",
 "version.value", 'filtered_records', 'older_only_accounts',
 'unique_accounts', 'current_accounts', 'total_records', 'versions',
 'has_more', 'loadPolicyAudit', 'refreshAuditVersions',
 "form.addEventListener('submit'", "clearButton.addEventListener('click'",
 "previous.addEventListener('click'", "next.addEventListener('click'",
 "version.addEventListener('change'", 'clearAuditResults();',
 "panel.dataset.staffOnly = ''", "['staff', 'owner'].includes(accessLevel)",
 "const token = getToken()", "serverName.textContent"
]) assert.ok(script.includes(token), 'Missing audit behaviour: ' + token);
assert.ok(!script.includes('innerHTML'), 'Audit must use text nodes, never raw HTML');
assert.ok(script.includes('safeRequest(ACCEPT_URL'), 'Existing policy acceptance must remain active');
assert.ok(script.includes('data-view-panel="staff"'));
assert.ok(css.includes('> #wwz-policy-acceptance-audit:not([hidden]) ~ .wwz-admin-hub'),
  'The generic Admin Workspace must hide beneath the visible policy audit only');
assert.ok(html.indexOf('id="wwz-policy-acceptance-audit"') <
          html.indexOf('<section class="wwz-admin-hub"'),
  'Audit must precede the generic admin shortcuts as a direct sibling');
assert.ok(css.includes('display: none !important;'),
  'The audit-only sibling rule must override the default Admin Hub display');
assert.ok(html.includes('data-nav-label="Policy Acceptance Audit" data-section="policy-audit" data-staff-only="" data-view="staff" hidden=""'),
  'Staff-only policy audit is discoverable in sidebar and search');
assert.ok(html.includes('id="wwz-policy-acceptance-audit" class="panel wwz-account-policy-audit" data-dashboard-section="policy-audit" data-staff-only="" hidden=""'),
  'Protected section target is static, so deep links can resolve on first sign-in');
assert.ok(script.includes("panel.dataset.dashboardSection = 'policy-audit'"));
assert.ok(script.includes('panel.hidden = !(allowed && auditActive)'));
assert.ok(script.includes("root.addEventListener('wwz:viewchange'"));
assert.ok(read('assets/js/dashboard/shell.js').includes('sectionTargetFor(selectedView, requested.section)'));

assert.ok(script.includes('aria-live'));
for (const selector of [
 '.wwz-account-policy-audit-stats', '.wwz-account-policy-audit-stat',
 '.wwz-account-policy-audit-filters', '.wwz-account-policy-audit-server',
 '.wwz-account-policy-audit-paging', '@media (max-width: 470px)',
 'min-height: 44px', 'font-size: 16px', 'focus-visible'
]) assert.ok(css.includes(selector), 'Missing mobile styling: ' + selector);
assert.ok(!/pointer-events\s*:\s*none/i.test(css));
assert.ok(html.includes('policy-account-v318.js?v=3.19.1&amp;rev=audit-route-1'));
assert.ok(html.includes('policy-account-v318.css?v=3.19.2&amp;rev=audit-isolation-1'));
assert.ok(sw.includes('2026-11-14-getting-started-v323-1'));
assert.ok(sw.includes('./assets/js/dashboard/policy-account-v318.js?v=3.19.1&rev=audit-route-1'));
assert.ok(sw.includes('./assets/css/dashboard/policy-account-v318.css?v=3.19.2&rev=audit-isolation-1'));
new vm.Script(script);

// Exercise the real audit builder, form, and API requests without dependencies.
class Element {
  constructor(tag='div') {
    this.tagName=tag; this.children=[]; this.listeners={}; this.dataset={};
    this.attributes={}; this.hidden=false; this.disabled=false; this.value='';
    this.className=''; this.textContent=''; this.open=false; this.style={};
    this.classList={add(){},remove(){},contains(){return false;}};
  }
  append(...items) {
    for(const item of items) {this.children.push(item);item.parentNode=this;}
    if(this.tagName==='select' && !this.value && this.children.length) this.value=this.children[0].value;
  }
  prepend(...items) {this.children.unshift(...items);}
  replaceChildren(...items) {this.children=[];if(this.tagName==='select')this.value='';this.append(...items);}
  setAttribute(name,value) {this.attributes[name]=value;}
  addEventListener(name,handler) {this.listeners[name]=handler;}
  querySelector(selector) {return find(this, el=>selector==='tbody'?el.tagName==='tbody':el.className.includes(selector.slice(1)));}
  get options() {return this.children.filter(child=>child.tagName==='option');}
  focus() {}
  showModal() {this.open=true;}
  close() {this.open=false;}
}
const find=(start,predicate)=>{
  if(predicate(start))return start;
  for(const child of start.children||[]){const result=find(child,predicate);if(result)return result;}
  return null;
};
const body = new Element('body');
const staff = new Element('section');
const main = new Element('main');
const document={
  readyState:'complete',body,
  createElement:tag=>new Element(tag),
  querySelector:selector=>selector==='[data-view-panel="staff"]'?staff:
    selector==='.dashboard-main'?main:null
};
let selected={key:'world-war-z',name:'Nasdara PvE'};
const apiCalls=[];
const listeners={};
const root={
  sessionStorage:{getItem:key=>key==='wwz_dashboard_session'?'A'.repeat(64):null},
  WWZServerContext:{getSelectedServer:()=>selected},
  WWZHttp:{request:async(url)=>{
    apiCalls.push(url);
    if(url.includes('/api/admin/policy/acceptances')) {
      const query=new URL(url).searchParams;
      return {ok:true,status:200,json:async()=>({
        policy_version:'2026-11-13.1',unique_accounts:3,current_accounts:2,
        older_only_accounts:1,total_records:4,
        filtered_records:query.has('discord')?2:40,
        limit:25,offset:Number(query.get('offset')||0),
        has_more:Number(query.get('offset')||0)<25,
        versions:[{version:'2026-11-13.1',records:2},{version:'2026-10-20.1',records:2}],
        records:[{discord_id:'999999999999999999',policy_version:'2026-11-13.1',
          accepted_at:'2026-11-13T10:00:00+00:00'}]
      })};
    }
    return {ok:true,status:200,json:async()=>({policy_version:'2026-11-13.1',accepted:true})};
  }},
  addEventListener:(name,handler)=>{listeners[name]=handler;},
  dispatchEvent:()=>{}
};
const CustomEvent=class {constructor(type,{detail}={}){this.type=type;this.detail=detail;}};
vm.runInNewContext(script,{window:root,document,URLSearchParams,CustomEvent,console});
const settle=async()=>{for(let i=0;i<5;i++)await Promise.resolve();};
(async()=>{
  listeners['wwz:viewchange']({detail:{view:'staff',section:'policy-audit'}});
  listeners['wwz:authchange']({detail:{authenticated:true,accessLevel:'staff'}});
  await settle();
  const panel=find(staff,el=>el.className.includes('wwz-account-policy-audit'));
  assert.ok(panel&&!panel.hidden,'Staff policy audit should be visible');
  const load=find(panel,el=>el.tagName==='button'&&el.textContent==='Load records');
  assert.ok(load,'Audit load action must exist');
  load.listeners.click();
  await settle();
  assert.ok(apiCalls.some(url=>url.includes('limit=25')&&url.includes('version=all')));
  listeners['wwz:viewchange']({detail:{view:'staff',section:'moderation-centre'}});
  assert.equal(panel.hidden,true,'Audit must be hidden while viewing another admin tool');
  listeners['wwz:viewchange']({detail:{view:'staff',section:'policy-audit'}});
  assert.equal(panel.hidden,false,'Audit is visible on its own staff route');
  // Core uses {detail:{level}}, not {detail:{accessLevel}}.
  listeners['wwz:accesschange']({detail:{level:'member'}});
  assert.equal(panel.hidden,true,'Revoking staff access must hide audit immediately');
  const stats=find(panel,el=>el.className==='wwz-account-policy-audit-stats');
  assert.equal(stats.hidden,true,'Losing staff access must clear previously loaded statistics');
  listeners['wwz:accesschange']({detail:{level:'staff'}});
  assert.equal(panel.hidden,false,'Restoring staff access permits the selected route');
  load.listeners.click();
  await settle();
  assert.equal(stats.hidden,false,'Restored staff must reload records from the protected API');
  const search=find(panel,el=>el.tagName==='input'&&el.type==='search');
  const form=find(panel,el=>el.tagName==='form');
  assert.ok(search&&form);
  search.value='999';
  form.listeners.submit({preventDefault(){}});
  await settle();
  assert.ok(apiCalls.some(url=>url.includes('discord=999')),'Search is sent to protected API');
  const version=find(panel,el=>el.tagName==='select');
  assert.ok(version.options.some(opt=>opt.value==='2026-10-20.1'),
    'Known historical policy versions are available');
  version.value='older';
  version.listeners.change();
  await settle();
  assert.ok(apiCalls.some(url=>url.includes('version=older')),'Version filter is applied');
  const next=find(panel,el=>el.tagName==='button'&&el.textContent==='Next');
  assert.ok(next&&!next.disabled,'Next page is available when backend says has_more');
  next.listeners.click();
  await settle();
  assert.ok(apiCalls.some(url=>url.includes('offset=25')),'Pagination is server-side');
  selected={key:'world-war-z-livonia',name:'Nasdara PvP'};
  listeners['wwz:serverchange']();
  await settle();
  const tbody=find(panel,el=>el.tagName==='tbody');
  assert.equal(tbody.children.length,0,'Server change clears previous world records');
  listeners['wwz:authchange']({detail:{authenticated:false,accessLevel:'guest'}});
  assert.equal(panel.hidden,true,'Audit must hide on logout');
  assert.equal(tbody.children.length,0,'Logout cannot retain private rows');
  console.log('PASS: V3.19 policy audit search, version filters, mobile layout, pagination and server isolation');
})().catch(error=>{console.error(error);process.exitCode=1;});
