'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const js=fs.readFileSync('assets/js/dashboard/raid-weekends.js','utf8'),context={window:{},Date,Intl,Object};
vm.runInNewContext(js,context);
const {forServer,vehicleWipesForServer,mergeEvents}=context.window.WWZRaidWeekends;
const pve={key:'nasdara-pve',map_key:'badlands',gameplay_mode:'pve'};
assert.equal(forServer({key:'nasdara-pvp',map_key:'badlands',gameplay_mode:'pvp'}).length,0);
const rows=forServer(pve,Date.parse('2026-10-26T00:00:00Z'),15);
assert.equal(rows.length,15);
assert.equal(rows[0].starts_at,'2026-11-06T08:00:00.000Z');
assert.equal(rows[0].ends_at,'2026-11-08T08:00:00.000Z');
assert.equal(rows[1].starts_at,'2026-11-20T08:00:00.000Z');
assert.equal(rows[2].starts_at,'2026-12-04T08:00:00.000Z');
assert.equal(rows[4].starts_at,'2027-01-01T08:00:00.000Z');
const next=forServer(pve,Date.parse('2027-04-05T00:00:00Z'),1)[0];
const hour=new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Sydney',hour:'numeric',hourCycle:'h23'}).format(new Date(next.starts_at));
assert.equal(Number(hour),19,'7pm Sydney survives DST');
const real={...rows[0],id:42,virtual_raid_weekend:false};
assert.equal(mergeEvents([real],pve,Date.parse('2026-10-26T00:00:00Z')).filter(x=>x.starts_at===rows[0].starts_at).length,1);
assert.ok(rows.every(x=>x.signup_enabled===false&&x.virtual_raid_weekend));
const now=Date.parse('2026-11-15T00:00:00Z');
const wipes=vehicleWipesForServer(pve,now,3);
assert.equal(wipes.length,3);
assert.deepEqual(Array.from(wipes,x=>x.starts_at),[
  '2026-11-22T18:00:00.000Z',
  '2026-12-06T18:00:00.000Z',
  '2026-12-20T18:00:00.000Z'
]);
assert.ok(wipes.every(x=>x.event_type==='vehicle_wipe'&&x.virtual_vehicle_wipe&&x.signup_enabled===false));
assert.ok(wipes.every(x=>x.description.includes('not yet enabled')));
const pvp={key:'nasdara-pvp',map_key:'badlands',gameplay_mode:'pvp'};
assert.equal(forServer(pvp,now).length,0,'PvP has no PvE raid events');
assert.equal(vehicleWipesForServer(pvp,now,1)[0].starts_at,wipes[0].starts_at);
assert.equal(vehicleWipesForServer({key:'other',map_key:'chernarus',gameplay_mode:'pve'},now).length,0);
assert.equal(mergeEvents([],pve,now).filter(x=>x.event_type==='vehicle_wipe').length,12);
assert.equal(mergeEvents(wipes,pve,now).filter(x=>x.event_type==='vehicle_wipe').length,12,
  'Bot-fed maintenance entries must not duplicate client fallback');
assert.equal(mergeEvents([],pvp,now).filter(x=>x.event_type==='raid_weekend').length,0);
assert.equal(mergeEvents([],pvp,now).filter(x=>x.event_type==='vehicle_wipe').length,12);
const after=vehicleWipesForServer(pve,Date.parse('2026-11-24T00:00:00Z'),1)[0];
assert.equal(after.starts_at,'2026-12-06T18:00:00.000Z');
const dst=vehicleWipesForServer(pve,Date.parse('2027-04-05T00:00:00Z'),1)[0];
const dstHour=new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Sydney',hour:'numeric',hourCycle:'h23'}).format(new Date(dst.starts_at));
assert.equal(Number(dstHour),5,'5am Sydney survives DST');
assert.ok(mergeEvents([],pve,now).findIndex(x=>x.event_type==='vehicle_wipe')>0);
assert.equal(mergeEvents([rows[0]],pve,Date.parse('2026-10-26T00:00:00Z')).filter(x=>x.starts_at===rows[0].starts_at).length,1,'bot-fed planned raiding entries must not duplicate');
const community=fs.readFileSync('assets/js/dashboard/community.js','utf8');
const lazy=fs.readFileSync('assets/js/dashboard/lazy-assets.js','utf8');
assert.ok(community.includes('WWZRaidWeekends?.mergeEvents?.'));
assert.ok(community.includes('duration_minutes:2880'));
assert.ok(lazy.includes('ensureRaidWeekendCalendar().then'));
assert.ok(lazy.includes('raid-weekends.js?v=1.0.1&rev=post-raid-maintenance-1'));
assert.ok(community.includes("e.event_type==='vehicle_wipe'"));
assert.ok(community.includes("Number(e.id)>0"),'Virtual maintenance events must not be editable from Event Planner');
console.log('PASS: fortnightly raids plus proposed Monday 5am PvE/PvP vehicle maintenance, DST and calendar isolation');
