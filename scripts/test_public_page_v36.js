/* V3.6: public page composition and changelog chronology regression. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=path=>fs.readFileSync(path,'utf8');
const pages=['rules.html','flags.html','legal.html','terms.html','privacy.html',
  'community-guidelines.html','moderation-policy.html','changelog.html'];
const cssUrl='assets/css/pages/public-v36.css?v=3.6.0&amp;rev=release-layout-1';
const v3Url='assets/css/command-centre-v3.css?v=3.0.0&amp;rev=command-centre-redesign-1';
const css=read('assets/css/pages/public-v36.css');
for(const path of pages){
  const html=read(path);
  assert.equal(html.split(cssUrl).length-1,1,path+' should include new CSS exactly once');
  assert.ok(html.indexOf(cssUrl)>html.indexOf(v3Url),path+' must apply latest polish last');
  assert.ok(html.includes('<main id="content">'),path+' must keep original content landmark');
  assert.ok(html.includes('<nav aria-label="Page navigation"'),path+' must keep nav links');
}
const changelog=read('changelog.html');
const body=changelog.indexOf('<body class="wwz-v3 wwz-v3-public">');
const header=changelog.indexOf('<header class="page-header">',body);
const main=changelog.indexOf('<main id="content">',header);
const hero=changelog.indexOf('<section class="page-hero">',main);
const milestones=changelog.indexOf('id="recent-releases"',hero);
const archive=changelog.indexOf('id="release-archive"',milestones);
assert.ok(body<header&&header<main&&main<hero&&hero<milestones&&milestones<archive,
  'Changelog must show header, hero, highlights, archive in order');
assert.ok(!/<body[^>]*>\s*<section class="changelog-release"/.test(changelog),
  'Release notes cannot appear before navigation');
for(const headline of ['Dual Nasdara Stage 2B — 21 October 2026',
  'Nasdara Community Event Operations — 20 October 2026',
  'Website v2.20.0 — Survivor Career Records']){
  assert.equal(changelog.split(headline).length-1,1,'No release note lost or duplicated: '+headline);
}
assert.equal(changelog.split('class="wwz-v36-release-grid"').length-1,1,
  'Featured milestones should be grouped in one responsive release grid');
for(const token of ['font-size: 15px','min-height: 44px','overflow-x: auto',
  'grid-template-columns: repeat(2,minmax(0,1fr))','@media (max-width: 600px)',
  'body.wwz-v3-public .page-nav','body.wwz-v3-public .content-nav']){
  assert.ok(css.includes(token),'Missing V3.6 readability/mobile style: '+token);
}
assert.ok(!css.includes('.leaflet-')&&!css.includes('wwz-v3-dashboard'),
  'Policy styles must not target the map or authenticated dashboard');
assert.ok(!css.includes('fetch(')&&!css.includes('WebSocket'),
  'This change must remain presentation-only');
const sw=read('sw.js');
assert.match(sw, /const WWZ_PWA_UPDATE_REVISION = '[^']+';/,
  'PWA revision token must remain present');
assert.ok(sw.includes('./assets/css/pages/public-v36.css?v=3.6.0&rev=release-layout-1'),
  'Installed app should cache the new public stylesheet');
console.log('PASS: eight public content pages, Changelog reading order, mobile navigation and large-type text');
