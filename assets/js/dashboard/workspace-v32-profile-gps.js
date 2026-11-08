/* World War Z V3.2 – Profile section jumps and safe GPS Journey wayfinding.
 * Delegates all cross-workspace navigation to the existing dashboard router;
 * does not fetch data, change player data or create a map.
 */
(() => {
  'use strict';
  const panel = document.querySelector('body.wwz-v3-dashboard [data-view-panel="players"]');
  if (!panel) return;
  const tabs = Array.from(panel.querySelectorAll('[data-v32-profile-tab]'));
  const targets = {
    identity: '#dashboard-profile-account',
    activity: '#dashboard-profile-activity',
    records: '#dashboard-profile-career',
  };
  const mark = (current) => {
    tabs.forEach((tab) => {
      if (tab.dataset.v32ProfileTab === current) tab.setAttribute('aria-current', 'location');
      else tab.removeAttribute('aria-current');
    });
  };
  tabs.forEach((tab) => tab.addEventListener('click', () => {
    const key = tab.dataset.v32ProfileTab;
    const target = panel.querySelector(targets[key] || '[data-profile-content]');
    if (!target) return;
    mark(key);
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
  const findExistingRoute = (view, section) =>
    Array.from(document.querySelectorAll('.sidebar-navigation .side-link[data-view]'))
      .find((link) => link.dataset.view === view &&
        (link.dataset.section || '') === section &&
        !link.hidden && !link.disabled && !link.closest('[hidden]'));

  // The My WWZ GPS history remains inside Overview because the map runtime
  // currently owns that container. Jumping between workspaces does not move
  // or recreate its Leaflet map or playback controller.
  let journeyObserver = null;
  let journeyTimeout = null;
  const stopWatching = () => {
    journeyObserver?.disconnect();
    journeyObserver = null;
    if (journeyTimeout !== null) window.clearTimeout(journeyTimeout);
    journeyTimeout = null;
  };
  const awaitJourney = () => {
    stopWatching();
    const overview = document.querySelector('[data-view-panel="overview"]');
    if (!overview) return;
    const check = () => {
      if (!overview.classList.contains('active')) {
        stopWatching();
        return;
      }
      const journey = overview.querySelector('[data-my-wwz-gps]:not([hidden])');
      if (!journey) return;
      stopWatching();
      journey.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    journeyObserver = new MutationObserver(check);
    journeyObserver.observe(overview, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
    journeyTimeout = window.setTimeout(() => {
      const fallback = overview.querySelector('.my-wwz-shell');
      stopWatching();
      fallback?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 8000);
    window.setTimeout(check, 240);
  };
  const journeyButton = panel.querySelector('[data-v32-journey-open]');
  journeyButton?.addEventListener('click', () => {
    const link = findExistingRoute('overview', 'summary');
    if (!link) return;
    link.click();
    awaitJourney();
  });

  // The return control is inside the asynchronously loaded personal home.
  // Use one delegated handler and the original permission-aware route.
  document.addEventListener('click', (event) => {
    if (!event.target?.closest?.('[data-v32-profile-return]')) return;
    const link = findExistingRoute('players', 'identity');
    link?.click();
  });
  window.addEventListener('wwz:viewchange', (event) => {
    if (event.detail?.view !== 'overview') stopWatching();
    if (event.detail?.view === 'players') mark('identity');
  });
})();
