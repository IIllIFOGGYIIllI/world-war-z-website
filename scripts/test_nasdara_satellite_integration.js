/* Nasdara unified satellite map regression, no paper map routes or fallback. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('assets/js/map/wwz-map.js','utf8'),context={window:{},document:{}};
vm.runInNewContext(source,context,{filename:'wwz-map.js'});
const m=context.window.WWZMap,c=m.getConfig('badlands');
assert.equal(c.mapMetres,16384);
assert.match(c.satelliteImageUrl,/assets\/maps\/nasdara\/satellite\.webp/);
assert.match(c.roadBinaryUrl,/assets\/maps\/nasdara\/roads\.bin/);
assert.match(c.structureUrl,/assets\/maps\/nasdara\/objects\.bin/);
assert.match(c.labelUrl,/assets\/maps\/nasdara\/labels\.json/);
assert(!source.includes('paperUrl')&&!source.includes('paperGrid'));
const style=fs.readFileSync('assets/css/components/wwz-map.css','utf8');
const lazy=fs.readFileSync('assets/js/dashboard/lazy-assets.js','utf8');
// The previous imageOverlay used Leaflet overlayPane (400) and hid native
// roads (350/360) and buildings (325). The satellite must sit at tilePane (200).
assert(source.includes("pane:'tilePane'"),'Satellite must be under geometry overlays');
assert(source.includes("casingPane.style.zIndex = '350'"));
assert(source.includes("surfacePane.style.zIndex = '360'"));
assert(source.includes("pane.style.zIndex='325'")||fs.readFileSync('assets/js/map/nasdara-structures.js','utf8').includes("pane.style.zIndex='325'"));
assert(source.includes('metersPerPixel=MAP_METRES/(MAP_UNITS*Math.pow(2,map.getZoom()))'),'Scale must use game metres');
assert(source.includes("layerPanel.classList.add('wwz-nasdara-layers-panel')"));
assert(source.includes("buildings.dataset.wwzBuildings='true'"));
assert(source.includes("button.matches('[data-map-road-group=\"gravel\"], [data-map-trail-toggle]')"));
assert(style.includes('.wwz-badlands-map .wwz-map-place-name-native{')&&style.includes('color:#fff5d9!important'));
assert(style.includes('.wwz-map-ground-scale{'));
assert(lazy.includes('nasdara-roof-art-2'),'Map assets must be cache-busted');

const p=m.worldToLeaflet([10450,10634],'badlands');
const back=m.leafletToWorld({lat:p[0],lng:p[1]},'badlands');
assert(Math.abs(back.x-10450)<.001&&Math.abs(back.z-10634)<.001);
assert.deepEqual(Object.keys(c.roadStyles).sort(),['nasdara_dirt','nasdara_paved']);
const labels=JSON.parse(fs.readFileSync('assets/maps/nasdara/labels.json','utf8'));
assert.equal(labels.labelCount,78);
assert(labels.labels.every(l=>l.approximate===true),'Approximate grid labels must not claim GPS precision');
const shop=fs.readFileSync('assets/js/pages/shop.js','utf8'),
  mapLink=fs.readFileSync('assets/js/pages/map-link.js','utf8'),
  legacy=fs.readFileSync('nasdara/index.html','utf8');
assert(shop.includes("new URL('map-link.html', location.href)"));
assert(shop.includes("url.searchParams.set('rental_picker', '1')"));
assert(mapLink.includes('wwz:nasdara-rental-coordinate'));
assert(legacy.includes("location.replace(url.href)"));
assert(!legacy.includes('Nasdara_Enhanced_Paper_Map.webp'));
for(const world of ['chernarus','livonia']){
 const config=m.getConfig(world);assert(config.satelliteUrl&&config.roadUrl);
 assert(!config.structureUrl);
}
console.log('PASS Nasdara satellite integration, coordinates, labels, rental handoff, legacy links, two-world isolation');
