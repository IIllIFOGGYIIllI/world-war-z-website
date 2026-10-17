/* Badlands public preview / world-context regression. */
'use strict';
const fs=require('fs');const assert=require('assert');const path=require('path');
const root=path.resolve(__dirname,'..');const get=p=>fs.readFileSync(path.join(root,p),'utf8');
const pages=['index.html','dashboard.html','shop.html','map-link.html','flags.html','rules.html','donations.html','companion.html','404.html','nasdara/index.html'];
for(const page of pages){const s=get(page);assert(s.includes('property="og:image"'),page+' no og:image');assert(s.includes('Nasdara_Original_Paper_Map.jpg?preview=badlands-v1'),page+' old image');assert(s.includes('name="twitter:card"'),page+' no Twitter card');assert(s.includes('Badlands'),page+' missing Badlands metadata');}
const dash=get('dashboard.html');assert(dash.includes('data-nav-label="World Map"'));assert(!dash.includes('data-nav-label="Chernarus Map"'));
const map=get('assets/js/dashboard/community.js');assert(!map.includes("overview?.map_key||'chernarus'"));
const sw=get('sw.js');assert(sw.includes('badlands-public-embeds-1'));assert(sw.includes("WWZ_PWA_CACHE_RELEASE_VERSION = '1.27.0'"));
console.log('Badlands public embed / world context: passed');
