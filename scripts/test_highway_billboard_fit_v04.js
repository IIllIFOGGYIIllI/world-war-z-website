/* Highway Billboard — Side A: measured corners and local-face fit. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const api=require('../assets/js/tools/signboard-studio.js');
const html=fs.readFileSync('tools/signboard-studio.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const c=api.HIGHWAY_SIDE_A;
const grid=api.textMatrix({preset:'custom',width:88,height:44,
  title:'BLACK MARKET',subtitle:'BUY SELL TRADE',background:'K',titleColour:'W',
  subtitleColour:'O',borderColour:'R',border:true,arrow:'none'});
assert.equal(grid.length,c.height);
assert.equal(grid[0].length,c.width);
const opts={x:c.referenceCenter[0],y:c.referenceCenter[1],z:c.referenceCenter[2],
  yaw:0,pitch:-89.03,roll:55.56,scale:.85,spacing:1,highwayFit:true,highwayClearance:.12};
const a=api.toSpawner(grid,opts);
assert.equal(a.Objects.length,3872);
assert.deepEqual(Object.keys(a),['Objects']);
assert.deepEqual(Object.keys(a.Objects[0]),['name','pos','ypr','scale']);
assert.deepEqual(a.Objects[0].ypr,[0,-89.03,55.56]);
assert.ok(a.Objects.every(o=>o.scale===.85&&o.name.startsWith('Armband_')));
const faceW=Math.hypot(...c.topRight.map((v,i)=>v-c.topLeft[i]));
const faceH=Math.hypot(...c.bottomLeft.map((v,i)=>v-c.topLeft[i]));
assert.ok(faceW>7.85&&faceW<7.90);
assert.ok(faceH>3.90&&faceH<3.94);
const horizontal=(faceW-2*c.insetHorizontal)/c.width;
const vertical=(faceH-2*c.insetVertical)/c.height;
assert.ok(Math.abs(horizontal-.097*c.scale)<.0005,'horizontal spacing should match armband size');
assert.ok(Math.abs(vertical-.097*c.scale)<.0005,'vertical spacing should match armband size');
const avg=(positions)=>positions.reduce((sum,p)=>sum+p,0)/positions.length;
const mean=[0,1,2].map(i=>avg(a.Objects.map(o=>o.pos[i])));
const norm=(()=>{
  const right=c.topRight.map((v,i)=>v-c.topLeft[i]);
  const down=c.bottomLeft.map((v,i)=>v-c.topLeft[i]);
  const n=[right[1]*down[2]-right[2]*down[1],
           right[2]*down[0]-right[0]*down[2],
           right[0]*down[1]-right[1]*down[0]];
  const len=Math.hypot(...n);return n.map(v=>v/len);
})();
for(let i=0;i<3;i++)assert.ok(Math.abs(mean[i]-(c.referenceCenter[i]+.12*norm[i]))<.02);
assert.ok(norm[0]<0&&norm[2]<0,'normal should face the surveyed camera side');
assert.ok(a.Objects[0].pos[1]>a.Objects[a.Objects.length-1].pos[1]);
const moved=api.toSpawner(grid,{...opts,x:opts.x+.25,y:opts.y+.1,z:opts.z-.2}).Objects;
for(let i=0;i<a.Objects.length;i++){
  const p=a.Objects[i].pos,q=moved[i].pos;
  assert.ok(Math.abs((q[0]-p[0])-.25)<.000002);
  assert.ok(Math.abs((q[1]-p[1])-.1)<.000002);
  assert.ok(Math.abs((q[2]-p[2])+.2)<.000002);
}
const flipped=api.toSpawner(grid,{...opts,mirror:true}).Objects;
assert.ok(Math.hypot(...a.Objects[0].pos.map((p,i)=>p-flipped[0].pos[i]))>7);
assert.deepEqual(flipped[0].ypr,a.Objects[0].ypr);
assert.throws(()=>api.toSpawner(grid,{...opts,scale:.5}),/scale 0.85/);
assert.throws(()=>api.toSpawner(grid,{...opts,highwayClearance:2}),/clearance/);
assert.throws(()=>api.toSpawner(grid.slice(0,40),opts),/88 × 44/);
assert.ok(html.includes('id="studio-highway-auto-fit"'));
assert.ok(html.includes('name="highwayFit"'));
assert.ok(html.includes('name="highwayClearance"'));
assert.ok(html.includes('Highway Billboard — Side A'));
assert.match(sw, /const WWZ_PWA_UPDATE_REVISION = '[^']+';/);
console.log('PASS: fitted 3872-armband face, 0.85 scale, surveyed plane, outward offset, mirror and guards');
