(() => {
  'use strict';

  const root = document.querySelector('[data-action-centre]');
  if (!root) { window.__wwzActionCentreReady = true; return; }

  const ENDPOINT = `${DASHBOARD_API_BASE}/api/account/action-centre`;
  const ACTION_ENDPOINT = `${DASHBOARD_API_BASE}/api/account/action-centre/action`;
  const qs = (selector) => root.querySelector(selector);
  const qsa = (selector) => [...root.querySelectorAll(selector)];
  const navBadge = document.querySelector('[data-action-centre-nav-badge]');
  const state = { payload: null, view: 'active', loading: false, timer: 0, active: false };

  const token = () => { try { return storageGet(AUTH_SESSION_KEY) || ''; } catch (_) { return ''; } };
  const access = () => String(state.payload?.access_level || 'member').toLowerCase();
  const isAdmin = () => ['staff', 'owner'].includes(access());
  const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
  const friendly = (value) => clean(value).replace(/[_-]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  const timeLabel = (value) => {
    if (!value) return 'No timestamp';
    try { return typeof formatUpdatedAt === 'function' ? formatUpdatedAt(value) : new Date(value).toLocaleString(); }
    catch (_) { return clean(value); }
  };
  const el = (tag, className = '', text = '') => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== '') node.textContent = String(text);
    return node;
  };
  const setText = (selector, value) => { const node = qs(selector); if (node) node.textContent = String(value ?? '0'); };
  const setMessage = (message = '', status = '') => {
    const node = qs('[data-action-centre-message]');
    if (!node) return;
    node.hidden = !message;
    node.textContent = String(message || '');
    if (status) node.dataset.state = status; else delete node.dataset.state;
  };

  const syncAuth = () => {
    const signedIn = Boolean(token());
    const guest = qs('[data-action-centre-guest]');
    const account = qs('[data-action-centre-authenticated]');
    if (guest) guest.hidden = signedIn;
    if (account) account.hidden = !signedIn;
    if (!signedIn && navBadge) navBadge.hidden = true;
    return signedIn;
  };

  const syncSummary = () => {
    const summary = state.payload?.summary || {};
    setText('[data-action-centre-actions]', Number(summary.actions) || 0);
    setText('[data-action-centre-unread]', Number(summary.unread) || 0);
    setText('[data-action-centre-urgent]', Number(summary.urgent) || 0);
    setText('[data-action-centre-archived]', Number(summary.archived) || 0);
    setText('[data-action-centre-admin-actions]', Number(summary.admin_actions) || 0);
    const adminCard = qs('[data-action-centre-admin-summary]');
    if (adminCard) adminCard.hidden = !isAdmin();
    const badgeCount = Math.max(Number(summary.unread) || 0, Number(summary.actions) || 0);
    if (navBadge) {
      navBadge.textContent = badgeCount > 99 ? '99+' : String(badgeCount);
      navBadge.hidden = badgeCount <= 0;
      navBadge.setAttribute('aria-label', `${badgeCount} Action Centre item${badgeCount === 1 ? '' : 's'} need attention`);
    }
  };

  const syncSources = () => {
    const select = qs('[data-action-centre-source]');
    if (!select) return;
    const selected = select.value || 'all';
    const sources = [...new Set((state.payload?.items || []).map((item) => clean(item.source)).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    select.replaceChildren(new Option('All sources', 'all'), ...sources.map((name) => new Option(friendly(name), name)));
    if ([...select.options].some((option) => option.value === selected)) select.value = selected;
  };

  const filteredItems = () => {
    const query = clean(qs('[data-action-centre-search]')?.value).toLowerCase();
    const source = qs('[data-action-centre-source]')?.value || 'all';
    const priority = qs('[data-action-centre-priority]')?.value || 'all';
    const kind = qs('[data-action-centre-kind]')?.value || 'all';
    return (state.payload?.items || []).filter((item) => {
      if (source !== 'all' && clean(item.source) !== source) return false;
      if (priority !== 'all' && clean(item.priority) !== priority) return false;
      if (kind !== 'all' && clean(item.kind) !== kind) return false;
      if (!query) return true;
      const haystack = [item.title,item.detail,item.category,item.source,item.status,item.priority,item.kind].map(clean).join(' ').toLowerCase();
      return haystack.includes(query);
    });
  };

  const performAction = async (action, itemKeys = []) => {
    if (!token() || state.loading) return false;
    state.loading = true;
    root.classList.add('action-centre-loading');
    try {
      const response = await authFetch(ACTION_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ action, item_keys: itemKeys })
      });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        storageRemove(AUTH_SESSION_KEY); applySignedOutState?.(); syncAuth(); return false;
      }
      if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Action Centre update failed.');
      setMessage(payload.message || 'Action Centre updated.', 'success');
      return true;
    } catch (error) {
      setMessage(error?.message || 'Action Centre update failed.', 'error');
      return false;
    } finally {
      state.loading = false;
      root.classList.remove('action-centre-loading');
    }
  };

  const openTarget = async (item) => {
    if (!item?.read) await performAction('mark_read', [item.item_key]);
    const target = clean(item?.target_url) || '/dashboard.html';
    try {
      const url = new URL(target, location.href);
      if (url.origin === location.origin && /\/dashboard\.html$/i.test(url.pathname) && url.hash) {
        const [view = '', section = ''] = url.hash.replace(/^#/, '').split('/', 2);
        if (typeof showView === 'function') { showView(view, true, section); return; }
      }
      location.href = url.href;
    } catch (_) { location.href = target; }
  };

  const actionButton = (label, className, handler) => {
    const button = el('button', className, label);
    button.type = 'button';
    button.addEventListener('click', handler);
    return button;
  };

  const renderItem = (item) => {
    const article = el('article', 'action-centre-item');
    article.dataset.priority = clean(item.priority) || 'normal';
    article.dataset.read = String(Boolean(item.read));
    const bar = el('span', 'action-centre-item-priority'); bar.setAttribute('aria-hidden','true');
    const copy = el('div', 'action-centre-item-copy');
    const top = el('div', 'action-centre-item-topline');
    if (!item.read) top.append(el('span', 'action-centre-unread-dot'));
    top.append(el('span', 'action-centre-priority', friendly(item.priority || 'normal')));
    top.append(el('span', '', friendly(item.category || item.source || 'WWZ')));
    top.append(el('span', '', friendly(item.kind || 'notification')));
    if (item.admin_only) top.append(el('span', '', 'Admin'));
    copy.append(top, el('h3', '', clean(item.title) || 'World War Z update'), el('p', '', clean(item.detail) || 'No additional detail.'));
    const meta = el('div', 'action-centre-item-meta');
    if (item.status) { const status = el('span'); status.append(el('strong','',friendly(item.status))); meta.append(status); }
    meta.append(el('span','',`Updated ${timeLabel(item.created_at)}`));
    if (item.due_at) meta.append(el('span','',`Due ${timeLabel(item.due_at)}`));
    copy.append(meta);
    const actions = el('div', 'action-centre-item-actions');
    actions.append(actionButton('Open', 'primary-action compact-action', () => openTarget(item)));
    if (state.view === 'archived') {
      actions.append(actionButton('Restore', 'secondary-action compact-action', async () => { if (await performAction('restore',[item.item_key])) load(); }));
    } else {
      actions.append(actionButton(item.read ? 'Mark Unread' : 'Mark Read', 'secondary-action compact-action', async () => { if (await performAction(item.read?'mark_unread':'mark_read',[item.item_key])) load(); }));
      actions.append(actionButton('Archive', 'secondary-action compact-action', async () => { if (await performAction('archive',[item.item_key])) load(); }));
    }
    article.append(bar, copy, actions);
    return article;
  };

  const render = () => {
    syncAuth(); syncSummary(); syncSources();
    const list = qs('[data-action-centre-list]');
    const empty = qs('[data-action-centre-empty]');
    if (!list) return;
    list.replaceChildren();
    const items = filteredItems();
    items.forEach((item) => list.append(renderItem(item)));
    if (empty) empty.hidden = items.length !== 0;
    setText('[data-action-centre-result-summary]', `${items.length} item${items.length === 1 ? '' : 's'} shown`);
    const checked = state.payload?.checked_at;
    setText('[data-action-centre-updated]', checked ? `Live snapshot ${timeLabel(checked)}` : 'No live snapshot');
    qsa('[data-action-centre-view]').forEach((button) => {
      const selected = button.dataset.actionCentreView === state.view;
      button.classList.toggle('active', selected); button.setAttribute('aria-selected', String(selected));
    });
    const archiveRead = qs('[data-action-centre-archive-read]');
    if (archiveRead) archiveRead.hidden = state.view === 'archived';
    const markAll = qs('[data-action-centre-mark-all-read]');
    if (markAll) markAll.hidden = state.view === 'archived';
  };

  const load = async ({ quiet = false } = {}) => {
    if (!syncAuth() || state.loading) return;
    state.loading = true; root.classList.add('action-centre-loading');
    if (!quiet) setMessage('Refreshing your Action Centre…');
    try {
      const response = await authFetch(`${ENDPOINT}?view=${encodeURIComponent(state.view)}&limit=500`, {
        method: 'GET', headers: { Accept: 'application/json', Authorization: `Bearer ${token()}` }
      });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        storageRemove(AUTH_SESSION_KEY); applySignedOutState?.(); state.payload = null; syncAuth(); return;
      }
      if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'The Action Centre is unavailable.');
      state.payload = payload; render(); if (!quiet) setMessage('');
    } catch (error) {
      setMessage(error?.message || 'The Action Centre is unavailable.', 'error');
    } finally {
      state.loading = false; root.classList.remove('action-centre-loading');
    }
  };

  const schedule = (detail = {}) => {
    state.active = detail.view === 'actioncentre';
    window.clearInterval(state.timer); state.timer = 0;
    if (!state.active) return;
    load();
    state.timer = window.setInterval(() => {
      if (state.active && document.visibilityState === 'visible') load({ quiet: true });
    }, 60_000);
  };

  qsa('[data-action-centre-view]').forEach((button) => button.addEventListener('click', () => { state.view = button.dataset.actionCentreView || 'active'; load(); }));
  ['[data-action-centre-search]','[data-action-centre-source]','[data-action-centre-priority]','[data-action-centre-kind]'].forEach((selector) => {
    qs(selector)?.addEventListener(selector.includes('search') ? 'input' : 'change', render);
  });
  qs('[data-action-centre-refresh]')?.addEventListener('click', () => load());
  qs('[data-action-centre-mark-all-read]')?.addEventListener('click', async () => { if (await performAction('mark_all_read')) load(); });
  qs('[data-action-centre-archive-read]')?.addEventListener('click', async () => { if (await performAction('archive_all_read')) load(); });
  qs('[data-action-centre-signin]')?.addEventListener('click', () => document.querySelector('[data-open-login]')?.click());
  qs('[data-action-centre-notification-settings]')?.addEventListener('click', () => { if (typeof showView === 'function') showView('community', true, 'notifications'); });
  window.addEventListener('wwz:viewchange', (event) => schedule(event.detail || {}));
  window.addEventListener('wwz:serverchange', () => { state.payload = null; if (state.active) load(); else if (token()) load({ quiet: true }); });
  window.addEventListener('wwz:authchange', () => { state.payload = null; syncAuth(); if (token()) load({ quiet: !state.active }); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && state.active) load({ quiet: true }); });

  syncAuth();
  if (token()) load({ quiet: true });
  window.WWZActionCentre = Object.freeze({ activate: schedule, refresh: load });
  window.__wwzActionCentreReady = true;
})();
