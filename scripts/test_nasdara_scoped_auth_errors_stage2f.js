'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

async function testActionCentre() {
  const source = fs.readFileSync('assets/js/dashboard/action-centre.js', 'utf8');
  const root = {
    classList: {add(){},remove(){}},
    querySelector(){return null;},
    querySelectorAll(){return [];}
  };
  const calls = {logout:0, remove:0, requests:0};
  const fake = {
    document: {querySelector(s){return s === '[data-action-centre]' ? root : null;},querySelectorAll(){return [];},addEventListener(){}},
    window: {addEventListener(){},setInterval(){return 1;},clearInterval(){}},
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
  console.log('PASS: scoped 401/403 cannot invalidate global Discord login');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
