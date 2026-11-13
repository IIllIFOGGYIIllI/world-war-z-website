'use strict';
// V3.22: visible player copy should explain actions, not internal protocol names.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const html=read('dashboard.html');
const home=read('index.html');
const companion=read('companion.html');
const publicShop=read('shop.html');
const account=read('assets/js/dashboard/account.js');
const alts=read('assets/js/dashboard/linked-psn-v320.js');
const dashboardShop=read('assets/js/dashboard/shop.js');
const memberShop=read('assets/js/pages/shop.js');
const sw=read('sw.js');
const e='data-view-panel="linked-psns" hidden=""';
const start=html.indexOf(e);
const end=html.indexOf('data-view-panel="players" hidden=""',start);
assert(start>=0 && end>start, 'Member PSN panel exists');
const section=html.slice(start,end);
for(const needle of [
 'Linked PlayStation Accounts',
 'join the selected Nasdara server',
 'confirm it automatically when you join',
 'balances stay unchanged',
]){
  // A change to the player flow needs a copy review as well as functional tests.
  assert(section.toLowerCase().includes(needle.toLowerCase()), 'Missing member copy: '+needle);
}
for(const term of ['ADM','RCON','Central Economy','cfgspawnabletypes.xml','OAuth']){
  assert(!section.includes(term), 'Member PSN panel exposes internal term '+term);
}
assert(html.includes('Calculated from recorded server sessions'));
assert(html.includes('Waiting for player locations'));
assert(html.includes('World War Z server services'));
assert(html.includes('Checking the server status'));
assert(!home.includes('ADM logs'));
assert(home.includes('player activity records'));
assert(companion.includes('Download Android App'));
assert(companion.includes('Android installation file'));
assert(!companion.includes('Railway backend'));
assert(publicShop.includes('Checking the next server restart'));
assert(account.includes('World War Z connected'));
assert(!account.includes('Bot API connected'));
assert(alts.includes('confirmed and linked successfully'));
assert(!alts.includes('Creating your live PSN verification request'));
for(const s of [memberShop,dashboardShop])assert(!s.includes('messages.xml + ADM'));
assert(sw.includes('2026-11-14-getting-started-v323-1'));
assert(html.includes('data-psn-alt-form'));
assert(html.includes('data-psn-alt-list'));
console.log('PASS: V3.22 public DayZ account, server, shop and Companion copy is clear and routes preserved');
