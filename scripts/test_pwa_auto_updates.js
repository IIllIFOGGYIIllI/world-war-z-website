'use strict';
// PWA lifecycle regression: manual check, automatic update discovery,
// explicit confirmation before activation, offline behavior and cache rollover.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const js=fs.readFileSync('assets/js/pwa.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const page=fs.readFileSync('dashboard.html','utf8');
const css=fs.readFileSync('assets/css/pwa.css','utf8');
const start=js.indexOf('  let activeServiceWorkerRegistration = null;');
const end=js.indexOf("  window.addEventListener('beforeinstallprompt'",start);
assert.ok(start>0&&end>start,'PWA update controller must be present');
assert.ok(js.includes('setInterval(checkForegroundUpdates, FOREGROUND_UPDATE_CHECK_MS)'));
assert.ok(js.includes("window.addEventListener('pageshow', checkForegroundUpdates)"));
assert.ok(js.includes("document.addEventListener('visibilitychange', checkForegroundUpdates)"));
assert.ok(js.includes("updateViaCache: 'none'"));
assert.ok(js.includes("confirmedUpdatePending"),'Activation must work without sessionStorage');
assert.ok(!js.includes("registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });"),
  'Old one-click activation path must be removed');
assert.ok(sw.includes('const APP_CACHE_RELEASE = `${WWZ_PWA_VERSION}-${WWZ_PWA_UPDATE_REVISION}`'),
  'Release revision must invalidate PWA JS/CSS cache');
assert.ok(sw.includes('const MAP_TILE_CACHE = `${CACHE_PREFIX}map-tiles-${MAP_CACHE_RELEASE}`'),
  'New app release must retain separately bounded map cache');
assert.ok(page.includes('data-nav-label="App Updates"'));
assert.ok(page.includes('data-pwa-check-updates'));
assert.ok(page.includes('data-pwa-update-status'));
assert.ok(page.includes('data-dashboard-section="app-updates"'));
assert.ok(css.includes('.pwa-update-dialog .pwa-update-dialog-actions'));
assert.ok(css.includes('.pwa-update-banner[hidden]'));

const controls={textContent:'',dataset:{},disabled:false,
 addEventListener(name,callback){this.events=this.events||{};this.events[name]=callback;}};
const state={textContent:'',dataset:{}};
const nodes={};
const doc={
  body:{append(node){if(node.dataset?.pwaUpdateBanner!==undefined)nodes.banner=node;}},
  querySelector(selector){
    if(selector==='[data-pwa-update-banner]')return nodes.banner||null;
    if(selector==='[data-pwa-update-confirm]')return nodes.dialog||null;
    if(selector==='.site-navigation')return null;
    return null;
  },
  querySelectorAll(selector){
    if(selector==='[data-pwa-check-updates]')return [controls];
    if(selector==='[data-pwa-update-status]')return [state];
    return [];
  },
  createElement(tag){
    const node={tag,dataset:{},hidden:false,events:{},children:[],
      addEventListener(type,fn){this.events[type]=fn;},
      append(...children){this.children.push(...children);},
    };
    if(tag==='dialog')nodes.dialog=node;
    return node;
  }
};
let registrationUpdates=0,skipRequests=0,confirmed=false;
const waiting={postMessage(message){assert.equal(message.type,'SKIP_WAITING');skipRequests++;}};
const registration={waiting,installing:null,
  addEventListener(){},async update(){registrationUpdates++;return registration;}};
const serviceWorker={controller:{},async register(){return registration;},
  async getRegistration(){return registration;}};
const context={
  navigator:{serviceWorker,onLine:true},
  window:{isSecureContext:true,confirm(){return confirmed;}},
  document:doc,Date,Promise,URL,console,setTimeout,
  UPDATE_RELOAD_KEY:'test-pwa-pending',
  sessionStorage:{setItem(){},getItem(){return null;}},
  COMPANION_RELEASE_URL:'assets/data/companion-release.json',
  captureNativeRelease:()=>null,
  checkNativeRelease:async()=>null,
};
const scoped=js.slice(start,end);
vm.runInNewContext(scoped+'\nthis.testPwa={registerServiceWorker,checkForPwaUpdates,applyWaitingUpdate,showUpdateReady};',context);
(async()=>{
  await context.testPwa.registerServiceWorker();
  context.testPwa.showUpdateReady();
  assert.equal(nodes.banner.hidden,false);
  assert.ok(state.textContent.includes('New version ready'));
  assert.equal(await context.testPwa.checkForPwaUpdates({manual:true}),true);
  assert.equal(registrationUpdates,0,'Waiting update must not trigger redundant update call');
  await context.testPwa.applyWaitingUpdate();
  assert.equal(skipRequests,0,'Cancelled confirmation must not activate update');
  confirmed=true;
  await context.testPwa.applyWaitingUpdate();
  assert.equal(skipRequests,1,'Confirmed update activates waiting worker once');
  registration.waiting=null;
  await context.testPwa.checkForPwaUpdates({manual:true});
  assert.equal(registrationUpdates,1,'Manual check requests service-worker update');
  assert.ok(state.textContent.includes('up to date'));
  context.navigator.onLine=false;
  await context.testPwa.checkForPwaUpdates({manual:true});
  assert.equal(registrationUpdates,1,'Offline update checks must not call update');
  assert.ok(state.textContent.includes('offline'));
  assert.ok(page.indexOf('data-nav-label="App Updates"')<page.indexOf('id="dashboard-settings-app-updates"'));
  console.log('PASS: PWA release cache rotations, on-open checks, manual update and confirmation, offline fallback');
})().catch(err=>{console.error(err);process.exitCode=1;});
