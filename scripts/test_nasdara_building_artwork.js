// Regression for the real Nasdara roof-picture atlas and browser renderer.
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const folder='assets/maps/nasdara/';
const binary=fs.readFileSync(folder+'objects.bin');
const classes=JSON.parse(fs.readFileSync(folder+'object-classes.json','utf8'));
const atlas=JSON.parse(fs.readFileSync(folder+'building-atlas.json','utf8'));
const code=fs.readFileSync('assets/js/map/nasdara-structures.js','utf8');
const main=fs.readFileSync('assets/js/map/wwz-map.js','utf8');
assert.equal(atlas.count,1694);
assert.equal(classes.length,1697);
assert.equal(atlas.sprites['0'][3],195);
assert.equal(atlas.sprites['0'][4],308);
assert(main.includes("structureAtlasUrl: 'assets/maps/nasdara/building-atlas.json"));
assert(main.includes("map.getZoom()<3.1"));
assert(main.includes("setStructuresVisible: visible =>"));
let fallbackPaints=0,picturesDrawn=0;
const ctx={setTransform(){},clearRect(){},transform(){},beginPath(){},moveTo(){},lineTo(){},
  closePath(){},fill(){fallbackPaints++;},stroke(){},drawImage(){picturesDrawn++;},save(){},restore(){}};
const canvas={style:{},width:0,height:0,getContext:()=>ctx};
const events=new Map(),statuses=[];
class FakeImage{
  set src(value){
    this.url=value;
    // The browser loads local sprite pages asynchronously.
    setImmediate(()=>this.onload?.());
  }
}
const window={
  devicePixelRatio:1,
  L:{DomUtil:{create:()=>canvas,setPosition(){}}},
  requestAnimationFrame:callback=>setImmediate(callback),
  cancelAnimationFrame:handle=>clearImmediate(handle)
};
const fetch=async url=>({
  ok:true,
  arrayBuffer:async()=>binary.buffer.slice(binary.byteOffset,binary.byteOffset+binary.byteLength),
  json:async()=>url.includes('object-classes')?classes:atlas
});
vm.runInNewContext(code,{window,fetch,Image:FakeImage,console},{filename:'nasdara-structures.js'});
const source=window.WWZNasdaraStructures.parse(
  binary.buffer.slice(binary.byteOffset,binary.byteOffset+binary.byteLength),classes,atlas);
assert.equal(source.valid,295195);
assert.equal(source.models[0].name,'Land_Airfield_Hangar_Desert');
assert.equal(source.models[0].sprite[3],195);
assert(source.models[0].top[1]<0,'Top-down artwork requires original model orientation');
const unit=240/16384*Math.pow(2,6);
const map={
  createPane(){return {style:{},remove(){}}},
  getZoom(){return 6;},
  getSize(){return {x:800,y:650};},
  containerPointToLayerPoint(){return {x:0,y:0};},
  latLngToContainerPoint(){return {x:400-8500*unit,y:325+7000*unit};},
  on(key,callback){events.set(key,callback)},
  off(key){events.delete(key)}
};
const controller=window.WWZNasdaraStructures.attach(map,{
  mapUnits:240,structureUrl:folder+'objects.bin',structureClassUrl:folder+'object-classes.json',
  structureAtlasUrl:folder+'building-atlas.json',
  onStructureStatus:value=>statuses.push(value)
});
// The 295k native objects are parsed in a promise and pictures load on
// requestAnimationFrame. On slower CI, a single fixed timer can run before
// the pending animation frame even when the renderer is working correctly.
let attempts=0;
const check=()=>{
  const status=controller.getStatus();
  if((!status.loaded||status.drawn<=100||status.detailed<=100||picturesDrawn<=100)&&attempts++<80){
    setTimeout(check,100);
    return;
  }
  assert(status.loaded,'Building data did not load: '+String(status.error));
  assert.equal(status.placements,295195);
  assert(status.drawn>100,'Native buildings not visible at zoom 6: '+JSON.stringify(status));
  assert(status.detailed>100,'Top-down roof artwork not rendered: '+JSON.stringify(status));
  assert(picturesDrawn>100,'Atlas pictures were not drawn');
  controller.setVisible(false);
  assert.equal(controller.getVisible(),false);
  controller.destroy();
  assert.equal(events.size,0,'Renderer leaked event handlers');
  console.log('PASS authentic 1694 building pictures, source transforms, canvas draw and visibility');
};
setTimeout(check,100);
