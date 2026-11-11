/* World War Z V3.12 — Overview Workspace Directory.
   Display and navigate only existing permitted sidebar routes. No new backend calls
   and no duplicate route handlers. Owner/staff groups are hidden by auth first. */
(function (root) {
  'use strict';
  const norm=(value)=>String(value||'').toLocaleLowerCase('en-AU').trim().replace(/\s+/g,' ');
  const allowed=(link)=>{
    if(!link||link.disabled||link.hidden||link.closest('[hidden]'))return false;
    const view=link.dataset?.view;
    // Retired map experiences must not be rediscovered from old HTML.
    if(!view||view==='livoniapvp'||view==='trader')return false;
    return Boolean(link.matches?.('button.side-link[data-view]'));
  };
  const routeId=(link)=>String(link.dataset.view||'')+'/'+String(link.dataset.section||'');
  const categoryOf=(link)=>String(link.closest('[data-nav-group]')?.querySelector(':scope > summary strong')?.textContent||'Other').trim();
  const infoOf=(link)=>({
    id:routeId(link),
    category:categoryOf(link),
    title:String(link.dataset.navLabel||link.querySelector('.side-link-copy strong')?.textContent||'Workspace').trim(),
    description:String(link.querySelector('.side-link-copy small')?.textContent||'Open this section').trim(),
    link
  });
  const visibleRoutes=(rootElement)=>{
    const seen=new Set();
    return [...(rootElement?.querySelectorAll('button.side-link[data-view]')||[])]
      .filter(allowed).map(infoOf).filter(item=>{
        if(seen.has(item.id))return false;
        seen.add(item.id);return true;
      });
  };
  const filterRoutes=(items,query,category)=>items.filter(item=>
    (!category||item.category===category) &&
    (!norm(query)||norm([item.title,item.description,item.category].join(' ')).includes(norm(query)))
  );
  const exports=Object.freeze({norm,allowed,routeId,visibleRoutes,filterRoutes});
  if(typeof module==='object'&&module.exports)module.exports=exports;
  if(root)root.WWZWorkspaceDirectory=exports;
  if(typeof document==='undefined')return;

  const init=()=>{
    const panel=document.querySelector('[data-v312-directory]');
    const nav=document.querySelector('.dashboard-sidebar .sidebar-navigation');
    if(!panel||!nav||panel.dataset.v312Ready)return;
    const count=panel.querySelector('[data-v312-count]');
    const search=panel.querySelector('[data-v312-search]');
    const category=panel.querySelector('[data-v312-category]');
    const feedback=panel.querySelector('[data-v312-feedback]');
    const results=panel.querySelector('[data-v312-results]');
    const more=panel.querySelector('[data-v312-more]');
    if(!count||!search||!category||!feedback||!results||!more)return;
    let showAll=false;

    function buildCategories(items){
      const previous=category.value;
      const options=[...new Set(items.map(item=>item.category))];
      const option=(value,label)=>{const el=document.createElement('option');el.value=value;el.textContent=label;return el;};
      category.replaceChildren(option('','All categories'),...options.map(value=>option(value,value)));
      category.value=options.includes(previous)?previous:'';
    }
    function render(){
      const items=visibleRoutes(nav);
      buildCategories(items);
      count.textContent=items.length+' accessible tools';
      results.replaceChildren();
      const filtered=filterRoutes(items,search.value,category.value);
      const shown=showAll?filtered:filtered.slice(0,12);
      feedback.textContent=filtered.length
        ? 'Showing '+shown.length+' of '+filtered.length+' matching workspaces.'
        : 'No accessible workspaces match. Try another search.';
      for(const item of shown){
        const button=document.createElement('button');
        button.type='button';button.className='wwz-v312-route';
        const heading=document.createElement('span');heading.className='wwz-v312-route-group';heading.textContent=item.category;
        const title=document.createElement('strong');title.textContent=item.title;
        const description=document.createElement('small');description.textContent=item.description;
        const arrow=document.createElement('span');arrow.className='wwz-v312-route-arrow';
        arrow.textContent='›';arrow.setAttribute('aria-hidden','true');
        const copy=document.createElement('span');copy.className='wwz-v312-route-copy';
        copy.append(heading,title,description);
        button.append(copy,arrow);
        button.addEventListener('click',()=>{
          // Re-check at action time; access may have changed after rendering.
          if(!allowed(item.link)){render();return;}
          panel.open=false;item.link.click(); // Original router owns navigation/permissions.
        });
        results.append(button);
      }
      more.hidden=showAll||filtered.length<=12;
      if(!more.hidden)more.textContent='Show all '+filtered.length+' matching workspaces';
    }
    const change=()=>{showAll=false;render();};
    search.addEventListener('input',change);
    category.addEventListener('change',change);
    panel.addEventListener('toggle',()=>{if(panel.open)render();});
    more.addEventListener('click',()=>{showAll=true;render();});
    window.addEventListener('wwz:accesschange',render);
    window.addEventListener('wwz:authchange',render);
    window.addEventListener('wwz:viewchange',()=>{if(panel.open)render();});
    // Auth can change individual link.hidden without a custom event in older sessions.
    const observer=new MutationObserver(records=>{
      if(records.some(record=>record.attributeName==='hidden'||record.attributeName==='disabled'))
        render();
    });
    observer.observe(nav,{subtree:true,attributes:true,attributeFilter:['hidden','disabled']});
    render();
    panel.dataset.v312Ready='1';
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})(typeof window!=='undefined'?window:null);
