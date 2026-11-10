/* Static regression of DayZ object geometry exported by the calibration lab. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const api=require('../assets/js/tools/armband-calibration.js');
const html=fs.readFileSync('tools/armband-calibration.html','utf8');
const dash=fs.readFileSync('dashboard.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const p={x:14828.189,y:204,z:13253.759,yaw:0,pitch:-90,roll:0,scale:.5,spacing:1,mode:'orientation'};
const a=api.generate(p),b=api.generate({...p,yaw:90}),mirror=api.generate({...p,mirror:true});
assert.equal(a.Objects.length,49);
assert.equal(api.pattern('orientation').length,7);
assert.equal(Object.keys(api.CLASSES).length,8);
assert.equal(a.Objects[0].name,'Armband_Red');
assert.equal(a.Objects[6].name,'Armband_Green');
assert.equal(a.Objects[42].name,'Armband_Blue');
assert.equal(a.Objects[48].name,'Armband_Orange');
assert.equal(a.Objects[24].name,'Armband_Yellow');
assert.equal(a.Objects[0].pos[0],p.x-3*.0485);
assert.equal(a.Objects[24].pos[0],p.x);
assert.equal(a.Objects[24].pos[1],p.y);
assert.equal(a.Objects[24].pos[2],p.z);
assert.equal(a.Objects[0].pos[1],p.y+3*.0485);
assert.equal(b.Objects[0].pos[0],p.x);
assert.equal(b.Objects[0].pos[2],p.z+3*.0485);
assert.equal(mirror.Objects[0].pos[0],p.x+3*.0485);
assert.deepEqual(Object.keys(a.Objects[0]),['name','pos','ypr','scale']);
for(const obj of a.Objects){
  assert.ok(/^Armband_/.test(obj.name));
  assert.equal(obj.pos.length,3);assert.equal(obj.ypr.length,3);
  assert.ok(obj.pos.every(Number.isFinite));assert.ok(obj.ypr.every(Number.isFinite));
}
for(const config of [{...p,x:''},{...p,y:'NaN'},{...p,scale:0},{...p,spacing:0},{...p,yaw:'1e309'},{...p,mode:'bad'}]){
  assert.throws(()=>api.generate(config));
}
assert.ok(html.includes('id="calibration-form"')&&html.includes('id="calibration-preview"'));
assert.ok(html.includes('No Nitrado API calls')&&html.includes('local DayZ server first'));
assert.ok(html.includes('assets/js/tools/armband-calibration.js?v=0.1.0&amp;rev=nasdara-lab-1'));
assert.ok(dash.includes('href="tools/armband-calibration.html"'));
assert.ok(sw.includes('./tools/armband-calibration.html'));
assert.ok(sw.includes('./assets/js/tools/armband-calibration.js?v=0.1.0&rev=nasdara-lab-1'));
console.log('PASS: 49-item DayZ object spawner JSON calibration, orientation, mirroring and safe local-only export');
