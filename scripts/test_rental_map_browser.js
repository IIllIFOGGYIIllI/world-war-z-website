'use strict';
// Isolated, no-login Chrome visual-layout test of rental picker on phones.
// All third-party requests are blocked. No orders, API writes, or Discord calls.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const ROOT='http://127.0.0.1:8765/';
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  try{
    for(const {width,height} of [{width:390,height:844},{width:360,height:740},{width:1024,height:768}]){
      const ctx=await browser.newContext({viewport:{width,height},serviceWorkers:'block',reducedMotion:'reduce'});
      await ctx.route('**/*',async(route)=>{
        if(!route.request().url().startsWith(ROOT))return route.abort('blockedbyclient');
        if(['image','font','media'].includes(route.request().resourceType()))return route.abort('blockedbyclient');
        return route.continue();
      });
      const page=await ctx.newPage();
      await page.goto(ROOT+'shop.html',{waitUntil:'domcontentloaded',timeout:18000});
      await page.evaluate(()=>{
        for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();
        const dialog=document.querySelector('[data-rental-map-dialog]');
        if(!dialog)throw Error('Missing rental picker dialog');
        dialog.showModal();
      });
      // Both map surfaces MUST remain absent while hidden, even if global
      // component CSS styles them as display:block or display:grid.
      const initial=await page.evaluate(()=>({
        atlas:getComputedStyle(document.querySelector('[data-rental-map-atlas]')).display,
        fallback:getComputedStyle(document.querySelector('[data-rental-map-frame]')).display
      }));
      assert.deepEqual(initial,{atlas:'none',fallback:'none'});
      await page.evaluate(()=>{
        const iframe=document.querySelector('[data-rental-map-atlas]');
        iframe.hidden=false;
        iframe.src=ROOT+'map-link.html?map=badlands&rental_picker=1&server=world-war-z';
      });
      await page.waitForFunction(()=>{
        const f=document.querySelector('[data-rental-map-atlas]');
        return f?.contentDocument?.body?.classList.contains('wwz-rental-picker-mode');
      },null,{timeout:12000});
      const m=await page.evaluate(()=>{
        const dialog=document.querySelector('[data-rental-map-dialog]');
        const frame=document.querySelector('[data-rental-map-atlas]');
        const inner=frame.contentDocument;
        const r=(element)=>{const b=element.getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom}};
        const map=inner.querySelector('#wwz-detection-map');
        const header=inner.querySelector('.marker-header');
        const side=inner.querySelector('.hub-panel');
        const shell=inner.querySelector('.marker-shell');
        const readout=inner.querySelector('.marker-readout');
        const quick=inner.querySelector('.wwz-quick-access-button');
        return {
          viewport:{width:innerWidth,height:innerHeight},
          dialog:r(dialog),frame:r(frame),
          actions:r(document.querySelector('[data-rental-map-toolbar]')||document.querySelector('.wwz-rental-map-toolbar')),
          fallback:getComputedStyle(document.querySelector('[data-rental-map-frame]')).display,
          map:r(map),shell:r(shell),readout:r(readout),
          header:getComputedStyle(header).display,
          sidebar:getComputedStyle(side).display,
          quick:quick?getComputedStyle(quick).display:'absent',
          docOverflow:document.documentElement.scrollWidth>innerWidth+12,
          iframeOverflow:inner.documentElement.scrollWidth>frame.clientWidth+12
        };
      });
      assert.ok(m.frame.h>=200,'iframe must have useful visible height: '+JSON.stringify(m));
      assert.ok(m.frame.y>=m.dialog.y && m.frame.bottom<=m.dialog.bottom+4,'map must fit within modal: '+JSON.stringify(m));
      assert.ok(m.dialog.h<=height+2,'modal height must fit phone: '+JSON.stringify(m));
      assert.ok(m.map.h>=m.frame.h-15,'embedded map must fill iframe: '+JSON.stringify(m));
      assert.ok(m.shell.h>=m.frame.h-15,'embedded map shell must fill iframe: '+JSON.stringify(m));
      assert.equal(m.fallback,'none','hidden legacy map must not stack above embedded map');
      assert.equal(m.header,'none','rental picker must not display public hub header');
      assert.equal(m.sidebar,'none','rental picker must not display public POI sidebar');
      assert.ok(['none','absent'].includes(m.quick),'Quick Access must not cover rental map');
      assert.ok(m.readout.y>=0 && m.readout.bottom<=m.frame.h+5,'readout must stay in iframe');
      assert.equal(m.docOverflow,false,'modal must not cause horizontal overflow');
      assert.equal(m.iframeOverflow,false,'embedded map must not horizontally overflow');
      console.log('PASS rental picker '+width+'x'+height+' '+JSON.stringify(m));
      await ctx.close();
    }
  }finally{await browser.close();}
})().catch(error=>{console.error('Rental map Chrome regression failed:',error);process.exitCode=1;});
