/* Whole-site UI safety: leave map internals, access controls and checkout untouched. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { Script } = require('node:vm');
const read = (path) => fs.readFileSync(path, 'utf8');
const version = 'v=2.1.0&amp;rev=sitewide-ui-1';
const pages = [
  'index.html', 'dashboard.html', 'shop.html', 'donations.html',
  'companion.html', 'rules.html', 'flags.html', 'legal.html',
  'terms.html', 'privacy.html', 'community-guidelines.html',
  'moderation-policy.html', 'changelog.html', 'map-link.html',
  'offline.html', '404.html',
];
for (const file of pages) {
  const page = read(file);
  const css = 'assets/css/site-refinement.css?' + version;
  const js = 'assets/js/site-refinement.js?' + version;
  assert.equal(page.split(css).length - 1, 1, file + ' must load design system once');
  assert.equal(page.split(js).length - 1, 1, file + ' must load enhancement script once');
  assert.ok(page.lastIndexOf(css) < page.indexOf('</head>'), file + ' CSS must be in head');
  assert.ok(page.lastIndexOf(js) < page.lastIndexOf('</body>'), file + ' JS must load after body');
  assert.ok(page.lastIndexOf(css) > page.indexOf('sitewide-experience.css') || !page.includes('sitewide-experience.css'),
    file + ' new design tokens must override older themes');
}
const css = read('assets/css/site-refinement.css');
const js = read('assets/js/site-refinement.js');
const shell = read('sw.js');
for (const token of [
  '--wwz-design-control-height: 44px',
  '--wwz-design-focus',
  "[aria-invalid='true']",
  ':focus-visible',
  'prefers-reduced-motion',
  'forced-colors: active',
  '.sidebar-navigation .side-link.active',
  '.wwz-location-bar',
  '.wwz-page-tabs',
  '.wwz-skip-link',
]) assert.ok(css.includes(token), 'Missing shared style: ' + token);
for (const token of [
  'const improvePageTabs =',
  "'shop.html'",
  "['Vehicle Rentals', 'rentals']",
  "['Shopping Cart', 'cart']",
  "['My Orders', 'orders']",
  'const watchPageTabs =',
  'IntersectionObserver',
  'const workspaceLocation =',
  'wwz:viewchange',
  'wwz:accesschange',
  "button.closest('[hidden]')",
  "if (allowed(prevButton)) prevButton.click()",
  'const deferOffscreenImages =',
  "img.loading = 'lazy'",
  "img.decoding = 'async'",
]) assert.ok(js.includes(token), 'Missing safe enhancement: ' + token);
assert.ok(!js.includes('fetch(') && !js.includes('localStorage'),
  'UI enhancement must not fetch user data or write persistent browser state');
assert.ok(shell.includes('./assets/css/site-refinement.css?v=2.1.0&rev=sitewide-ui-1'));
assert.ok(shell.includes('./assets/js/site-refinement.js?v=2.1.0&rev=sitewide-ui-1'));
assert.match(shell, /const WWZ_PWA_UPDATE_REVISION = '[^']+';/, 'Missing PWA revision token');
assert.ok(css.includes("input:not([type='checkbox']):not([type='radio']):not([type='range']):not([type='hidden'])"), 'Text input selector must remain a single compound selector');
assert.ok(!/input:not\([^\n]*\n\s+:not\(/.test(css), 'Whitespace before :not would stop input styles matching');
assert.ok(read('dashboard.html').includes('data-raid-damage-controls'), 'Raid controls must remain');
assert.ok(read('shop.html').includes('data-shop-auth-button'), 'Storefront auth controls must remain');
new Script(js, { filename: 'site-refinement.js' });
console.log('PASS: 16 pages, one design system, scoped navigation and protected feature integration');
