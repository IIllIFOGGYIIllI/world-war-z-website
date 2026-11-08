/* WWZ V3.3 administration and owner workspace navigator.
 * Safe navigation only: original sidebar routes provide access control,
 * deep-link state and scrolling. This file never calls an API or privileged action.
 */
(() => {
  'use strict';
  const root=document.querySelector('body.wwz-v3-dashboard');
  if (!root || root.dataset.wwzV33AdminReady==='1')return;
  const findRoute=(view,section)=>Array.from(document.querySelectorAll('.sidebar-navigation .side-link[data-view]'))
    .find(link=>link.dataset.view===view && link.dataset.section===section &&
      !link.hidden && !link.disabled && !link.closest('[hidden]'));
  const destinations={
    staff:[
      ['Operations','staff','command-centre','▥'],
      ['Moderation','staff','moderation-centre','⚑'],
      ['Players','staff','players','◎'],
      ['Server health','staff','server-audit','◈'],
      ['Orders','staff','shop-orders','▣'],
      ['Controls','staff','server-controls','⛭']
    ],
    owner:[
      ['DayZ service','serverconfig','overview','◈'],
      ['Mission files','serverconfig','files','▣'],
      ['Catalogue','shopadmin','items','▤'],
      ['Backups','configuration','backups','↺'],
      ['Discord','configuration','discord-onboarding','◎'],
      ['Data tools','configuration','data-management','▥']
    ]
  };
  const additional={
    staff:[
      ['Players & safety',[
        ['Moderation queue','staff','queue'],['Cases','staff','cases'],
        ['Current bans','staff','banlists'],['Identity sync','staff','identity-sync'],
        ['Server rules','staff','rules']
      ]],
      ['Commerce & delivery',[
        ['Automatic deliveries','delivery','queue'],['Donation manager','staff','donations'],
        ['Donation orders','staff','donation-orders'],['Economy panels','staff','economy-panels']
      ]],
      ['Operations & recovery',[
        ['Operational failures','staff','failures'],['Event planner','community','planner'],
        ['Zones & KILLZONEs','zones','manage']
      ]]
    ],
    owner:[
      ['Mission configuration',[
        ['Structured controls','serverconfig','structured'],['Events & zones','serverconfig','events'],
        ['Configuration workflow','configuration','workflow']
      ]],
      ['Commerce',[
        ['Event item catalogue','shopadmin','event-items'],['Shop settings','shopadmin','settings'],
        ['Community tools','configuration','community-tools']
      ]],
      ['Discord & community',[
        ['Discord logs','configuration','discord-logs'],
        ['Webhooks','configuration','notifications'],
        ['Appeals','configuration','appeals']
      ]]
    ]
  };
  const make=(tag,cls,text)=>{
    const el=document.createElement(tag);
    if(cls)el.className=cls;
    if(text)el.textContent=text;
    return el;
  };
  const allNavs=[];
  const createNavigation=(panel,kind)=>{
    const heading=panel.querySelector(':scope > .view-heading');
    if(!heading)return;
    const nav=make('nav','wwz-v33-workspace-navigation');
    nav.setAttribute('aria-label',kind==='staff'?'Administration workspaces':'Owner workspaces');
    for(const [label,view,section,symbol] of destinations[kind]){
      const button=make('button','wwz-v33-route');
      button.type='button';
      button.dataset.wwzV33View=view;
      button.dataset.wwzV33Section=section;
      const icon=make('span','wwz-v33-nav-symbol',symbol);
      icon.setAttribute('aria-hidden','true');
      button.append(icon,make('span','',label));
      button.addEventListener('click',()=>findRoute(view,section)?.click());
      nav.append(button);
    }
    heading.after(nav);
    const more=make('details','wwz-v33-more-workspaces');
    more.append(make('summary','','More '+(kind==='staff'?'administration':'owner')+' tools'));
    const content=make('div','wwz-v33-more-inner');
    for(const [groupName,items] of additional[kind]){
      const group=make('section','wwz-v33-more-group');
      group.append(make('h3','',groupName));
      for(const [label,view,section] of items){
        const button=make('button','wwz-v33-secondary-route',label);
        button.type='button';
        button.dataset.wwzV33View=view;
        button.dataset.wwzV33Section=section;
        button.addEventListener('click',()=>findRoute(view,section)?.click());
        group.append(button);
      }
      content.append(group);
    }
    more.append(content);
    nav.after(more);
    allNavs.push({nav,more,kind});
  };
  const staff=document.querySelector('[data-view-panel="staff"]');
  if(staff)createNavigation(staff,'staff');
  for(const view of ['serverconfig','shopadmin','configuration']){
    const panel=document.querySelector('[data-view-panel="'+view+'"]');
    if(panel)createNavigation(panel,'owner');
  }
  const sync=(event)=>{
    const active=event?.detail?.view ||
      document.querySelector('.dashboard-view.active[data-view-panel]')?.dataset.viewPanel||'';
    const selected=event?.detail?.section ||
      document.querySelector('.sidebar-navigation .side-link.active[data-view]')?.dataset.section||'';
    allNavs.forEach(({nav,more})=>{
      for(const button of [...nav.querySelectorAll('button'),...more.querySelectorAll('button')]){
        const route=findRoute(button.dataset.wwzV33View,button.dataset.wwzV33Section);
        button.disabled=!route;
        if(button.dataset.wwzV33View===active && button.dataset.wwzV33Section===selected)
          button.setAttribute('aria-current','page');
        else button.removeAttribute('aria-current');
      }
    });
  };
  window.addEventListener('wwz:viewchange',sync);
  window.addEventListener('wwz:accesschange',sync);
  window.addEventListener('wwz:authchange',sync);
  sync();
  root.dataset.wwzV33AdminReady='1';
})();
