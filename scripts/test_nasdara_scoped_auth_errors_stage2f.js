'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

async function testActionCentre() {
  const source = fs.readFileSync('assets/js/dashboard/action-centre.js', 'utf8');
  const root = {
    classList: {add(){},remove(){},toggle(){}},
    querySelector(){return null;},
    querySelectorAll(){return [];}
  };
  const calls = {logout:0, remove:0, requests:0};
  const fake = {
    document: {querySelector(s){return s === '[data-action-centre]' ? root : null;},querySelectorAll(){return [];},addEventListener(){}},
    window: {WWZServerContext:{getSelectedServer:()=>({key:'nasdara-pve',map_key:'nasdara'})},addEventListener(){},setInterval(){return 1;},clearInterval(){}},
    DASHBOARD_API_BASE: 'https://world-war-z.up.railway.app',
    AUTH_SESSION_KEY: 'wwz_dashboard_session',
    storageGet(){return 'a'.repeat(48);},
    storageRemove(){calls.remove++;},
    applySignedOutState(){calls.logout++;},
    authFetch:async ()=>{calls.requests++;return {status:401,ok:false,json:async()=>({status:'unauthorized'})};},
    console,
  };
  vm.createContext(fake); vm.runInContext(source, fake);
  await new Promise(resolve => setTimeout(resolve, 0));
  await fake.window.WWZActionCentre.refresh();
  assert.ok(calls.requests >= 1, 'scoped API denial exercised');
  assert.equal(calls.remove,0,'Action Centre 401 must not delete Discord session');
  assert.equal(calls.logout,0,'Action Centre 401 must not log out the selected server');
}

async function main() {
  await testActionCentre();
  const account = fs.readFileSync('assets/js/dashboard/account.js','utf8');
  const section = account.split('const loadAccountSummary = async')[1]?.split('const loadCurrentAccount = async')[0]||'';
  assert.ok(section.includes('only /api/auth/me determines session validity') || section.includes('Only /api/auth/me determines session validity'));
  assert.ok(!section.includes('storageRemove(AUTH_SESSION_KEY)'), 'account scoped 401 must not delete session');
  assert.ok(!section.includes('applySignedOutState('), 'account scoped 401 must not hide dashboard');

  const checkedModules = [
    'admin-access.js', 'treasury.js', 'data-management.js',
    'moderation-centre.js', 'appeals.js'
  ];
  for (const name of checkedModules) {
    const script = fs.readFileSync('assets/js/dashboard/' + name, 'utf8');
    assert.ok(!script.includes('storageRemove(AUTH_SESSION_KEY)'), name + ': must keep OAuth token');
    assert.ok(!script.includes('applySignedOutState('), name + ': must keep dashboard signed in');
  }
  const notices = [];
  const context = { showAuthMessage: (msg) => notices.push(msg) };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('assets/js/dashboard/admin-access.js', 'utf8'), context);
  for (const status of [401, 403]) {
    const handled = vm.runInContext(
      'handleAdminPlayerAuthorizationResponse({status:' + status + '}, {error_code:"admin_access_required"}, {actionRequest:true})',
      context
    );
    assert.equal(handled, true);
  }
  assert.equal(notices.length, 2);
  // Server-specific access levels in /api/auth/me must override the
  // top-level OAuth membership when selecting PvE versus PvP.
  const core = fs.readFileSync('assets/js/dashboard/core.js', 'utf8');
  assert.ok(core.includes('authenticatedUser.servers'), 'Use verified server memberships');
  assert.ok(core.includes("entry.key === server.key && entry.map_key === server.map_key"), 'Match selected server exactly');
  assert.ok(core.includes("window.addEventListener('wwz:serverchange'"), 'Update role UI when server changes');
  console.log('PASS: protected login and selected-server access stay isolated');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
