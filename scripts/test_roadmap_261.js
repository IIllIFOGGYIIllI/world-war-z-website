"use strict";
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const index=read('index.html'), dash=read('dashboard.html'), sw=read('sw.js');
const section=index.split('id="roadmap"')[1]?.split('id="faq-title"')[0] || '';
assert(section.includes('Badlands World Profiles Roadmap'));
assert(section.includes('Website v2.6.1 · Bot v1.69.0'));
assert(section.includes('11 October 2026'));
for(const token of ['Stage 1 · verified','Stage 2A · deployed, verify live','Stage 2B · next','Stage 2C · planned','Stage 3 · awaiting platform support','Stage 4 · activation locked','Level 1','XP 0','Prestige 0','Livonia','Chernarus','role reconciliation','Total Chaos']) {
  assert(section.toLowerCase().includes(token.toLowerCase()), `public roadmap: ${token}`);
}
assert(!section.includes('No major platform subsystem is currently waiting'));
assert(!section.includes('Chernarus is now a PvE-first world with PvP restricted'));
const mini=dash.split('id="dashboard-overview-roadmap"')[1]?.split('</article>')[0] || '';
for(const token of ['Badlands storage','Gameplay integration','Discord role sync','Badlands map','Backup &amp; activation']) assert(mini.includes(token), `dashboard roadmap: ${token}`);
assert(!mini.includes('Natural XP &amp; Prestige QA'));
assert(dash.includes('v2.6.1</strong>'));
assert(sw.includes("WWZ_PWA_VERSION = '2.6.1'"));
assert(sw.includes('2026-10-11-website-v2-6-1-roadmap-sync-1'));
assert(sw.includes("WWZ_PWA_CACHE_RELEASE_VERSION = '1.27.0'"));
assert(sw.includes('wwz-pwa-'));
console.log('Website v2.6.1 public/dashboard roadmap assertions passed');
