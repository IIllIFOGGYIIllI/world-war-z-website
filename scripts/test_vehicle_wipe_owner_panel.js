'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const html=fs.readFileSync('dashboard.html','utf8');
const js=fs.readFileSync('assets/js/dashboard/community.js','utf8');
const css=fs.readFileSync('assets/css/dashboard/community.css','utf8');
const lazy=fs.readFileSync('assets/js/dashboard/lazy-assets.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');

for(const text of [
  'data-vehicle-wipe-owner','data-vehicle-wipe-next','data-vehicle-wipe-phase',
  'data-vehicle-wipe-preflight','data-vehicle-wipe-recovery','data-vehicle-wipe-result'
])assert.ok(html.includes(text),'Missing owner maintenance field '+text);
assert.ok(html.includes('Neither button uploads files'));
assert.ok(!html.includes('data-vehicle-wipe-enable'), 'Never expose live activation');
assert.ok(js.includes("vehicle_wipe_preflight"));
assert.ok(js.includes("vehicle_wipe_recovery_check"));
assert.ok(js.includes("body:JSON.stringify({action})"),'Read-only owner action should use protected API');
assert.ok(!js.includes("vehicle_wipe_run"));
assert.ok(!js.includes("vehicle_wipe_enable"));

const start=js.indexOf('  const renderVehicleWipePanel=(state=null)=>{');
const stop=js.indexOf('\n  const renderPlanner =',start);
assert.ok(start>=0&&stop>start,'Maintenance UI render function missing');
const source=js.slice(start,stop);
const elements={};
function el(selector){return elements[selector]||(elements[selector]={hidden:true,textContent:'',dataset:{serverScope:'old'}});}
const server={key:'nasdara-pve',map_key:'badlands',gameplay_mode:'pve'};
const ctx={
  dashboardAccessLevel:'owner',
  window:{WWZServerContext:{getSelectedServer:()=>server},
          WWZRaidWeekends:{vehicleWipesForServer:()=>[{starts_at:'2026-11-22T18:00:00.000Z'}]}},
  Date,Array,String,
  qs:el,
  fmtSydney:()=> '23 Nov 2026, 5:00 am',
  selectedScope:()=>server.key+':'+server.map_key,
};
vm.runInNewContext(source+'\nthis.renderVehicleWipePanelForTest=renderVehicleWipePanel;',ctx);
ctx.renderVehicleWipePanelForTest({
  enabled:false,next_proposed_window:'2026-11-22T18:00:00.000Z',
  phase:'idle',attention_required:false,paused:false,
});
assert.equal(el('[data-vehicle-wipe-owner]').hidden,false,'PvE owner panel visible');
assert.equal(el('[data-vehicle-wipe-state]').textContent,'Automation Disabled');
assert.equal(el('[data-vehicle-wipe-next]').textContent,'23 Nov 2026, 5:00 am');
assert.equal(el('[data-vehicle-wipe-phase]').textContent,'No Active Cycle');
assert.equal(el('[data-vehicle-wipe-result]').hidden,true,'Old server result cleared');

ctx.dashboardAccessLevel='staff';
ctx.renderVehicleWipePanelForTest({});
assert.equal(el('[data-vehicle-wipe-owner]').hidden,true,'Staff must not see owner panel');
ctx.dashboardAccessLevel='owner';
server.key='nasdara-pvp';
server.gameplay_mode='pvp';
ctx.renderVehicleWipePanelForTest({paused:true,phase:'idle'});
assert.equal(el('[data-vehicle-wipe-owner]').hidden,false,'PvP owner may inspect pause status');
assert.ok(el('[data-vehicle-wipe-summary]').textContent.includes('paused'));
server.map_key='chernarus';
ctx.renderVehicleWipePanelForTest({});
assert.equal(el('[data-vehicle-wipe-owner]').hidden,true,'Retired worlds excluded');

assert.ok(css.includes('.community-vehicle-wipe[hidden]{display:none!important}'));
assert.ok(css.includes('@media(max-width:620px)'));
assert.ok(lazy.includes('vehicle-wipe-readiness-1'));
assert.ok(lazy.includes('ownerwipe=1'));
assert.ok(sw.includes('2026-11-15-vehicle-wipe-readiness-1'));
console.log('PASS: owner-only PvE/PvP readiness UI, retired-map scope, disabled execution and PWA assets');
