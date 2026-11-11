/* WWZ Signboard Studio v0.2 — verify preview, palette and DayZ Editor export. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const studio=require('../assets/js/tools/signboard-studio.js');
const html=read('tools/signboard-studio.html');
const css=read('assets/css/tools/signboard-studio.css');
const script=read('assets/js/tools/signboard-studio.js');
const dash=read('dashboard.html');
const calib=read('tools/armband-calibration.html');
const sw=read('sw.js');
assert.equal(Object.keys(studio.PALETTE).length,8);
for(const item of Object.values(studio.PALETTE))assert.match(item.cls,/^Armband_/);
assert.deepEqual(studio.dimensions('standard'),{width:80,height:30,count:2400});
assert.deepEqual(studio.dimensions('medium'),{width:96,height:36,count:3456});
assert.deepEqual(studio.dimensions('custom',40,18),{width:40,height:18,count:720});
assert.throws(()=>studio.dimensions('custom',4,2));
assert.throws(()=>studio.dimensions('unapproved'));
const options={preset:'standard',title:'BLACK MARKET',subtitle:'BUY SELL TRADE',
 background:'K',titleColour:'W',subtitleColour:'O',borderColour:'R',border:true,arrow:'none'};
const grid=studio.textMatrix(options);
assert.equal(grid.length,30);
assert.equal(grid[0].length,80);
assert.equal(grid[0][0],'R');
assert.equal(grid[29][79],'R');
assert.ok(grid.flat().includes('W')&&grid.flat().includes('O'));
assert.ok(grid.flat().includes('K'));
assert.ok(grid.flat().every(key=>studio.PALETTE[key]));
assert.throws(()=>studio.textMatrix({...options,title:'A'.repeat(95)}),/too long/i);
assert.throws(()=>studio.textMatrix({...options,preset:'stump'}),/too long|cannot fit/i);
const arrow=studio.textMatrix({...options,preset:'medium',arrow:'right'});
assert.equal(arrow.length,36);
assert.ok(arrow.every(row=>row.length===96));
const p={x:14828.189,y:205.4,z:13253.759,yaw:0,pitch:-90,roll:0,scale:.5,spacing:1,mirror:false};
const out=studio.toSpawner(grid,p),objects=out.Objects;
assert.equal(objects.length,2400);
assert.deepEqual(Object.keys(out),['Objects']);
assert.deepEqual(Object.keys(objects[0]),['name','pos','ypr','scale']);
assert.equal(objects[0].name,'Armband_Red');
assert.ok(Math.abs(objects[0].pos[0]-(p.x-39.5*.0485))<.000002);
assert.ok(Math.abs(objects[0].pos[1]-(p.y+14.5*.0485))<.000002);
assert.equal(objects[0].pos[2],p.z);
assert.deepEqual(objects[0].ypr,[0,-90,0]);
const mirrored=studio.toSpawner(grid,{...p,mirror:true}).Objects;
assert.ok(Math.abs(mirrored[0].pos[0]-(p.x+39.5*.0485))<.000002);
const rotated=studio.toSpawner(grid,{...p,yaw:90}).Objects;
assert.ok(Math.abs(rotated[0].pos[2]-(p.z+39.5*.0485))<.000002);
assert.throws(()=>studio.toSpawner(grid,{...p,x:''}),/required/);
assert.throws(()=>studio.toSpawner(grid,{...p,scale:0}),/Scale/);
assert.throws(()=>studio.toSpawner(grid,{...p,spacing:99}),/Spacing/);
assert.throws(()=>studio.toSpawner(Array.from({length:80},()=>Array(80).fill('K')),p),/export limit/);
const image=studio.quantize(new Uint8ClampedArray([
  213,62,70,255,49,153,85,255,23,25,30,255,231,232,234,255
]),2,2);
assert.deepEqual(image,[['R','G'],['K','W']]);
assert.throws(()=>studio.quantize(new Uint8Array([0,0,0]),2,2),/Invalid image/);
vm.runInNewContext(script,{module:{exports:{}},console},{filename:'signboard-studio.js'});
for(const token of ['id="studio-form"','id="studio-preview"','id="studio-export"',
  'id="studio-png"','id="studio-image"','data-studio-template="blackmarket"',
  'name="yaw"','name="pitch"','name="mirror"','name="preset"']){
  assert.ok(html.includes(token),'Missing UI: '+token);
}
assert.ok(html.includes('../assets/js/tools/signboard-studio.js?v=0.3.0&amp;rev=billboard-face-1'));
assert.ok(html.includes('../assets/css/tools/signboard-studio.css?v=0.3.0&amp;rev=billboard-face-1'));
assert.ok(dash.includes('href="tools/signboard-studio.html"'));
assert.ok(calib.includes('href="signboard-studio.html"'));
assert.ok(css.includes('image-rendering:pixelated'));
assert.match(sw, /const WWZ_PWA_UPDATE_REVISION = '[^']+';/, 'Missing PWA revision');
for(const f of ['tools/signboard-studio.html','assets/css/tools/signboard-studio.css?v=0.3.0&rev=billboard-face-1','assets/js/tools/signboard-studio.js?v=0.3.0&rev=billboard-face-1'])
  assert.ok(sw.includes('./'+f),'Uncached studio asset '+f);
assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage/.test(script),
  'No server writes, network or browser-side persistence');
assert.ok(!/nitrado\.|railway\./i.test(script));
assert.ok(!html.includes('https://')&&!html.includes('http://'));
console.log('PASS: pixel text, 8 armbands, image quantization, placement, limits, mirror, links and PWA');
