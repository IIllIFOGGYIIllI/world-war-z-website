/* World War Z v2.0.0 navigation regression check. Requires only Node.js. */
'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');

const script = fs.readFileSync(path.resolve(__dirname, '../assets/js/ui-system.js'), 'utf8');
assert(script.includes('  const normalizePublicNavigation = () => {'));
let count = 0;

function makeNode(tag) {
  const listeners = new Map();
  const attributes = new Map();
  const classes = new Set();
  const node = {
    tagName: tag.toUpperCase(), children: [], dataset: {}, textContent: '',
    classList: {
      contains: (c) => classes.has(c),
      remove: (c) => classes.delete(c),
      add: (c) => classes.add(c),
    },
    addEventListener: (type, handler) => { const arr = listeners.get(type) || []; arr.push(handler); listeners.set(type, arr); },
    dispatch: (type, event = {}) => (listeners.get(type) || []).forEach((fn) => fn(event)),
    setAttribute: (name, value) => attributes.set(name, String(value)),
    getAttribute: (name) => attributes.get(name) ?? null,
    hasAttribute: (name) => attributes.has(name),
    matches: (selector) => selector === '[data-pwa-install]' && Object.hasOwn(node.dataset, 'pwaInstall'),
    contains: (target) => node === target || node.children.includes(target),
    focus: () => { node.focused = true; },
    replaceChildren: (...children) => { node.children = children; },
    append: (...children) => { node.children.push(...children); },
    querySelectorAll: (selector) => selector === 'a' ? node.children.filter((n) => n.tagName === 'A') : [],
  };
  return node;
}

const installButton = makeNode('button');
installButton.dataset.pwaInstall = '';
installButton.addEventListener('click', () => count++); // Original PWA install handler
const nav = makeNode('nav');
nav.children.push(installButton, makeNode('a'));
const menuButton = makeNode('button');
menuButton.setAttribute('aria-expanded', 'true');
const listeners = new Map();
const document = {
  readyState: 'loading',
  createElement: (tag) => makeNode(tag),
  querySelector: (selector) => {
    if (selector === '.site-navigation, .page-nav, .donation-topnav, .shop-topnav') return nav;
    if (selector === '[data-menu-button]') return menuButton;
    return null;
  },
  addEventListener: (type, handler) => { listeners.set(type, handler); },
};
const win = {};
const expose = '  window.__navigationRegression = { normalizePublicNavigation };\n';
const patchedScript = script.replace("  if (document.readyState === 'loading')", expose + "  if (document.readyState === 'loading')");
assert.notEqual(patchedScript, script);
vm.runInNewContext(patchedScript, { document, window: win, location: { pathname: '/index.html' } });
win.__navigationRegression.normalizePublicNavigation();

assert.equal(nav.children[0].textContent, 'Home');
assert.deepEqual(nav.children.filter((node) => node.tagName === 'A').map((node) => node.textContent),
  ['Home','Dashboard','Shop','Rules','Donations','Companion','Policies','Discord']);
assert.equal(nav.children.at(-1), installButton, 'PWA control must retain node identity');
assert.equal(nav.getAttribute('aria-label'), 'Primary navigation');
assert.equal(nav.children.find((node) => node.textContent === 'Companion').dataset.companionHomeNav, '');

nav.classList.add('open');
installButton.dispatch('click');
assert.equal(count, 1, 'PWA click handler must still fire');
assert.equal(nav.classList.contains('open'), false, 'PWA click dismisses mobile menu');

nav.classList.add('open');
menuButton.setAttribute('aria-expanded', 'true');
let prevented = false;
listeners.get('keydown')({ key: 'Escape', preventDefault: () => { prevented = true; } });
assert(prevented && menuButton.focused);
assert.equal(menuButton.getAttribute('aria-expanded'), 'false');
assert.equal(nav.classList.contains('open'), false);

nav.classList.add('open');
listeners.get('click')({ target: makeNode('div') });
assert.equal(nav.classList.contains('open'), false, 'Outside click closes navigation');

nav.classList.add('open');
listeners.get('click')({ target: nav.children[0] });
assert.equal(nav.classList.contains('open'), true, 'Click inside menu is not treated as outside');
nav.children[0].dispatch('click');
assert.equal(nav.classList.contains('open'), false, 'Navigating away closes menu');

console.log('PASS: 8 global links, PWA control identity, Companion marker, ARIA, Escape, outside-click, link-click, install-click');
