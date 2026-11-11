'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const api=require('../assets/js/dashboard/workspace-directory-v312.js');
const dash=read('dashboard.html'),sw=read('sw.js'),js=read('assets/js/dashboard/workspace-directory-v312.js');
function link(name,hidden=false){return {dataset:{view:name,section:'summary',navLabel:name},disabled:false,hidden:false,
 closest:sel=>sel==='[hidden]'?(hidden?{}:null):{querySelector:()=>({textContent:'Dashboard'})},
 matches:()=>true,querySelector:()=>({textContent:name})};}
const routes=api.visibleRoutes({querySelectorAll:()=>[link('overview'),link('map'),link('staff',true),link('map')]});
assert.deepEqual(routes.map(x=>x.id),['overview/summary','map/summary']);
assert.equal(api.filterRoutes(routes,'MAP','').length,1);
assert.equal(api.filterRoutes(routes,'','Dashboard').length,2);
assert.equal(api.allowed(link('trader')),false);
for(const hook of ['data-v312-directory','data-v312-count','data-v312-search','data-v312-category','data-v312-results','data-v312-more'])assert.ok(dash.includes(hook));
assert.ok(dash.indexOf('data-v312-directory')<dash.indexOf('Network at a glance'));
assert.ok(dash.includes('workspace-directory-v312.js?v=3.12.0&amp;rev=overview-directory-1'));
assert.ok(sw.includes('workspace-directory-v312.js?v=3.12.0&rev=overview-directory-1'));
assert.ok(js.includes('item.link.click()')&&js.includes('wwz:accesschange'));
assert.ok(!/\\bfetch\\s*\\(|XMLHttpRequest/.test(js));
new vm.Script(js);console.log('PASS: V3.12 workspace directory and permission-aware links');
