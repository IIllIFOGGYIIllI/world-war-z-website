'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const src = fs.readFileSync('assets/js/dashboard/server-context.js', 'utf8');
const storage = new Map();
const context = {
  document: { querySelector: () => null, querySelectorAll: () => [], body: {classList:{toggle(){}}} },
  window: { clearTimeout(){}, setTimeout(){return 1}, dispatchEvent(){} },
  location: { search: '', reload(){} },
  sessionStorage: {setItem(k,v){storage.set(k,v)}, getItem(k){return storage.get(k) || null}, removeItem(k){storage.delete(k)}},
  URLSearchParams,
  CustomEvent: class {constructor(type,obj){this.type=type;this.detail=obj?.detail}},
};
vm.createContext(context);vm.runInContext(src,context);
const app = context.window.WWZServerContext;
function server(key, mode) { return {key, name:`World War Z | Nasdara ${mode.toUpperCase()}`,map_key:'badlands',map_name:'Nasdara',gameplay_mode:mode,player_capacity:26}; }
assert.equal(app.selectServer(server('wwz-pve','pve'),{restored:true}), true);
assert.equal(app.getSelectedServer().selector_label,'PvE');
assert.equal(app.getSelectedServer().key,'wwz-pve');
assert.equal(app.selectServer(server('wwz-pvp','pvp'),{restored:true}), true);
assert.equal(app.getSelectedServer().selector_label,'PvP');
assert.equal(app.getSelectedServer().key,'wwz-pvp');
assert.equal(app.selectServer({...server('wwz-livonia','pvp'),map_key:'livonia'}, {restored:true}),false);
assert.equal(app.getSelectedServer().key,'wwz-pvp');
assert.equal(app.getMapKey(),'badlands');
console.log('PASS: distinct PvE/PvP selector labels, keys, invalid old world rejection');
