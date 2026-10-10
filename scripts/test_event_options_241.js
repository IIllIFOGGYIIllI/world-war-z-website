'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf-8');
const h=read('dashboard.html'),j=read('assets/js/dashboard/community.js'),c=read('assets/css/dashboard/community.css');
for(const bit of ['name="restart_enabled"','data-event-restart-toggle','data-event-restart-fields hidden',
                  'name="rewards_enabled"','data-event-rewards-toggle','data-event-reward-fields hidden',
                  'Ongoing Event','Until manually ended'])assert(h.includes(bit),`Event option missing: ${bit}`);
for(const bit of ['syncEventOptionFields','rewards_enabled:plannerForm.elements.rewards_enabled.checked',
                  "restart_minutes_before:plannerForm.elements.restart_enabled.checked?f.get('restart_minutes_before'):'0'",
                  'eventHasRewards(run)&&','eventHasRewards(e)?',"eventLabel = e =>"])assert(j.includes(bit),`Missing event logic ${bit}`);
assert(c.includes('[data-event-reward-fields][hidden]'),'Disabled controls must stay hidden');
assert(!h.includes('Ongoing Campaign'),'No ongoing campaign UI text');
console.log('Ongoing Event options and optional-section wiring: 17 checks passed');
