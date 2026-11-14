'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('assets/js/dashboard/community.js', 'utf8');
const start = source.indexOf('  const showEvent=(e)=>{');
const end = source.indexOf('\n  const editRun=', start);
assert.ok(start >= 0 && end > start, 'Calendar details renderer must exist');
const body = source.slice(start, end);
const details = [];
const escape = value => String(value ?? '')
  .replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'" :'&#39;','"':'&quot;'}[char]));
const ctx = {
  dashboardAccessLevel:'owner',
  eventLabel: e => String(e.event_type || 'custom'),
  eventEnding: () => 'Ongoing',
  eventHasRewards: () => false,
  rewardsText: () => '',
  fmtDate: v => String(v || '—'),
  esc: escape,
  eventMapUrl: e => e.x !== undefined && e.z !== undefined ? '/map-link.html' : '',
  setStatus: () => {},
  memberEventAction: () => {},
  editRun: () => {},
  showDialog: (title, html) => {
    const record = {title,html,classes:[]};
    details.push(record);
    return {
      classList:{add: name => record.classes.push(name)},
      querySelector: () => null,
    };
  },
};
vm.runInNewContext(body + '\nthis.showEventForTest=showEvent;', ctx);

const base = {
  status:'scheduled',starts_at:'2026-11-20T08:00:00+00:00',
  ends_at:'2026-11-22T08:00:00+00:00',
  location_label:'Nasdara PvE — full map',
  rules_text:'Only raid weekends permit base raiding.',
  setup_text:'Calendar notice only',
  signup_enabled:false,
};
ctx.showEventForTest({...base,id:-100001,virtual_raid_weekend:true,event_type:'raid_weekend',
  title:'💥 FORTNIGHTLY RAID WEEKEND'});
const raid=details.at(-1);
assert.equal(raid.title,'Fortnightly Raid Weekend');
assert.ok(raid.classes.includes('community-event-detail-modal'));
assert.ok(raid.html.includes('Raid Activation Notice'));
assert.ok(raid.html.includes('wwz-event-detail-facts'));
assert.ok(raid.html.includes('Event Rules'));
assert.ok(!raid.html.includes('No updates yet.'));
assert.ok(!raid.html.includes('Edit / Reschedule'));
assert.ok(!raid.html.includes('Nasdara PvE — full map'), 'Avoid repetitive server location');
assert.ok(!raid.html.includes('Additional Information'), 'Hide internal virtual event setup');

ctx.showEventForTest({...base,id:-200001,virtual_vehicle_wipe:true,event_type:'vehicle_wipe',
  title:'🚗 PLANNED VEHICLE WIPE — POST-RAID'});
const wipe=details.at(-1);
assert.equal(wipe.title,'Planned Vehicle Wipe — Post-Raid');
assert.ok(wipe.html.includes('Planned — Automation Not Enabled'));
assert.ok(wipe.html.includes('Automated vehicle wipes and the two maintenance restarts are not active'));
assert.ok(!wipe.html.includes('Edit / Reschedule'));
assert.ok(!wipe.html.includes('Register For Event'));
assert.ok(!wipe.html.includes('No updates yet.'));

ctx.showEventForTest({...base,id:42,event_type:'custom',title:'Desert Rally',
  description:'Fast race <script>bad()</script>',location_label:'Desert Start',
  signup_enabled:true,visibility:'public',x:123,z:456,
  activity:[{action:'run_updated',created_at:'2026-11-15',detail:'Updated route'}]});
const normal=details.at(-1);
assert.equal(normal.title,'Desert Rally');
assert.ok(normal.html.includes('Edit / Reschedule'));
assert.ok(normal.html.includes('Register For Event'));
assert.ok(normal.html.includes('Activity Timeline (1)'));
assert.ok(normal.html.includes('View Event On WWZ Map'));
assert.ok(normal.html.includes('&lt;script&gt;bad()&lt;/script&gt;'));
assert.ok(!normal.html.includes('<script>bad()'));

const css=fs.readFileSync('assets/css/dashboard/community.css','utf8');
const lazy=fs.readFileSync('assets/js/dashboard/lazy-assets.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
assert.ok(css.includes('.community-detail-dialog.community-event-detail-modal'));
assert.ok(css.includes('@media(max-width:520px)'));
assert.ok(lazy.includes('vehicle-wipe-readiness-1'));
assert.ok(lazy.includes('dialogpolish=1'));
assert.ok(sw.includes('2026-11-15-vehicle-wipe-readiness-1'));
console.log('PASS: polished raid/wipe/custom event dialogs, XSS escaping, mobile CSS and PWA assets');
