/* World War Z V3.1 — compact and accessible dashboard navigation.
 * Reuses existing route controls and Phase 2 pinned/recent state.
 * Presentation only: zero fetches, no protected-action handlers.
 */
(() => {
  'use strict';
  const sidebar = document.querySelector('body.wwz-v3-dashboard .dashboard-sidebar');
  const groupsRoot = sidebar?.querySelector('.sidebar-navigation');
  const quick = sidebar?.querySelector('.wwz-quick-navigation');
  const quickLinks = quick?.querySelector('.wwz-quick-links');
  const discovery = sidebar?.querySelector('.wwz-workspace-discovery');
  if (!sidebar || !groupsRoot || !quick || !quickLinks || !discovery ||
      sidebar.classList.contains('wwz-v31-ready')) return;

  // Move original clickable buttons; never clone or replace their listeners.
  const primary = document.createElement('nav');
  primary.className = 'wwz-v31-primary';
  primary.setAttribute('aria-label', 'Primary dashboard destinations');
  const destinations = [
    '[data-jump="overview"][data-jump-section="summary"]',
    '[data-jump="map"][data-jump-section="explorer"]',
    '[data-jump="community"][data-jump-section="events"]',
    'a[href="shop.html"]',
  ];
  destinations.forEach((selector) => {
    const item = quickLinks.querySelector(selector);
    if (!item) return;
    item.classList.add('wwz-v31-primary-link');
    primary.append(item);
  });
  if (!primary.children.length) return;
  quick.before(primary);

  // The same finder now sits directly beneath the essential destinations.
  // Phase 2 still owns all filtering, pinning and permissions.
  primary.after(discovery);
  const searchHeading = discovery.querySelector('.wwz-discovery-heading > strong');
  if (searchHeading) searchHeading.textContent = 'Find a workspace';
  const allTools = discovery.querySelector('[data-wwz-open-search]');
  if (allTools) allTools.textContent = 'All tools';

  // Saved links are useful, but should not force everyone to scroll past
  // up to eight pinned and three recent destinations on every visit.
  const saved = document.createElement('details');
  saved.className = 'wwz-v31-saved';
  const savedSummary = document.createElement('summary');
  savedSummary.textContent = 'Pinned & recent';
  const savedCount = document.createElement('span');
  savedCount.className = 'wwz-v31-saved-count';
  savedSummary.append(savedCount);
  saved.append(savedSummary);
  const savedPanels = [
    discovery.querySelector('[data-wwz-pinned-section]'),
    discovery.querySelector('[data-wwz-recent-section]'),
  ].filter(Boolean);
  savedPanels.forEach((panel) => saved.append(panel));
  discovery.append(saved);
  const pinnedHost = discovery.querySelector('[data-wwz-pinned]');
  const recentHost = discovery.querySelector('[data-wwz-recent]');
  const syncSaved = () => {
    const count = (pinnedHost?.childElementCount || 0) + (recentHost?.childElementCount || 0);
    saved.hidden = count === 0;
    savedCount.textContent = count ? String(count) : '';
  };
  syncSaved();
  // Keep navigation compact on first load. Survivors can expand this at any time.
  saved.open = false;
  if (typeof MutationObserver === 'function') {
    const observer = new MutationObserver(syncSaved);
    if (pinnedHost) observer.observe(pinnedHost, { childList: true });
    if (recentHost) observer.observe(recentHost, { childList: true });
  }

  // Keep less-used quick actions available behind a small native disclosure.
  const more = document.createElement('details');
  more.className = 'wwz-v31-more';
  const moreSummary = document.createElement('summary');
  moreSummary.textContent = 'More shortcuts';
  more.append(moreSummary);
  quick.replaceWith(more);
  more.append(quick);

  // Section separators are visual only. All route buttons remain under their
  // original access-controlled groups and keep their existing DOM identity.
  const sections = {
    'Server & World': [
      ['World Map', 'Explore Nasdara'],
      ['Operational Health', 'Live operations'],
      ['Community Analytics', 'Community tools'],
    ],
    'My Account': [
      ['Survivor Profile', 'My survivor'],
      ['Factions', 'Community'],
      ['Wallet & Economy', 'Economy & banking'],
      ['Account Centre', 'Account & support'],
    ],
    'Administration': [
      ['Command Centre', 'Command & intelligence'],
      ['Server Controls', 'Live operations'],
      ['Shop Fulfilment', 'Orders & community'],
    ],
    'Owner Configuration': [
      ['DayZ Service Overview', 'Mission & configuration'],
      ['Shop Catalogue', 'Economy & commerce'],
      ['Discord Onboarding', 'Discord & settings'],
    ],
  };
  const categoryName = (group) =>
    group.querySelector(':scope > summary strong')?.textContent?.trim() || '';
  const labelOf = (link) =>
    link.dataset.navLabel || link.querySelector('.side-link-copy strong')?.textContent?.trim() || '';
  const groups = Array.from(groupsRoot.querySelectorAll('details[data-nav-group]'));
  groups.forEach((group) => {
    const host = group.querySelector('.nav-group-links');
    if (!host) return;
    const headings = sections[categoryName(group)] || [];
    headings.forEach(([anchorLabel, title]) => {
      const anchor = Array.from(host.querySelectorAll('.side-link'))
        .find((link) => labelOf(link) === anchorLabel);
      if (!anchor) return;
      const marker = document.createElement('p');
      marker.className = 'wwz-v31-section-label';
      marker.textContent = title;
      marker.setAttribute('aria-hidden', 'true');
      host.insertBefore(marker, anchor);
    });
    host.querySelectorAll('.side-link').forEach((link) => {
      const description = link.querySelector('.side-link-copy small')?.textContent?.trim();
      if (description && !link.hasAttribute('title')) {
        link.title = labelOf(link) + ' — ' + description;
      }
    });
  });

  // Reflect only visible authorized destinations, never cached admin records.
  const countLabel = document.createElement('span');
  countLabel.className = 'wwz-v31-route-count';
  const caption = sidebar.querySelector('.wwz-nav-subheading');
  if (caption) {
    caption.textContent = 'All workspaces';
    caption.append(countLabel);
  }
  const allowed = (link) => Boolean(link && !link.hidden && !link.disabled &&
    !link.closest('[hidden]'));
  const syncRoutes = () => {
    const accessible = Array.from(groupsRoot.querySelectorAll('.side-link[data-view]'))
      .filter(allowed);
    countLabel.textContent = accessible.length + ' tools';
    const active = groupsRoot.querySelector('.side-link.active[data-view]');
    primary.querySelectorAll('.wwz-v31-primary-link').forEach((item) => {
      const match = active && item.dataset.jump === active.dataset.view &&
        (item.dataset.jumpSection || '') === (active.dataset.section || '');
      item.classList.toggle('wwz-v31-current', Boolean(match));
      if (match) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
    syncSaved();
  };
  window.addEventListener('wwz:viewchange', syncRoutes);
  window.addEventListener('wwz:accesschange', syncRoutes);
  window.addEventListener('wwz:authchange', syncRoutes);
  syncRoutes();
  sidebar.classList.add('wwz-v31-ready');
})();
