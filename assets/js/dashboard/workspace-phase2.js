/* WWZ Phase 2 - workflow-first dashboard navigation and safe form assistance.
 * Runs on the existing page; all navigation delegates to the original controls.
 * Only navigation keys are stored locally. No player data, API requests or server writes.
 */
(() => {
  'use strict';
  const root = document.querySelector('.dashboard-sidebar .sidebar-navigation');
  if (!root) return;
  const $ = (query, within = document) => within.querySelector(query);
  const $$ = (query, within = document) => Array.from(within.querySelectorAll(query));
  const groups = $$('details[data-nav-group]', root);
  const ordered = {
    'Dashboard': ['Overview', 'Action Centre'],
    'Server & World': [
      'World Map', 'Live Server Status', 'Event Calendar', 'Public Locations',
      'Operational Health', 'Flag Claims', 'Vehicle Bounties', 'Community Analytics',
      'Command Library', 'Notifications', 'App & PWA', 'Event Planner', 'Refresh Data'
    ],
    'My Account': [
      'Survivor Profile', 'Activity & Combat', 'XP & Prestige',
      'Daily & Weekly Quests', 'Bounties & Contracts', 'Factions',
      'Wallet & Economy', 'WWZ Bank', 'Economy Ledger', 'Community Treasury',
      'Account Centre', 'Support Tickets', 'My Appeals'
    ],
    'Shop & Trader': ['Member Shop', 'My Shop Orders', 'Saved Delivery Locations'],
    'Administration': [
      'Command Centre', 'Player Intelligence', 'Moderation Centre',
      'Moderation Queue', 'Moderation Cases', 'Current Ban Lists', 'Identity Sync',
      'Server Controls', 'Operations Centre', 'Operational Failures',
      'Zones', 'Zone Map', 'Online Players', 'Server Feeds', 'Rules Manager',
      'Shop Fulfilment', 'Automatic Delivery Queue', 'Economy Panels',
      'Donation Manager', 'Donation Orders', 'Ticket Administration',
      'Flag Claims Manager', 'Faction Administration',
      'Objective Administration', 'XP Configuration'
    ],
    'Owner Configuration': [
      'DayZ Service Overview', 'Mission File Editor', 'Structured Configuration',
      'Events And Zones', 'Configuration Workflow', 'Backup History',
      'Data Management Centre', 'Shop Catalogue', 'Event Item Catalogue',
      'Shop Settings', 'Quest Settings', 'Ticket Settings', 'Discord Onboarding',
      'Community Tools', 'Notifications & Webhooks', 'Discord Logs', 'Appeal Settings'
    ],
    'Account & Help': ['Discord Connection', 'Access Levels', 'Dashboard Help']
  };
  const labelOf = (link) => link.dataset.navLabel || $('strong', link)?.textContent?.trim() || link.textContent.trim();
  const titleOf = (group) => group.querySelector(':scope > summary strong')?.textContent?.trim() || '';
  const links = $$('button.side-link[data-view]', root);
  const routeOf = (link) => link.dataset.view + '/' + (link.dataset.section || '');
  // The sidebar is intentionally inert and aria-hidden while the mobile drawer
  // is CLOSED. That must not hide legitimate links from search/pins on open.
  const canShow = (link) => Boolean(link && !link.disabled && !link.hidden &&
    !link.closest('[hidden]'));
  const findRoute = (route) => links.find((link) => routeOf(link) === route && canShow(link));

  const sortGroups = () => {
    groups.forEach((group) => {
      const host = $('.nav-group-links', group);
      if (!host) return;
      const ranks = ordered[titleOf(group)] || [];
      const items = Array.from(host.children);
      items.sort((a, b) => {
        const ia = ranks.indexOf(labelOf(a));
        const ib = ranks.indexOf(labelOf(b));
        const ra = ia < 0 ? Number.MAX_SAFE_INTEGER : ia;
        const rb = ib < 0 ? Number.MAX_SAFE_INTEGER : ib;
        return ra - rb; // Stable: preserve original order for unlisted tools.
      });
      host.append(...items); // Reuse existing nodes and event handlers.
    });
  };
  sortGroups();

  const PIN_KEY = 'wwz:dashboard:pins:v2';
  const RECENT_KEY = 'wwz:dashboard:recent:v2';
  const read = (key) => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(data) ? data.filter((value) =>
        typeof value === 'string' && /^[a-z0-9_-]+\/[a-z0-9_-]*$/i.test(value)).slice(0, 8) : [];
    } catch { return []; }
  };
  const write = (key, values) => {
    try { localStorage.setItem(key, JSON.stringify(values)); }
    catch { /* Private-browsing restrictions must never break navigation. */ }
  };
  let pins = read(PIN_KEY);
  let recents = read(RECENT_KEY);

  const controls = document.createElement('section');
  controls.className = 'wwz-workspace-discovery';
  controls.setAttribute('aria-label', 'Find and save dashboard tools');
  controls.innerHTML = [
    '<div class="wwz-discovery-heading"><strong>Explore workspaces</strong>',
    '<button type="button" data-wwz-open-search aria-label="Open full tool search">All tools ↗</button></div>',
    '<label class="wwz-discovery-search"><span aria-hidden="true">⌕</span>',
    '<input type="search" data-wwz-nav-search aria-label="Filter sidebar workspaces" ',
    'autocomplete="off" placeholder="Find a workspace…"></label>',
    '<p class="wwz-discovery-empty" data-wwz-nav-empty role="status" hidden>',
    'No accessible workspaces match. Try the full tool search.</p>',
    '<div class="wwz-discovery-shortcuts" data-wwz-pinned-section hidden>',
    '<div class="wwz-discovery-caption"><strong>★ Pinned</strong>',
    '<button type="button" data-wwz-unpin-all>Clear</button></div>',
    '<div class="wwz-discovery-links" data-wwz-pinned></div></div>',
    '<div class="wwz-discovery-shortcuts" data-wwz-recent-section hidden>',
    '<div class="wwz-discovery-caption"><strong>Recently opened</strong></div>',
    '<div class="wwz-discovery-links" data-wwz-recent></div></div>',
  ].join('');
  root.before(controls);
  const search = $('[data-wwz-nav-search]', controls);
  const empty = $('[data-wwz-nav-empty]', controls);
  const pinnedHost = $('[data-wwz-pinned]', controls);
  const recentHost = $('[data-wwz-recent]', controls);
  $('[data-wwz-open-search]', controls)?.addEventListener('click', () =>
    document.querySelector('[data-open-command-search]')?.click());

  const syncGroupCounts = () => {
    groups.forEach((group) => {
      const count = $$('.nav-group-links > .side-link', group)
        .filter(canShow).length;
      group.classList.toggle('wwz-workspace-empty-role', count === 0);
      const counter = group.querySelector(':scope > summary small');
      if (counter) counter.textContent = String(count);
    });
  };

  const renderShortcuts = (host, sectionSelector, values) => {
    const section = $(sectionSelector, controls);
    host.replaceChildren();
    values.forEach((route) => {
      const target = findRoute(route);
      if (!target) return; // Never surface admin tools hidden by auth.
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'wwz-discovery-link';
      const title = document.createElement('span');
      title.textContent = labelOf(target);
      const icon = document.createElement('span');
      icon.textContent = '↗';
      icon.setAttribute('aria-hidden', 'true');
      item.append(title, icon);
      item.addEventListener('click', () => {
        if (canShow(target)) target.click(); // Original router retains permissions.
      });
      host.append(item);
    });
    section.hidden = !host.childElementCount;
  };
  const renderSaved = () => {
    renderShortcuts(pinnedHost, '[data-wwz-pinned-section]', pins);
    renderShortcuts(recentHost, '[data-wwz-recent-section]', recents.filter((key) => !pins.includes(key)).slice(0, 3));
  };

  const locationActions = $('.wwz-location-actions');
  const pinButton = document.createElement('button');
  pinButton.type = 'button';
  pinButton.className = 'wwz-pin-workspace';
  pinButton.textContent = '☆ Pin workspace';
  pinButton.setAttribute('aria-pressed', 'false');
  if (locationActions) locationActions.append(pinButton);

  const syncCurrentPin = () => {
    const active = $('.sidebar-navigation .side-link.active[data-view]');
    const route = active && canShow(active) ? routeOf(active) : '';
    pinButton.hidden = !route;
    pinButton.dataset.route = route;
    const selected = pins.includes(route);
    pinButton.textContent = selected ? '★ Pinned' : '☆ Pin workspace';
    pinButton.setAttribute('aria-pressed', String(selected));
  };
  pinButton.addEventListener('click', () => {
    const route = pinButton.dataset.route;
    if (!findRoute(route)) return;
    pins = pins.includes(route) ? pins.filter((item) => item !== route) : [route, ...pins].slice(0, 8);
    write(PIN_KEY, pins);
    renderSaved();
    syncCurrentPin();
  });
  $('[data-wwz-unpin-all]', controls)?.addEventListener('click', () => {
    pins = [];
    write(PIN_KEY, pins);
    renderSaved();
    syncCurrentPin();
  });

  const clearSearch = () => {
    search.value = '';
    document.body.classList.remove('wwz-sidebar-searching');
    groups.forEach((group) => {
      group.classList.remove('wwz-nav-filtered-out');
      $$('.side-link', group).forEach((link) => link.classList.remove('wwz-nav-filtered-out'));
    });
    empty.hidden = true;
  };
  const filter = () => {
    const needle = search.value.trim().toLocaleLowerCase();
    document.body.classList.toggle('wwz-sidebar-searching', !!needle);
    let matching = 0;
    groups.forEach((group) => {
      const titleMatches = titleOf(group).toLocaleLowerCase().includes(needle);
      let groupMatches = 0;
      $$('.side-link', group).forEach((link) => {
        const permitted = canShow(link);
        const text = (labelOf(link) + ' ' + (link.querySelector('small')?.textContent || '')).toLocaleLowerCase();
        const matches = permitted && (!needle || titleMatches || text.includes(needle));
        link.classList.toggle('wwz-nav-filtered-out', Boolean(needle) && !matches);
        if (matches) groupMatches++;
      });
      matching += groupMatches;
      group.classList.toggle('wwz-nav-filtered-out', Boolean(needle) && groupMatches === 0);
      if (needle && groupMatches) group.open = true;
    });
    empty.hidden = !needle || matching > 0;
    if (!needle) {
      const selected = $('.sidebar-navigation .side-link.active');
      const group = selected?.closest('details[data-nav-group]');
      if (group) group.open = true;
    }
  };
  search.addEventListener('input', filter);
  search.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { clearSearch(); filter(); search.blur(); }
  });

  window.addEventListener('wwz:viewchange', (event) => {
    const view = String(event.detail?.view || '');
    const section = String(event.detail?.section || '');
    const route = view + '/' + section;
    if (findRoute(route)) {
      recents = [route, ...recents.filter((old) => old !== route)].slice(0, 6);
      write(RECENT_KEY, recents);
    }
    clearSearch();
    syncGroupCounts();
    renderSaved();
    syncCurrentPin();
  });
  const refreshAccess = () => {
    syncGroupCounts();
    renderSaved();
    syncCurrentPin();
    if (search.value) filter();
  };
  window.addEventListener('wwz:accesschange', refreshAccess);
  window.addEventListener('wwz:authchange', refreshAccess);
  syncGroupCounts();
  renderSaved();
  syncCurrentPin();

  // Enhance only existing native-validatable administrative fields.
  // This neither intercepts form submission nor calls a backend endpoint.
  let nextErrorId = 0;
  const eligibleField = (node) => Boolean(node?.matches?.(
    '.dashboard-view form input, .dashboard-view form select, .dashboard-view form textarea'
  ) && !node.disabled && !node.readOnly && !node.hidden &&
    !['hidden', 'checkbox', 'radio', 'file', 'range', 'color'].includes(node.type) &&
    !node.closest('[hidden], .leaflet-container'));
  const validate = (field) => {
    if (!eligibleField(field)) return;
    const invalid = !field.validity.valid;
    field.classList.toggle('wwz-field-invalid', invalid);
    let feedback = field.nextElementSibling?.matches?.('[data-wwz-field-feedback]')
      ? field.nextElementSibling : null;
    if (!invalid && feedback) {
      const remaining = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter((word) => word && word !== feedback.id);
      if (remaining.length) field.setAttribute('aria-describedby', remaining.join(' '));
      else field.removeAttribute('aria-describedby');
      feedback.remove();
    }
    if (!invalid) return;
    if (!feedback) {
      feedback = document.createElement('span');
      feedback.id = 'wwz-field-error-' + (++nextErrorId);
      feedback.dataset.wwzFieldFeedback = '';
      feedback.className = 'wwz-inline-field-feedback';
      feedback.setAttribute('role', 'status');
      field.insertAdjacentElement('afterend', feedback);
      const current = field.getAttribute('aria-describedby') || '';
      field.setAttribute('aria-describedby', (current + ' ' + feedback.id).trim());
    }
    feedback.textContent = field.validity.valueMissing
      ? 'This field is required.'
      : field.validity.typeMismatch ? 'Enter a valid value.'
      : field.validity.rangeUnderflow || field.validity.rangeOverflow ? 'Value is outside the allowed range.'
      : field.validity.patternMismatch ? 'Check the requested format.' : 'Please check this field.';
  };
  document.addEventListener('focusout', (event) => {
    if (eligibleField(event.target)) {
      event.target.dataset.wwzFieldTouched = '';
      validate(event.target);
    }
  });
  document.addEventListener('input', (event) => {
    if (eligibleField(event.target) && event.target.hasAttribute('data-wwz-field-touched')) validate(event.target);
  });
  document.addEventListener('change', (event) => {
    if (eligibleField(event.target) && event.target.hasAttribute('data-wwz-field-touched')) validate(event.target);
  });

  // Native reset should also remove our purely visual validation feedback.
  document.addEventListener('reset', (event) => {
    if (!event.target?.closest?.('.dashboard-view')) return;
    queueMicrotask(() => {
      event.target.querySelectorAll('[data-wwz-field-touched]').forEach((field) => {
        delete field.dataset.wwzFieldTouched;
        field.classList.remove('wwz-field-invalid');
        const feedback = field.nextElementSibling?.matches?.('[data-wwz-field-feedback]')
          ? field.nextElementSibling : null;
        if (!feedback) return;
        const remaining = (field.getAttribute('aria-describedby') || '')
          .split(/\s+/).filter((word) => word && word !== feedback.id);
        if (remaining.length) field.setAttribute('aria-describedby', remaining.join(' '));
        else field.removeAttribute('aria-describedby');
        feedback.remove();
      });
    });
  });
})();
