/* WWZ V3.2 – Economy workspace navigation only.
 * Uses existing sidebar routes and their access checks; does not touch
 * balances, data loaders, deposit/withdraw, treasury actions or checkout.
 */
(() => {
  'use strict';
  const panel=document.querySelector('body.wwz-v3-dashboard [data-view-panel="economy"]');
  if(!panel) return;
  const tabs=Array.from(panel.querySelectorAll('[data-v32-finance-target]'));
  const allowedSections=new Set(['wallet','banking','treasury','ledger']);
  const canNavigate=(link)=>Boolean(link && !link.hidden && !link.disabled &&
    !link.closest('[hidden]'));
  const route=(section)=>Array.from(document.querySelectorAll('.sidebar-navigation .side-link[data-view="economy"]'))
    .find(link=>link.dataset.section===section && canNavigate(link));
  const mark=(section)=>{
    tabs.forEach(button=>{
      if(button.dataset.v32FinanceTarget===section) button.setAttribute('aria-current','location');
      else button.removeAttribute('aria-current');
    });
  };
  tabs.forEach(button=>button.addEventListener('click',()=>{
    const section=button.dataset.v32FinanceTarget;
    if(!allowedSections.has(section))return;
    const existing=route(section);
    if(!existing)return;
    existing.click(); // Delegates to original history, permission and scroll router.
  }));
  window.addEventListener('wwz:viewchange',event=>{
    if(event.detail?.view!=='economy')return;
    mark(allowedSections.has(event.detail?.section)?event.detail.section:'wallet');
  });
  const active=document.querySelector('.sidebar-navigation .side-link.active[data-view="economy"]');
  if(active)mark(active.dataset.section||'wallet');
})();
