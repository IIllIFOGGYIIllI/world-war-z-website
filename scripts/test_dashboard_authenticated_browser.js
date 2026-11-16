'use strict';
// Synthetic signed-in Chrome audit. ALL external requests are intercepted.
// No real Discord tokens, Railway writes, Nitrado requests or player actions.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const BASE='http://127.0.0.1:8765/';
const API='https://world-war-z.up.railway.app';
const rows=JSON.parse(fs.readFileSync('workspaces/routes.json','utf8'));
const pve={key:'world-war-z',name:'World War Z | Nasdara PvE',
  map_key:'badlands',gameplay_mode:'pve',available:true,paused:false,access_level:'owner'};
const pvp={key:'world-war-z-livonia',name:'World War Z | Nasdara Full PvP',
  map_key:'badlands',gameplay_mode:'pvp',available:false,paused:true,access_level:'owner'};
const issues=[];
let writes=0;
function authPayload(role) {
  return {status:'ok',
    user:{id:'100000000000000001',username:'AuditUser',display_name:'Test User',avatar_url:null},
    membership:{access_level:role,is_member:true},
    servers:[{...pve,access_level:role},{...pvp,access_level:role}]};
}
async function contextFor(browser,role,width=1365) {
  const ctx=await browser.newContext({viewport:{width,height:844},
    serviceWorkers:'block',ignoreHTTPSErrors:true,reducedMotion:'reduce'});
  await ctx.addInitScript((data)=>{
    if(location.hostname==='127.0.0.1'){
      sessionStorage.setItem('wwz_dashboard_session','synthetic-test-token');
      sessionStorage.setItem('wwz_dashboard_server',JSON.stringify(data));
    }
  },{...pve,access_level:role});
  await ctx.route('**/*',async(route)=>{
    const req=route.request(),url=req.url();
    if(url.startsWith(BASE)){
      if(['image','font','media'].includes(req.resourceType()))return route.abort('blockedbyclient');
      return route.continue();
    }
    if(!url.startsWith(API))return route.abort('blockedbyclient');
    const pathname=new URL(url).pathname;
    const headers={'access-control-allow-origin':'*','access-control-allow-headers':'authorization,content-type',
      'access-control-allow-methods':'GET,POST,OPTIONS','content-type':'application/json'};
    if(req.method()==='OPTIONS')return route.fulfill({status:204,headers,body:''});
    if(!['GET','HEAD'].includes(req.method())){
      writes++;
      return route.fulfill({status:403,headers,
        body:'{"status":"error","message":"Audit fixture blocks writes"}'});
    }
    if(pathname==='/api/auth/config')return route.fulfill({status:200,headers,
      body:'{"status":"ok","discord_auth":{"enabled":true}}'});
    if(pathname==='/api/auth/me')return route.fulfill({status:200,headers,
      body:JSON.stringify(authPayload(role))});
    return route.fulfill({status:503,headers,
      body:'{"status":"error","message":"Offline audit: non-auth data unavailable"}'});
  });
  return ctx;
}
async function openPage(ctx,key,role,expectedDenied=false) {
  const item=rows.find(x=>x.key===key);
  if(!item)throw Error('Missing route '+key);
  const page=await ctx.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e.message||e)));
  try{
    await page.goto(new URL(item.url,BASE).href,{waitUntil:'domcontentloaded',timeout:16000});
    if(expectedDenied) {
      await page.waitForURL(url=>url.pathname===new URL('dashboard.html',BASE).pathname,
        {timeout:8000});
      await page.waitForFunction(()=>dashboardAccessLevel==='staff',null,{timeout:8000});
      return page;
    }
    await page.waitForFunction(()=>document.body.classList.contains('dashboard-ready'),
      null,{timeout:8000});
    const result=await page.evaluate(()=>({
      route:document.documentElement.dataset.wwzDedicatedWorkspace,
      access:dashboardAccessLevel,
      server:window.WWZServerContext?.getSelectedServer?.()?.key,
      mode:document.querySelector('[data-topbar-server-mode]')?.textContent?.trim(),
      active:[...document.querySelectorAll('.sidebar-navigation [aria-current="page"]')]
        .map(x=>x.dataset.view+'/'+x.dataset.section),
      count:document.querySelectorAll('[data-view-panel]').length,
      width:document.documentElement.scrollWidth,viewport:innerWidth
    }));
    assert.equal(result.route,key);
    assert.equal(result.access,role);
    assert.equal(result.server,pve.key);
    assert.equal(result.mode,'PvE');
    assert.deepEqual(result.active,[key]);
    assert.equal(result.count,1);
    if(result.width>result.viewport+24)throw Error('Horizontal overflow '+JSON.stringify(result));
    const bad=errors.filter(x=>/Cannot (?:read|set) properties of (?:null|undefined)|is not defined|is not a function/.test(x));
    if(bad.length)throw Error('JavaScript error: '+bad.slice(0,2).join('|'));
    return page;
  }catch(e){await page.close();throw e;}
}
async function main() {
  const browser=await chromium.launch({channel:'chrome',headless:true,
    args:['--no-sandbox','--disable-dev-shm-usage']});
  try{
    const owner=await contextFor(browser,'owner');
    for(const key of ['community/events','community/planner','zones/manage','zones/map',
      'staff/server-controls','staff/moderation-centre','configuration/workflow',
      'serverconfig/structured','economy/banking','settings/app-updates']){
      try{const p=await openPage(owner,key,'owner');await p.close();console.log('OWNER PASS '+key);}
      catch(e){issues.push('OWNER '+key+': '+e.message);}
    }
    try{
      const p=await openPage(owner,'overview/summary','owner');
      await p.evaluate(()=>document.querySelector('[data-view="staff"][data-section="server-controls"]').click());
      await p.waitForURL('**/workspaces/staff-server-controls.html',{timeout:8000});
      await p.waitForFunction(()=>document.body.classList.contains('dashboard-ready'),
        null,{timeout:8000});
      assert.equal(await p.evaluate(()=>dashboardAccessLevel),'owner');
      assert.equal(await p.evaluate(()=>window.WWZServerContext?.getSelectedServer?.()?.key),pve.key);
      console.log('OWNER PASS cross-page session preservation');await p.close();
    }catch(e){issues.push('OWNER navigation: '+e.message);}
    try{
      const p=await openPage(owner,'overview/summary','owner');
      await p.locator('[data-change-server]').click({timeout:5000});
      const cards=p.locator('[data-server-selection-grid] button');
      assert.equal(await cards.count(),2);
      const view=await p.evaluate(()=>({
        visible:document.querySelector('[data-gateway-server-view]')?.hidden===false,
        texts:[...document.querySelectorAll('[data-server-selection-grid] button')]
          .map(x=>x.textContent.toLowerCase())
      }));
      assert.ok(view.visible);
      assert.ok(view.texts.some(x=>x.includes('temporarily unavailable')));
      await cards.first().click({timeout:5000});
      await p.waitForFunction(()=>document.body.classList.contains('dashboard-ready'),
        null,{timeout:5000});
      console.log('OWNER PASS PvE/PvP server switcher');await p.close();
    }catch(e){issues.push('Server picker: '+e.message);}
    await owner.close();
    const mobile=await contextFor(browser,'owner',390);
    for(const key of ['community/events','community/planner','zones/manage',
      'staff/server-controls','serverconfig/structured']){
      try{
        const p=await openPage(mobile,key,'owner');
        const state=await p.evaluate(()=>{
          const button=document.querySelector('[data-sidebar-toggle]');
          button.click();
          return {expanded:button.getAttribute('aria-expanded'),
            inert:document.querySelector('[data-sidebar]').inert};
        });
        assert.equal(state.expanded,'true');
        assert.equal(state.inert,false);
        console.log('OWNER MOBILE PASS '+key);await p.close();
      }catch(e){issues.push('OWNER MOBILE '+key+': '+e.message);}
    }
    await mobile.close();
    const staff=await contextFor(browser,'staff');
    for(const key of ['zones/manage','staff/server-controls','serverconfig/structured']){
      try{
        const blocked=key==='serverconfig/structured';
        const p=await openPage(staff,key,'staff',blocked);
        console.log('STAFF PASS '+key+(blocked?' [Owner only denied]':''));
        await p.close();
      }catch(e){issues.push('STAFF '+key+': '+e.message);}
    }
    await staff.close();
  }finally{await browser.close();}
  if(writes)issues.push('Unexpected backend POST/PUT/DELETE operations: '+writes);
  if(issues.length){
    console.error('AUTH BROWSER AUDIT FAILED ('+issues.length+')');
    for(const issue of issues)console.error(' - '+issue);
    process.exitCode=1;
  }else console.log('PASS: Mock Owner/Staff authentication, separate routes, mobile navigation, '
    +'paused PvP server selection, and cross-page session persistence');
}
main().catch(e=>{console.error('Audit runner error:',e);process.exitCode=1;});
