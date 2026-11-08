/* WWZ V3.2 Community / Factions / Objectives / Progression.
 * Interface-only enhancements. Routes are delegated to existing sidebar
 * controls (with their authorization checks). No API or server mutations.
 */
(() => {
  'use strict';
  const panels = [
    ['community', '.community-hub', '.community-hero'],
    ['factions', '[data-view-panel="factions"]', ':scope > .view-heading'],
    ['objectives', '[data-view-panel="objectives"]', ':scope > .view-heading'],
    ['progression', '[data-view-panel="progression"]', ':scope > .view-heading']
  ];
  const routes = [
    {label:'Events & analytics',view:'community',section:'events'},
    {label:'Factions',view:'factions',section:'directory'},
    {label:'Quests & contracts',view:'objectives',section:'quests'},
    {label:'XP & rankings',view:'progression',section:'progress'}
  ];
  const sidebarLinks = Array.from(document.querySelectorAll('.sidebar-navigation .side-link[data-view]'));
  const permitted = (link) => !!(link && !link.hidden && !link.disabled && !link.closest('[hidden]'));
  const getRoute = (view, section) => sidebarLinks.find(link =>
    link.dataset.view === view && (link.dataset.section || '') === section && permitted(link));
  const clickRoute = (view, section) => {
    const link = getRoute(view, section);
    if (link) link.click();
  };
  const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const scrollTo = (target) => {
    if (!target || !target.isConnected || target.hidden || target.closest('[hidden]')) return;
    target.scrollIntoView({block:'start',behavior:reduceMotion()?'auto':'smooth'});
  };
  const create = (name, cls) => {
    const el=document.createElement(name);
    if(cls) el.className=cls;
    return el;
  };
  const buildTitle = (title, note) => {
    const h=create('div','wwz-v32-community-section-heading');
    const strong=create('h2');strong.textContent=title;
    const small=create('p');small.textContent=note;
    h.append(strong,small);
    return h;
  };
  const insertHeading = (anchor,title,note) => {
    if (anchor && anchor.parentElement && !anchor.previousElementSibling?.classList.contains('wwz-v32-community-section-heading')) {
      anchor.before(buildTitle(title,note));
    }
  };
  const destinationNavs = [];
  for(const [name,scopeSelector,anchorSelector] of panels) {
    const panel=document.querySelector('[data-view-panel="'+name+'"]');
    const scope=panel?.querySelector(scopeSelector);
    const heading=scope?.querySelector(anchorSelector);
    if(!panel || !scope || !heading)continue;
    const nav=create('nav','wwz-v32-community-switcher');
    nav.setAttribute('aria-label','Community workspace navigation');
    routes.forEach(route=>{
      const btn=create('button','wwz-v32-community-destination');
      btn.type='button';btn.textContent=route.label;
      btn.dataset.wwzV32Target=route.view;
      btn.addEventListener('click',()=>clickRoute(route.view,route.section));
      nav.append(btn);
    });
    heading.after(nav);
    destinationNavs.push(nav);
  }

  const makeLocalNav = (scope, entries, label) => {
    if(!scope)return;
    const nav=create('nav','wwz-v32-community-localnav');
    nav.setAttribute('aria-label',label);
    const buttons=[];
    entries.forEach(([title,selector,index])=>{
      const target = Number.isInteger(index)
        ? scope.querySelectorAll(selector)[index]
        : scope.querySelector(selector);
      if(!target)return;
      const button=create('button','wwz-v32-community-local-link');
      button.type='button';button.textContent=title;
      button.addEventListener('click',()=>{
        buttons.forEach(b=>b.removeAttribute('aria-current'));
        button.setAttribute('aria-current','location');
        scrollTo(target);
      });
      buttons.push(button);
      nav.append(button);
    });
    if(nav.children.length)scope.prepend(nav);
  };
  const community=document.querySelector('[data-view-panel="community"]');
  const hub=community?.querySelector('.community-hub');
  makeLocalNav(hub,[
    ['Overview','[data-dashboard-section="analytics"]'],
    ['Event calendar','[data-dashboard-section="events"]'],
    ['Vehicle claims','[data-dashboard-section="bounties"]'],
    ['Notifications','[data-dashboard-section="notifications"]']
  ],'Community sections');
  const factionContent=document.querySelector('[data-view-panel="factions"] [data-faction-content]');
  makeLocalNav(factionContent,[
    ['My faction','.faction-my-card'],
    ['Invitations','.faction-member-inbox-grid'],
    ['Directory','.faction-directory'],
    ['Registration','.faction-registration-card']
  ],'Faction sections');
  if(factionContent){
    insertHeading(factionContent.querySelector('.faction-my-card'),
      'Your faction','Membership, invitations and group operations');
    insertHeading(factionContent.querySelector('.faction-summary-grid'),
      'Faction directory','Explore groups and recruitment on this server');
  }
  const objectiveContent=document.querySelector('[data-view-panel="objectives"] [data-objectives-content]');
  makeLocalNav(objectiveContent,[
    ['Daily / weekly','.objectives-reset-grid'],
    ['Quest career','.quest-career-panel'],
    ['Bounties','[data-dashboard-section="network"]'],
    ['Contracts','.objective-column-grid',1]
  ],'Objective sections');
  if(objectiveContent){
    insertHeading(objectiveContent.querySelector('.quest-career-panel'),
      'Quest career','Permanent objectives, rewards and milestones');
    insertHeading(objectiveContent.querySelector('.objective-column-grid'),
      'Active challenges','Your current daily and weekly quests');
    insertHeading(objectiveContent.querySelector('[data-dashboard-section="network"]'),
      'Bounties & contracts','Player-funded targets and public challenges');
  }
  const progressionContent=document.querySelector('[data-view-panel="progression"] [data-progression-content]');
  makeLocalNav(progressionContent,[
    ['Level & prestige','.progression-hero'],
    ['XP sources','.progression-source-grid'],
    ['Achievements','.progression-badge-grid'],
    ['Leaderboard','.progression-leaderboard']
  ],'Progression sections');
  if(progressionContent){
    insertHeading(progressionContent.querySelector('.progression-hero'),
      'Your progression','Current level, prestige and XP contribution');
    insertHeading(progressionContent.querySelector('.progression-source-grid'),
      'Earning XP','Verified activity and rewards');
    const ranking=progressionContent.querySelector('.progression-leaderboard')?.closest('.panel');
    insertHeading(ranking,'Community rankings','Server-scoped progression and leaderboards');
  }

  // Re-read allowed links on auth changes so extra staff-only routes are never
  // exposed by stale UI, even when users change their session or server.
  const sync = (event) => {
    const activeView=event?.detail?.view ||
      document.querySelector('.dashboard-view.active[data-view-panel]')?.dataset.viewPanel || '';
    destinationNavs.forEach(nav=>nav.querySelectorAll('[data-wwz-v32-target]').forEach(btn=>{
      const match=btn.dataset.wwzV32Target===activeView;
      if(match)btn.setAttribute('aria-current','page');
      else btn.removeAttribute('aria-current');
      const route=routes.find(item=>item.view===btn.dataset.wwzV32Target);
      btn.disabled=!(route && getRoute(route.view,route.section));
    }));
  };
  window.addEventListener('wwz:viewchange',sync);
  window.addEventListener('wwz:accesschange',sync);
  window.addEventListener('wwz:authchange',sync);
  sync();
})();
