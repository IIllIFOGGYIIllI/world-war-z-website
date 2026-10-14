const fs = require('fs');
const assert = require('assert');
const load = file => fs.readFileSync(file,'utf8');
const common=load('assets/js/world-branding.js');
const home=load('index.html');
const dash=load('dashboard.html');
const rules=load('rules.html');
const world=load('assets/js/dashboard/world-manager.js');
const sw=load('sw.js');
assert(common.includes('/api/world/branding'));
assert(common.includes("primary.status !== 'active'"));
assert(common.includes('textContent') && !common.includes('innerHTML'));
assert(home.includes('data-wwz-primary-world') && home.includes('data-wwz-network-worlds'));
assert(dash.includes('data-world-branding-card') && dash.includes('world-branding.js?v=1.22.93&rev=world-branding-212'));
assert(rules.includes('data-wwz-rules-worlds'));
assert(world.includes('payload.world_branding'));
assert(sw.includes("WWZ_PWA_VERSION = '2.19.0'"));
console.log('World branding frontend checks passed');
const vm = require('vm');
(async () => {
  const elements = {
    '[data-wwz-primary-world]': [{textContent:'Chernarus'}],
    '[data-wwz-network-worlds]': [{textContent:'Chernarus + Livonia'}],
    '[data-wwz-rules-worlds]': [{textContent:'Chernarus and Livonia keep separate published rulesets.'}]
  };
  let current = 'chernarus';
  const names = {chernarus:'Chernarus',badlands:'Badlands'};
  const context = {
    document: {readyState:'loading',addEventListener:()=>{},querySelectorAll:(selector)=>elements[selector]||[],dispatchEvent:()=>{}},
    window:{},CustomEvent:class {constructor(name,args){this.name=name;this.detail=args.detail;}},
    fetch:async()=>({ok:true,json:async()=>({primary:{map_key:current,world_name:names[current],primary:true,status:'active'},servers:[{map_key:'livonia',world_name:'Livonia',status:'active'}]})})
  };
  vm.runInNewContext(common,context);
  await context.window.WWZWorldBranding.refresh();
  assert.equal(elements['[data-wwz-primary-world]'][0].textContent,'Chernarus');
  current = 'badlands';
  await context.window.WWZWorldBranding.refresh();
  assert.equal(elements['[data-wwz-primary-world]'][0].textContent,'Badlands');
  assert.equal(elements['[data-wwz-network-worlds]'][0].textContent,'Badlands + Livonia');
  console.log('Simulated active-world switch passed');
})().catch(error => {console.error(error);process.exitCode=1;});
