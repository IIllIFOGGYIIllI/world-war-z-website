/* WWZ marker icon-pack and persistence wiring regression. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const icons=['vehicle-repair','mechanic-garage','vehicle-rental','tow-service',
 'fuel-station','vehicle-parts','trader','builder-shed','medical','police',
 'fire-station','water-tower','radio-building'];
const mapSrc=fs.readFileSync('assets/js/map/wwz-map.js','utf8');
const ctx={window:{},document:{}};
vm.runInNewContext(mapSrc,ctx,{filename:'wwz-map.js'});
const api=ctx.window.WWZMap;
assert.equal(api.markerIconOptions.length,14);
assert.equal(api.markerIconOptions[0].id,'default');
assert.equal(api.normaliseMarkerIcon('../malicious.svg'),'default');
assert.equal(api.normaliseMarkerIcon('unknown'),'default');
assert.equal(api.markerIconUrl('unknown'),null);
for(const id of icons){
 assert.equal(api.normaliseMarkerIcon(id),id);
 assert.equal(api.markerIconUrl(id),'assets/map-icons/'+id+'.svg');
 const source=fs.readFileSync('assets/map-icons/'+id+'.svg','utf8');
 assert.match(source,/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
 assert(source.includes('<title>')&&source.includes('viewBox="0 0 64 80"'));
 assert(!source.includes('<script')&&!source.includes('href="http'));
}
const dashboard=fs.readFileSync('dashboard.html','utf8'),
 loader=fs.readFileSync('assets/js/pages/dashboard-map-loader.js','utf8'),
 publicMap=fs.readFileSync('assets/js/pages/map-link.js','utf8');
assert(dashboard.includes('data-map-custom-icon'));
assert(dashboard.includes('data-map-custom-icon-preview'));
for(const id of icons)assert(dashboard.includes('<option value="'+id+'">'));
assert(loader.includes('icon: customIcon?.value'),'Editor must submit chosen icon');
assert(loader.includes('icon: markerIcon(poi.icon)'),'Public JSON must send validated icon');
assert(loader.includes('icon, x, z, visibility: \'private-browser\''),'Private marker must persist icon');
assert(loader.includes('const icon = markerIcon(rawPoi?.icon)'),'Existing markers must restore icon');
assert(loader.includes('if(customIcon)customIcon.value=markerIcon(poi?.icon)'),'Editor must restore icon');
assert(mapSrc.includes('icon: poi?.icon'),'Renderer must use persisted icon');
assert(mapSrc.includes('imageUrl = markerIconUrl(icon)'));
assert(publicMap.includes('icon:window.WWZMap.normaliseMarkerIcon(raw?.icon)'),'Public map must preserve API icon');
console.log('PASS: 13 WWZ vector icon assets, legacy fallback, private/public icon round-trip and map rendering');
