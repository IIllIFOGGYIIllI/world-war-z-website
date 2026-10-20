'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/js/dashboard/server-context.js','utf8');
const html = fs.readFileSync('dashboard.html','utf8');
function contextFor(storedKey) {
  const storage = new Map();
  if (storedKey) storage.set('wwz_dashboard_server', JSON.stringify({ key: storedKey, map_key: 'badlands', gameplay_mode: storedKey.includes('pvp') ? 'pvp':'pve' }));
  const imgs = [{ src: '', alt:'' }, { src:'',alt:'' }];
  const document = {
    body: { dataset:{}, classList:{ toggle(key,v){ this[key] = v; } } },
    querySelector(){return null;},
    querySelectorAll(s){return s==='[data-wwz-selected-server-logo]' ? imgs : [];}
  };
  const c = {
    document, location:{ search:'', reload(){} },
    window:{clearTimeout(){},setTimeout(){return 1;},dispatchEvent(){}},
    sessionStorage:{getItem(k){return storage.get(k)||null;},setItem(k,v){storage.set(k,v);},removeItem(k){storage.delete(k);}},
    URLSearchParams, CustomEvent:class{constructor(t,p){this.type=t;this.detail=p?.detail;}}
  };
  vm.createContext(c);vm.runInContext(source,c);
  return { app:c.window.WWZServerContext, imgs, document };
}
const pve={key:'world-war-z',name:'World War Z | Nasdara PvE',map_key:'badlands',gameplay_mode:'pve',access_level:'owner'};
const pvp={key:'nasdara-pvp',name:'World War Z | Nasdara PvP',map_key:'badlands',gameplay_mode:'pvp',access_level:'owner'};
const payload={servers:[pve,pvp]};
let x=contextFor('nasdara-pvp');
x.app.handleAuthenticated(payload,{requireSelection:true});
assert.equal(x.app.getSelectedServer().key,'nasdara-pvp','PvP selection must survive OAuth callback');
assert.equal(x.document.body.classList['dashboard-ready'],true,'PvP dashboard must be shown');
assert(x.imgs.every(img=>img.src.includes('nasdara-pvp.webp')),'logo reflects PvP identity');
x=contextFor('world-war-z');
x.app.handleAuthenticated(payload,{requireSelection:true});
assert.equal(x.app.getSelectedServer().key,'world-war-z','PvE must still restore');
assert(x.imgs.every(img=>img.src.includes('nasdara-pve.webp')),'logo reflects PvE');
x=contextFor('nasdara-pvp');
x.app.handleAuthenticated({servers:[pve]},{requireSelection:true});
assert.equal(x.app.getSelectedServer(),null,'previous account PvP key cannot bypass Discord eligibility');
assert.equal(x.document.body.classList['dashboard-gated'],true,'ineligible PvP remains gated');
assert.match(source,/\['DayZ World', server\.map_name\]/);
assert.match(source,/\['Your Access', server\.access_level/);
assert.match(html,/data-wwz-selected-server-logo/);
assert.match(html,/class="service-context-icon"><img/);
assert.match(fs.readFileSync('assets/js/dashboard/account.js', 'utf8'), /response.status === 403/);
assert.match(fs.readFileSync('sw.js','utf8'), /nasdara-5-auth-isolation/);
console.log('PASS: PvP OAuth restore, PvE regression, cross-guild safety, server branding and labels');
