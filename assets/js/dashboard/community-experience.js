/* WWZ v1.64.0 — presentation shortcuts only.
 * Existing dashboard, faction, ticket, action-centre and map handlers stay authoritative.
 * No network requests, stored role overrides, or mutation of server data here. */
(() => {
  'use strict';
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const scrollTo = (selector, scope = document) => {
    const target = $(selector, scope);
    if (!target || target.closest('[hidden]')) return false;
    target.scrollIntoView({ block: 'start', behavior: 'smooth' });
    return true;
  };
  const navigation = Object.freeze({
    'action-support': '[data-view="tickets"][data-section="support"]',
    'support-appeals': '[data-view="appeals"][data-section="my-appeals"]'
  });
  const actions = Object.freeze({
    'action-active': () => $('[data-action-centre-view="active"]')?.click(),
    'action-unread': () => $('[data-action-centre-view="unread"]')?.click(),
    'faction-directory': () => scrollTo('[data-faction-directory]', $('[data-view-panel="factions"]')),
    'faction-invites': () => scrollTo('.faction-member-inbox-grid', $('[data-view-panel="factions"]')),
    'faction-request': () => scrollTo('[data-faction-registration-card]', $('[data-view-panel="factions"]')),
    'support-open': () => $('[data-view-panel="tickets"] [data-open-ticket-create]')?.click(),
    'support-history': () => scrollTo('.ticket-member-panel', $('[data-view-panel="tickets"]')),
    'map-search': () => { const input = $('[data-view-panel="map"] [data-map-search]'); input?.focus(); input?.scrollIntoView({ block:'nearest', behavior:'smooth' }); },
    'map-reset': () => $('[data-view-panel="map"] [data-map-reset]')?.click(),
    'map-fullscreen': () => $('[data-view-panel="map"] [data-map-fullscreen]')?.click()
  });
  document.addEventListener('click', (event) => {
    const control = event.target.closest?.('button[data-community-action],button[data-community-toggle]');
    if (!control || control.disabled || control.closest('[hidden]')) return;
    const action = control.dataset.communityAction;
    if (action) {
      if (Object.hasOwn(navigation,action)) {
        const nav = $('.sidebar-navigation '+navigation[action]);
        // Respect any hidden, restricted, or unavailable navigation destination.
        if (nav && !nav.hidden && !nav.closest('[hidden]')) nav.click();
      } else if (Object.hasOwn(actions,action)) actions[action]();
      return;
    }
    const toggle = control.dataset.communityToggle;
    const id = toggle === 'action-filters' ? 'wwz-action-filters' : toggle === 'map-filters' ? 'wwz-map-filters' : '';
    const target = id && document.getElementById(id);
    if (!target) return;
    const expanded = target.classList.toggle('wwz-community-filters-open');
    control.setAttribute('aria-expanded', String(expanded));
  });
  const invited = $('[data-my-faction-invite-count]');
  const shown = $('[data-community-invite-count]');
  if (invited && shown && typeof MutationObserver !== 'undefined') {
    const sync = () => { shown.textContent = invited.textContent.trim() || '0 pending'; };
    sync();
    new MutationObserver(sync).observe(invited, { characterData:true, childList:true, subtree:true });
  }
})();
