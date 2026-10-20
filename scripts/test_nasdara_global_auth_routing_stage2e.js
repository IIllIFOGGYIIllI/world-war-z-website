'use strict';
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

async function main() {
  const fetched = [];
  const memory = new Map([['wwz_dashboard_server', JSON.stringify({key:'nasdara-pvp',map_key:'badlands'})]]);
  const fake = {
    window: {setTimeout(){return 1;},clearTimeout(){}},
    location: {href:'https://iillifoggyiilli.github.io/world-war-z-website/dashboard.html'},
    navigator: {onLine:true},
    sessionStorage: {getItem(k){return memory.get(k)||null;}},
    Headers, URL, AbortController,
    fetch: async (url,options) => {fetched.push({url,headers:options.headers});return {ok:true,status:200};}
  };
  vm.createContext(fake);
  vm.runInContext(fs.readFileSync('assets/js/core/http.js', 'utf8'), fake);
  const api = fake.window.WWZHttp.request;
  const base = 'https://world-war-z.up.railway.app';
  const auth = {headers: {Authorization:'Bearer '+ 'A'.repeat(48), 'X-WWZ-Server':'nasdara-pvp'}};
  for (const path of ['/api/auth/me','/api/auth/discord/complete','/api/auth/logout','/api/auth/config']) {
    await api(base+path,auth);
    assert.equal(fetched.at(-1).headers.has('X-WWZ-Server'),false,`${path} should ignore selected PvP key`);
  }
  await api(base+'/api/account/summary',auth);
  assert.equal(fetched.at(-1).headers.get('X-WWZ-Server'),'nasdara-pvp','PvP account data remains scoped');
  memory.set('wwz_dashboard_server',JSON.stringify({key:'world-war-z',map_key:'badlands'}));
  await api(base+'/api/account/summary',auth);
  assert.equal(fetched.at(-1).headers.get('X-WWZ-Server'),'world-war-z','PvE data remains scoped');
  memory.delete('wwz_dashboard_server');
  await assert.rejects(api(base+'/api/account/summary',auth),/Select a World War Z server/);
  assert.match(fs.readFileSync('sw.js','utf8'),/dual-nasdara-5-auth-isolation/);
  console.log('PASS: global OAuth headers not server-scoped; operational PvE/PvP routing preserved');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
