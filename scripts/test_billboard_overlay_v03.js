/* V0.3 existing-billboard overlay. Test geometry without creating props. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const api=require('../assets/js/tools/signboard-studio.js');
const html=fs.readFileSync('tools/signboard-studio.html','utf8');
const css=fs.readFileSync('assets/css/tools/signboard-studio.css','utf8');
const grid=[['R','W','G'],['K','Y','O']];
const base={x:1000,y:150,z:2000,yaw:0,pitch:-90,roll:0,scale:.5,spacing:1};
const normal=api.toSpawner(grid,base);
const off=api.toSpawner(grid,{...base,billboardOverlay:true,lateralOffset:.3,verticalOffset:.5,faceOffset:.12});
assert.equal(normal.Objects.length,6);
assert.equal(off.Objects.length,6);
assert.deepEqual(Object.keys(off.Objects[0]),['name','pos','ypr','scale']);
for(let i=0;i<6;i++){
  assert.equal(off.Objects[i].pos[0],Number((normal.Objects[i].pos[0]+.3).toFixed(6)));
  assert.equal(off.Objects[i].pos[1],Number((normal.Objects[i].pos[1]+.5).toFixed(6)));
  assert.equal(off.Objects[i].pos[2],Number((normal.Objects[i].pos[2]+.12).toFixed(6)));
  assert.equal(off.Objects[i].name,normal.Objects[i].name);
}
const rotate=api.toSpawner(grid,{...base,yaw:90,billboardOverlay:true,lateralOffset:.3,verticalOffset:0,faceOffset:.12});
const normal90=api.toSpawner(grid,{...base,yaw:90});
for(let i=0;i<6;i++){
  assert.ok(Math.abs(rotate.Objects[i].pos[0]-normal90.Objects[i].pos[0]-.12)<2e-6);
  assert.ok(Math.abs(rotate.Objects[i].pos[2]-normal90.Objects[i].pos[2]+.3)<2e-6);
}
assert.deepEqual(api.toSpawner(grid,{...base,billboardOverlay:false,lateralOffset:5,verticalOffset:5,faceOffset:3}),normal);
assert.throws(()=>api.toSpawner(grid,{...base,billboardOverlay:true,lateralOffset:''}),/required/);
assert.throws(()=>api.toSpawner(grid,{...base,billboardOverlay:true,verticalOffset:6,lateralOffset:0,faceOffset:0}),/offset/);
assert.throws(()=>api.toSpawner(grid,{...base,billboardOverlay:true,faceOffset:'NaN',verticalOffset:0,lateralOffset:0}),/offset/);
for(const token of ['name="billboardOverlay"','name="lateralOffset"','name="verticalOffset"',
  'name="faceOffset"','data-billboard-fields','id="studio-billboard-note"']){
  assert.ok(html.includes(token),'Missing billboard alignment input: '+token);
}
assert.match(html, /billboard itself is not exported/i);
assert.ok(css.includes('.billboard-options'));
assert.ok(!html.includes('name="postScale"'),'No uncalibrated support models in production');
console.log('PASS: existing billboard overlay local-axis alignment, rotations, guards, no added objects');
