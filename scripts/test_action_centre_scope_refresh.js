'use strict';
// End-to-end style controller checks without a browser or live API credentials.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/js/dashboard/action-centre.js', 'utf8');
const handlers = {};
const requests = [];
const node = (name) => ({
  name, hidden: false, dataset: {}, textContent: '',
  classList: { add() {}, remove() {}, toggle() {} },
  children: [], append(...args) { this.children.push(...args); },
  replaceChildren(...args) { this.children = args; },
  setAttribute(name, value) { this[name] = value; }
});
const elements = new Map();
const get = (s) => { if (!elements.has(s)) elements.set(s, node(s)); return elements.get(s); };
const root = get('[data-action-centre]');
root.querySelector = (s) => s === '[data-action-centre-source]' ? null : get(s);
const tabs = ['active','archived'].map(view => ({
  dataset: { actionCentreView: view }, handlers: {},
  addEventListener(event, fn) { this.handlers[event] = fn; },
  classList: { toggle() {} }, setAttribute() {}
}));
root.querySelectorAll = s => s === '[data-action-centre-view]' ? tabs : [];
let selected = { key: 'nasdara-pve', map_key: 'nasdara' };
let session = 'a'.repeat(48);
const env = {
  window: {
    WWZServerContext: {getSelectedServer:()=>selected},
    addEventListener(event, fn) { (handlers[event] ||= []).push(fn); },
    clearInterval() {}, setInterval() {return 1;}
  },
  document: {
    querySelector: s => s === '[data-action-centre]' ? root : s === '[data-action-centre-nav-badge]' ? get(s) : null,
    addEventListener(event, fn) {(handlers[event] ||= []).push(fn);},
    visibilityState: 'visible'
  },
  DASHBOARD_API_BASE: 'https://world-war-z.up.railway.app',
  AUTH_SESSION_KEY: 'wwz_dashboard_session',
  storageGet: () => session,
  formatUpdatedAt: x => x,
  authFetch: (url, opts) => new Promise((resolve, reject) => {
    requests.push({url, opts, resolve, reject, server: selected.key, session});
  }),
  URL, location:{href:'https://iillifoggyiilli.github.io/world-war-z-website/dashboard.html',origin:'https://iillifoggyiilli.github.io'},
  console, setTimeout, clearTimeout
};
vm.runInNewContext(source, env);
const fire = (name, detail) => (handlers[name] || []).forEach(fn => fn({ detail }));
const flush = async () => {await Promise.resolve(); await Promise.resolve(); await Promise.resolve();};
const result = (items = [], map_key = 'nasdara') => ({
  ok:true, status:200, json:async()=>({status:'ok', items, map_key, summary:{actions:items.length,unread:items.length}})
});
(async () => {
  assert.equal(requests.length, 1, 'initial server-specific load');
  assert.match(requests[0].url, /view=active/);
  tabs[1].handlers.click();
  assert.equal(requests.length, 2, 'tab change triggers new request while old one is pending');
  assert.match(requests[1].url, /view=archived/);
  requests[1].resolve(result([])); await flush();
  requests[0].resolve(result([{item_key:'old-tab'}])); await flush();
  assert.equal(get('[data-action-centre-result-summary]').textContent, '0 items shown', 'older tab cannot overwrite current view');
  selected = {key:'nasdara-pvp',map_key:'nasdara'};
  fire('wwz:serverchange');
  assert.equal(requests.length, 3, 'switch loads separate PvP server');
  assert.equal(requests[2].server, 'nasdara-pvp');
  // Make another request stale by changing account while it is in flight.
  session='b'.repeat(48);
  fire('wwz:authchange');
  assert.equal(requests.length, 4, 'sign-in change loads new private account');
  requests[3].resolve(result([]));await flush();
  requests[2].resolve(result([{item_key:'old-server'}])); await flush();
  assert.equal(get('[data-action-centre-result-summary]').textContent, '0 items shown', 'outdated PvP request cannot overwrite new account');
  selected={key:'nasdara-pve',map_key:'nasdara'};fire('wwz:serverchange');
  requests[4].resolve(result([{item_key:'mismatched-map'}],'chernarus'));await flush();
  assert.equal(get('[data-action-centre-result-summary]').textContent, '0 items shown', 'mismatched map rejected');
  assert.match(get('[data-action-centre-message]').textContent,/does not match the selected map/);
  session='';fire('wwz:authchange');
  assert.equal(get('[data-action-centre-nav-badge]').hidden,true,'sign-out hides old account badge');
  console.log('PASS: Action Centre ignores stale tab/server/account snapshots and wrong-map results');
})().catch(error => {console.error(error); process.exitCode=1;});
