/* WWZ Portable Billboard V0.5: preserve surveyed Side A fit while moving whole rig. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const studio=require('../assets/js/tools/signboard-studio.js');
const portable=require('../assets/js/tools/portable-billboard.js');
const html=fs.readFileSync('tools/signboard-studio.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const origin=portable.REFERENCE;
assert.equal(origin.model,'StaticObj_Billboard_Highway_Blank');
assert.deepEqual(origin.pivot,[11220.515,172.661,11103.675]);
assert.equal(origin.yaw,72);
const palette=['K','W','R','G','B','O','Y','P'];
const testGrid=(q)=>Array.from({length:q.height},(_,row)=>
  Array.from({length:q.width},(_,col)=>palette[(row+col)%palette.length]));
for(const [name,q] of Object.entries(portable.QUALITY)){
  const grid=testGrid(q);
  const coords={frameX:origin.pivot[0],frameY:origin.pivot[1],
    frameZ:origin.pivot[2],frameYaw:72,highwayQuality:name,highwayClearance:.12};
  const complete=portable.generate(grid,{...coords,includeBillboard:true});
  assert.equal(complete.Objects.length,q.width*q.height+1);
  const first=complete.Objects[0];
  assert.equal(first.name,origin.model);
  assert.deepEqual(first.pos,origin.pivot);
  assert.deepEqual(first.ypr,[72,0,0]);
  assert.equal(first.scale,1);
  const art=complete.Objects.slice(1);
  const reference=studio.highwayFitGrid(grid,{
    x:studio.HIGHWAY_SIDE_A.referenceCenter[0],
    y:studio.HIGHWAY_SIDE_A.referenceCenter[1],
    z:studio.HIGHWAY_SIDE_A.referenceCenter[2],
    yaw:0,pitch:-89.03,roll:55.56,scale:q.scale,spacing:1,
    highwayQuality:name,highwayClearance:.12}).Objects;
  assert.equal(art.length,reference.length);
  for(let i=0;i<art.length;i++){
    assert.deepEqual(art[i],reference[i],name+' origin geometry differs at '+i);
  }
  const noFrame=portable.generate(grid,{...coords,includeBillboard:false});
  assert.equal(noFrame.Objects.length,q.width*q.height);
  assert.ok(noFrame.Objects.every(o=>o.name.startsWith('Armband_')));
}
const q=portable.QUALITY.full,grid=testGrid(q);
const base={frameX:origin.pivot[0],frameY:origin.pivot[1],
  frameZ:origin.pivot[2],frameYaw:origin.yaw,highwayQuality:'full',
  highwayClearance:.12,includeBillboard:true};
const ref=portable.generate(grid,base).Objects;
const shifted=portable.generate(grid,{...base,frameX:origin.pivot[0]+25,
  frameY:origin.pivot[1]+4,frameZ:origin.pivot[2]-37}).Objects;
assert.deepEqual(shifted[0].pos,[origin.pivot[0]+25,origin.pivot[1]+4,origin.pivot[2]-37]);
for(const idx of [1,88,238,2500,3872]){
  const a=ref[idx],b=shifted[idx];
  for(let k=0;k<3;k++)
    assert.ok(Math.abs((b.pos[k]-a.pos[k])-[25,4,-37][k])<.000002);
  assert.deepEqual(b.ypr,a.ypr);
}
const turn=portable.generate(grid,{...base,frameYaw:origin.yaw+90}).Objects;
const ar=ref[12].pos,br=turn[12].pos,pivot=origin.pivot;
assert.ok(Math.abs(br[0]-(pivot[0]+(ar[2]-pivot[2])))<.000002);
assert.ok(Math.abs(br[2]-(pivot[2]-(ar[0]-pivot[0])))<.000002);
assert.deepEqual(turn[0].ypr,[162,0,0]);
assert.deepEqual(turn[12].ypr,[90,-89.03,55.56]);
const reverse=portable.generate(grid,{...base,frameYaw:origin.yaw-180}).Objects;
assert.deepEqual(reverse[0].ypr,[-108,0,0]);
assert.ok(reverse[250].pos.every(Number.isFinite));
for(const settings of [{...base,frameX:''},{...base,frameYaw:'NaN'},
  {...base,highwayQuality:'wrong'},{...base,highwayClearance:4}])
  assert.throws(()=>portable.generate(grid,settings));
assert.throws(()=>portable.generate(grid.slice(1),base),/resolution/);
for(const x of ['studio-portable-apply','studio-save-settings','studio-load-settings',
  'name="portableBillboard"','name="includeBillboard"','name="frameYaw"',
  'name="highwayQuality"','data-portable-fields']){
  assert.ok(html.includes(x),'Missing portable UI '+x);
}
assert.ok(html.includes('billboard model pivot')||html.includes('BILLBOARD MODEL PIVOT'));
assert.ok(html.includes('Side B is not calibrated'));
assert.ok(sw.includes("2026-11-12-portable-highway-v05-1"));
assert.ok(sw.includes('./assets/js/tools/portable-billboard.js?v=0.5.0&rev=portable-billboard-1'));
const script=fs.readFileSync('assets/js/tools/portable-billboard.js','utf8');
assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage/.test(script));
console.log('PASS: portable billboard model+artwork, 4 detail tiers, translation, rotation and export guards');
