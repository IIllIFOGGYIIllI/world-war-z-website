'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync('dashboard.html','utf8');
const js = fs.readFileSync('assets/js/dashboard/data-management.js','utf8');
const css = fs.readFileSync('assets/css/dashboard/data-management.css','utf8');
const lazy = fs.readFileSync('assets/js/dashboard/lazy-assets.js','utf8');
const sw = fs.readFileSync('sw.js','utf8');
for (const marker of ['data-data-volume-total', 'data-data-volume-list', 'data-data-volume-note', 'data-data-volume-duplicates']) {
  assert(html.includes(marker), 'Missing owner storage field '+marker);
}
assert(js.includes('renderVolume(data?.volume_inventory)'), 'Missing read-only inventory renderer');
assert(js.includes('volumeLabels') && js.includes('document.createElement'), 'Safe text-only UI expected');
assert(!/fetch\s*\(|XMLHttpRequest/.test(js.slice(js.indexOf('const renderVolume'), js.indexOf('const renderExportOptions'))), 'Renderer must never make extra network calls');
assert(js.includes('No files were changed or deleted.'), 'Prominent storage safety notice');
assert(css.includes('.data-volume-row'), 'Responsive volume styles');
assert(lazy.includes('data-management.js?v=1.40.0&rev=volume-breakdown-1'));
assert(lazy.includes('data-management.css?v=1.40.0&rev=volume-breakdown-1'));
assert(html.includes('assets/js/dashboard/lazy-assets.js?v=2.8.7'));
assert(sw.includes("WWZ_PWA_UPDATE_REVISION = '2026-11-22-volume-breakdown-1'"));
new (require('node:vm').Script)(js, { filename: 'data-management.js' });
console.log('PASS: Owner-only Railway volume breakdown, no deletion controls, updated PWA assets');
