'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
class Element {
  constructor(tag) { this.tagName = tag; this.children = []; this.listeners = {}; this.value = ''; this.textContent = ''; this.className = ''; this.attributes = {}; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = [...nodes]; }
  setAttribute(name, value) { this.attributes[name] = value; }
  addEventListener(name, fn) { this.listeners[name] = fn; }
  querySelector(tag) { if (this.tagName === tag) return this; for (const child of this.children) { const found = child.querySelector(tag); if (found) return found; } return null; }
  all(tag) { return [...(this.tagName === tag ? [this] : []), ...this.children.flatMap(child => child.all(tag))]; }
  fire(name) { this.listeners[name]?.(); }
  reportValidity() { return false; }
}
const window = {};
vm.runInNewContext(fs.readFileSync('assets/js/core/cart-deliveries.js', 'utf8'), {window, document: {createElement: tag => new Element(tag)}}, {filename:'cart-deliveries.js'});
const host = new Element('main');
const entries = [
 {line:{quantity:5},item:{item_id:1,name:'M4 Magazines'}},
 {line:{quantity:2},item:{item_id:2,name:'Bandages'}}
];
const plan = window.WWZCartDeliveries.create({host,entries,locations:[{location_id:44,name:'Base',x:1200,z:3400}],worldSize:15360});
const defaultLocation = {x:5000,y:0,z:6000,rotation:0};
assert.equal(plan.lines(defaultLocation).map(x=>x.quantity).join(','),'5,2');
let splitButton=host.all('button').find(b=>b.textContent==='Split to another location');
assert.ok(splitButton);
splitButton.fire('click');
assert.equal(plan.lines(defaultLocation).map(x=>x.quantity).join(','),'3,2,2');
// Choose saved destination for the second split line.
let select=host.all('select').find(x=>x.attributes['aria-label']==='M4 Magazines delivery 2 destination');
select.value='saved'; select.fire('change');
let saved=host.all('select').find(x=>x.attributes['aria-label']==='M4 Magazines saved delivery location');
saved.value='44'; saved.fire('change');
const savedLines=plan.lines(defaultLocation);
assert.equal(savedLines[1].delivery.location_id,44);
assert.equal(savedLines.reduce((a,x)=>a+(x.item_id===1?x.quantity:0),0),5);
// Set distinct custom coordinates for bandages.
select=host.all('select').find(x=>x.attributes['aria-label']==='Bandages delivery 1 destination');
select.value='custom'; select.fire('change');
const fields=host.all('input');
for (const [label,value] of [['X','1111'],['Y','5'],['Z','2222'],['Rotation','90']]) {
 const input=fields.find(x=>x.attributes['aria-label']===label);
 assert.ok(input,label); input.value=value; input.fire('input');
}
assert.equal(plan.lines(defaultLocation)[2].delivery.x,1111);
assert.equal(plan.lines(defaultLocation)[2].delivery.rotation,90);
assert.throws(()=>plan.lines(null),/Choose delivery coordinates/);
// Empty main coordinates can be omitted when all segments have independent points.
const fresh=window.WWZCartDeliveries.create({host:new Element('main'),entries:[entries[0]],locations:[],worldSize:15360});
assert.throws(()=>fresh.lines(null),/Choose delivery coordinates/);
console.log('PASS: shared, split quantities, saved destination, custom destination, validation');
