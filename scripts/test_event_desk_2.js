// Focused release-wiring regression. Full authenticated behaviour requires live Bot.
'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root,name),'utf8');
const js = read('assets/js/dashboard/community.js');
const html = read('dashboard.html');
const css = read('assets/css/dashboard/community.css');
const lazy = read('assets/js/dashboard/lazy-assets.js');
const sw = read('sw.js');
for(const action of ['event_desk_participant','event_desk_check_in','event_desk_attendance_reward','event_desk_winner_reward']){
  assert.ok(js.includes(`action:'${action}'`),`UI action ${action} is wired`);
}
for(const token of ['data-event-select-all','data-event-member-check','data-event-team','data-event-score','data-event-save-participant','data-event-pay-winner','data-event-pay-attendance']){
  assert.ok(js.includes(token), `Missing Live Event Desk control: ${token}`);
}
assert.ok(js.includes("action:'event_desk_check_in'") && js.includes("confirm_rewards:false"), 'Check-in and published results never autopay');
assert.ok(js.includes("action:'event_desk_winner_reward'") && js.includes("confirm_rewards:true"), 'Payout approval requires explicit confirmation');
assert.ok(html.includes('Live Event Desk') && html.includes('data-community-attendance'), 'Live Event Desk is available in the planner');
assert.ok(css.includes('wwz-event-scoreboards') && css.includes('@media(max-width:490px)'), 'Responsive event desk styles exist');
assert.ok(lazy.includes('community.js?v=2.4.2') && lazy.includes('community.css?v=2.4.2'),'Lazy assets use new cache revision');
assert.ok(sw.includes("WWZ_PWA_VERSION = '2.4.2'"),'PWA version updated');
console.log('WWZ Event Desk 2.0 wiring: 16 assertions passed');
