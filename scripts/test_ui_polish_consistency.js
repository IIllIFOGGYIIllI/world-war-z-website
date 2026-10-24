'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs');const read=p=>fs.readFileSync(p,'utf8');
const ui=read('assets/js/ui-system.js'),pwa=read('assets/js/pwa.js'),home=read('assets/js/pages/home.js');
assert.ok(ui.includes("label: 'Companion', href: 'companion.html'"));
assert.ok(ui.includes("link.dataset.companionLink = ''"));
assert.ok(pwa.includes("navigation.querySelectorAll('a[href]')"));
assert.ok(pwa.includes("footer.querySelectorAll('a[href]')"));
assert.ok(home.includes("navigation.querySelectorAll('a[href]')"));
assert.ok(pwa.includes("=== 'companion.html'"));
assert.ok(home.includes("=== 'companion.html'"));
assert.ok(!ui.includes('PRIMARY + LIVONIA'));
for(const f of ['index.html','dashboard.html','shop.html','rules.html']){
  const s=read(f);
  assert.ok(!s.includes('Chernarus and Livonia remain isolated'),f);
  assert.ok(!s.includes('Secondary Nitrado/Discord routing is being verified'),f);
}
assert.ok(!read('shop.html').includes('<strong>CHERNARUS</strong>'));
assert.ok(read('rules.html').includes('Nasdara PvE and Nasdara PvP keep separate published rulesets.'));
assert.ok(read('dashboard.html').includes('Gameplay and shop reliability'));
for(const name of fs.readdirSync('.').filter(f=>f.endsWith('.html'))){
  const src=read(name);
  assert.ok(!src.includes('ui-system.js?v=2.0.0'),name);
  assert.ok(!src.includes('pwa.js?v=1.61.0'),name);
}
console.log('PASS: Single Companion tab and consistent Nasdara interface');
