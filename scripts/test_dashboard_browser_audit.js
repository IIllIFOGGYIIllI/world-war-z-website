'use strict';

/*
 * Real-browser migration audit for generated World War Z workspaces.
 *
 * Tested without authenticating or using any live API. The web server is a
 * local static Python HTTP server; any remote traffic is intercepted.
 * Privileged display state is simulated ONLY in this test's browser context.
 * No live user, Discord, Nitrado or database action is ever invoked.
 */
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');

const ROOT = process.env.WWZ_AUDIT_BASE || 'http://127.0.0.1:8765/';
const routes = JSON.parse(fs.readFileSync('workspaces/routes.json', 'utf8'));
const problems = [];
const traces = [];

const assetFilter = async (route) => {
  const request = route.request();
  const url = request.url();
  if (!url.startsWith(ROOT)) {
    if (request.resourceType() === 'document') {
      await route.abort('blockedbyclient');
    } else if (request.resourceType() === 'fetch' || request.resourceType() === 'xhr') {
      await route.fulfill({
        status: 503, contentType: 'application/json',
        body: '{"status":"error","message":"Offline browser audit: remote API disabled"}'
      });
    } else await route.abort('blockedbyclient');
    return;
  }
  if (['image', 'media', 'font'].includes(request.resourceType())) {
    await route.abort('blockedbyclient');
    return;
  }
  await route.continue();
};

const visibleWorkspace = async (page, key) => page.evaluate(key => {
  document.body.classList.remove('dashboard-gated');
  for (const gate of document.querySelectorAll('[data-dashboard-gateway]')) {
    gate.style.setProperty('display', 'none', 'important');
  }
  // Simulate only UI visibility. This is deliberately not a real credential.
  dashboardAccessLevel = 'owner';
  showView(key, false);
  return {
    current: document.documentElement.getAttribute('data-wwz-dedicated-workspace'),
    panels: [...document.querySelectorAll('[data-view-panel]')].map(x => ({
      name: x.dataset.viewPanel, hidden: x.hidden, active: x.classList.contains('active')
    })),
    label: document.querySelector('[data-workspace-label]')?.textContent?.trim(),
    activeLink: [...document.querySelectorAll('.sidebar-navigation .side-link[aria-current="page"]')]
      .map(x => x.dataset.view + '/' + x.dataset.section),
    navLinks: document.querySelectorAll('.sidebar-navigation .side-link').length,
    contentWidth: document.documentElement.scrollWidth,
    viewportWidth: innerWidth,
    scrollHeight: document.documentElement.scrollHeight,
  };
}, key);

async function newContext(browser, viewport, javaScriptEnabled = true) {
  const context = await browser.newContext({
    viewport, serviceWorkers:'block', ignoreHTTPSErrors:true,
    reducedMotion:'reduce', javaScriptEnabled
  });
  await context.route('**/*', assetFilter);
  return context;
}

async function main() {
  const browser = await chromium.launch({ channel:'chrome', headless:true,
    args:['--no-sandbox','--disable-dev-shm-usage'] });
  try {
    const context = await newContext(browser, {width:1366,height:850});
    // Every real page must parse, load its executable shell, and preserve its route.
    for (const row of routes) {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(String(error?.message||error)));
      try {
        const result = await page.goto(new URL(row.url, ROOT).href, {
          waitUntil:'domcontentloaded',timeout:18000
        });
        if (!result || result.status() !== 200)
          throw Error('HTTP ' + (result?.status() ?? 'unavailable'));
        let data;
        try {
          data = await visibleWorkspace(page,row.key);
        } catch (error) {
          const redirected = /Execution context was destroyed/.test(String(error?.message||error));
          if (!redirected || row.access === 'public') throw error;
          // The baseline browser has no Discord credentials. Guest access to
          // a protected page should redirect to the public dashboard.
          await page.waitForURL(url => url.pathname === new URL('dashboard.html',ROOT).pathname,
            {timeout:3000});
          traces.push({key:row.key,guestRedirect:'dashboard.html',access:row.access});
          continue;
        }
        if (data.current !== row.key)
          throw Error('Wrong HTML route ' + data.current);
        if (data.panels.length !== 1 || data.panels[0].name !== row.view
            || data.panels[0].hidden || !data.panels[0].active)
          throw Error('Incorrect visible workspace: ' + JSON.stringify(data.panels));
        if (data.activeLink.join(',') !== row.key)
          throw Error('Sidebar selection incorrect: ' + data.activeLink.join(','));
        if (data.navLinks < 78)
          throw Error('Missing shared sidebar links ' + data.navLinks);
        const fatal = errors.filter(message =>
          /Cannot (?:read|set) properties of (?:null|undefined)|is not defined|is not a function|Uncaught ReferenceError|Uncaught TypeError/.test(message)
        );
        if (fatal.length) throw Error('JavaScript error: ' + fatal.slice(0,3).join(' | '));
        traces.push({key:row.key,desktop:true,width:data.contentWidth,viewport:data.viewportWidth});
      } catch(error) {
        problems.push('DESKTOP ' + row.key + ': ' + String(error?.message||error).slice(0,600));
      } finally { await page.close(); }
    }
    await context.close();

    // Mobile coverage across the full breadth of high-traffic and protected tools.
    const mobileKeys = [
      'overview/summary','server/status','map/explorer',
      'community/events','community/analytics','community/planner',
      'zones/manage','zones/map','economy/banking','community/bounties',
      'players/identity','factions/directory','tickets/support',
      'staff/server-controls','staff/moderation-centre','configuration/workflow',
      'serverconfig/structured','settings/app-updates'
    ];
    const mobile = await newContext(browser,{width:390,height:844});
    const mobileProtected = await newContext(browser,{width:390,height:844},false);
    for (const key of mobileKeys) {
      const row = routes.find(r=>r.key===key);
      if (!row) { problems.push('MOBILE missing route ' + key);continue; }
      // Protected pages are rendered with JavaScript disabled in the mobile
      // visual audit, so guest redirection cannot race measurement. Their
      // actual authorization is tested separately by the desktop guest flow.
      const offlineLayout = row.access !== 'public';
      const page = await (offlineLayout ? mobileProtected : mobile).newPage();
      const errors = [];
      page.on('pageerror',error=>errors.push(String(error?.message||error)));
      try {
        await page.goto(new URL(row.url,ROOT).href,{waitUntil:'domcontentloaded',timeout:18000});
        const data = offlineLayout
          ? await page.evaluate(() => {
              document.body.classList.remove('dashboard-gated');
              for (const gate of document.querySelectorAll('[data-dashboard-gateway]'))
                gate.style.setProperty('display','none','important');
              return {contentWidth:document.documentElement.scrollWidth,
                viewportWidth:innerWidth,
                current:document.documentElement.dataset.wwzDedicatedWorkspace,
                panels:[...document.querySelectorAll('[data-view-panel]')].map(x=>x.dataset.viewPanel)};
            })
          : await visibleWorkspace(page,key);
        if (data.current !== key)
          throw Error('Wrong mobile HTML workspace: '+data.current);
        if (offlineLayout) {
          if (data.panels.length !== 1 || data.panels[0] !== row.view)
            throw Error('Protected mobile page not isolated');
          if (!await page.locator('[data-sidebar-toggle]').count())
            throw Error('Protected mobile page lacks shared menu control');
        } else {
          const details = await page.evaluate(() => {
            const t=document.querySelector('[data-sidebar-toggle]');
            if (!t) return {menu:false};
            t.click();
            return {
              menu:t.getAttribute('aria-expanded')==='true',
              inert:Boolean(document.querySelector('[data-sidebar]')?.inert),
              sidebarOpen:document.querySelector('[data-sidebar]')?.classList.contains('open'),
            };
          });
          if (!details.menu || details.inert || !details.sidebarOpen)
            throw Error('Mobile menu did not open accessibly: '+JSON.stringify(details));
        }
        // Detect actual off-screen content rather than hiding it by cropping
        // the screenshots. A small tolerance covers borders and scrollbars.
        if (data.contentWidth > data.viewportWidth + 24)
          throw Error('Horizontal overflow '+data.contentWidth+' > '+data.viewportWidth);
        const fatal=errors.filter(x=>/Cannot (?:read|set) properties of (?:null|undefined)|is not defined|is not a function/.test(x));
        if (fatal.length) throw Error('JavaScript error: '+fatal.slice(0,2).join('|'));
        traces.push({key,mobile:true,mode:offlineLayout?'protected-static-layout':'interactive',
          width:data.contentWidth,viewport:data.viewportWidth});
      } catch(error) {
        problems.push('MOBILE ' + key + ': ' + String(error?.message||error).slice(0,600));
      } finally {await page.close();}
    }
    await mobile.close();
    await mobileProtected.close();

    // Navigation clicks must open a DIFFERENT HTML document, not hide panels.
    const navContext = await newContext(browser,{width:1280,height:800});
    const navPage = await navContext.newPage();
    try {
      await navPage.goto(new URL('dashboard.html',ROOT).href,{waitUntil:'domcontentloaded',timeout:18000});
      await navPage.evaluate(() => {
        dashboardAccessLevel = 'owner';
        document.querySelector('[data-view="community"][data-section="events"]').click();
      });
      await navPage.waitForURL('**/workspaces/community-events.html',{timeout:8000});
      if (navPage.url().includes('#community'))
        throw Error('Navigation changed the fragment without loading a new HTML page');
      const contextData = await navPage.evaluate(() =>
        document.documentElement.dataset.wwzDedicatedWorkspace);
      assert.equal(contextData,'community/events');
      const navButton = navPage.locator('[data-sidebar-toggle]');
      await navPage.setViewportSize({width:390,height:844});
      await navPage.evaluate(() => {
        document.body.classList.remove('dashboard-gated');
        const gate=document.querySelector('[data-dashboard-gateway]');
        if(gate)gate.style.display='none';
      });
      await navPage.evaluate(() => {
        dashboardAccessLevel='owner';
        document.querySelector('[data-sidebar-toggle]').click();
        document.querySelector('[data-view="zones"][data-section="manage"]').click();
      });
      await navPage.waitForURL('**/workspaces/zones-manage.html',{timeout:8000});
      traces.push({navigation:'dashboard.html -> community-events.html -> zones-manage.html'});
    } catch(error) {
      problems.push('NAVIGATION '+String(error?.message||error).slice(0,700));
    } finally {await navContext.close();}
  } finally { await browser.close(); }
  for(const line of traces.filter(x=>x.mobile||x.navigation)) console.log('AUDIT '+JSON.stringify(line));
  if(problems.length) {
    console.error('BROWSER AUDIT FAILED with '+problems.length+' issue(s):');
    for(const problem of problems.slice(0,100)) console.error(' - '+problem);
    process.exitCode=1;
  } else {
    console.log('PASS: '+routes.length+' physical desktop routes (including guest protection), '
      +'18 mobile layouts, accessible public mobile drawers, and real cross-page navigation');
  }
}

main().catch(error=>{console.error('Audit runner failed:',error);process.exitCode=1;});
