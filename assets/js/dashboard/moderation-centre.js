(() => {
  'use strict';

  const root = document.querySelector('[data-dashboard-section="moderation-centre"]');
  if (!root) {
    window.__wwzModerationCentreReady = true;
    return;
  }

  const select = (query) => root.querySelector(query);
  const refreshButton = select('[data-refresh-moderation-centre]');
  const errorNote = select('[data-moderation-centre-error]');
  const searchForm = select('[data-moderation-centre-player-search]');
  const searchInput = select('[data-moderation-centre-player-input]');
  const searchButton = select('[data-moderation-centre-player-button]');
  const searchResults = select('[data-moderation-centre-player-results]');
  const searchState = select('[data-moderation-centre-player-state]');
  const navBadge = document.querySelector('[data-moderation-centre-nav-badge]');
  let requestInProgress = false;
  let searchInProgress = false;
  let refreshTimer = 0;

  const set = (query, value) => {
    const element = select(query);
    if (element) element.textContent = String(value ?? '—');
  };

  const friendly = (value) => String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const dateLabel = (value) => {
    if (!value) return 'No date';
    try {
      return typeof formatAccountDate === 'function'
        ? formatAccountDate(value)
        : new Date(value).toLocaleString('en-AU');
    } catch (_) {
      return String(value);
    }
  };

  const navigate = (section) => {
    const clean = String(section || '').trim();
    if (!clean) return;
    location.hash = `#staff/${clean}`;
  };

  const openCase = (caseId) => {
    const id = Number(caseId);
    if (!Number.isInteger(id) || id <= 0) return;
    window.WWZAdministration?.openModerationCase?.(id);
  };

  const openPlayer = (psnId) => {
    const psn = String(psnId || '').trim();
    if (!psn) return;
    navigate('players');
    window.setTimeout(() => window.WWZAdministration?.openPlayerDossier?.(psn), 80);
  };

  const button = (label, handler, className = '') => {
    const control = document.createElement('button');
    control.type = 'button';
    control.textContent = label;
    control.className = `moderation-centre-row-action ${className}`.trim();
    control.addEventListener('click', handler);
    return control;
  };

  const appendRow = (target, { title, detail, meta = '', tone = '', actions = [] } = {}) => {
    if (!target) return;
    const row = document.createElement('article');
    row.className = 'moderation-centre-row';
    if (tone) row.dataset.tone = tone;
    const copy = document.createElement('div');
    const heading = document.createElement('strong');
    const body = document.createElement('p');
    const stamp = document.createElement('small');
    heading.textContent = String(title || 'Moderation record');
    body.textContent = String(detail || 'No additional detail recorded.');
    stamp.textContent = String(meta || '');
    copy.append(heading, body);
    if (meta) copy.append(stamp);
    row.append(copy);
    if (actions.length) {
      const controls = document.createElement('div');
      controls.className = 'moderation-centre-row-actions';
      actions.forEach((control) => controls.append(control));
      row.append(controls);
    }
    target.append(row);
  };

  const renderCaseRows = (query, emptyQuery, countQuery, rows, { priority = false } = {}) => {
    const target = select(query);
    const empty = select(emptyQuery);
    const items = Array.isArray(rows) ? rows : [];
    if (target) target.replaceChildren();
    if (empty) empty.hidden = items.length !== 0;
    set(countQuery, `${items.length} shown`);
    items.forEach((item) => {
      const caseId = Number(item?.case_id) || 0;
      const action = friendly(item?.action || 'record');
      const targetName = String(item?.target_name || 'Player');
      const flags = [];
      if (priority && item?.overdue) flags.push('OVERDUE');
      if (priority && item?.operation_failed) flags.push('FAILED OPERATION');
      if (priority && item?.expiring_soon) flags.push('EXPIRING SOON');
      if (item?.review_type) flags.push(friendly(item.review_type));
      if (item?.priority && String(item.priority) !== 'normal') flags.push(`${friendly(item.priority)} priority`);
      const assignee = item?.assignee_name ? `Assigned: ${item.assignee_name}` : 'Unassigned';
      const expiry = item?.expires_at ? `Expires ${dateLabel(item.expires_at)}` : '';
      appendRow(target, {
        title: `Case #${caseId} · ${action} · ${targetName}`,
        detail: String(item?.reason || 'No reason recorded'),
        meta: [flags.join(' · '), assignee, expiry || dateLabel(item?.created_at)].filter(Boolean).join(' · '),
        tone: item?.operation_failed || item?.overdue ? 'danger' : item?.expiring_soon ? 'warning' : '',
        actions: [button('Open Case', () => openCase(caseId))]
      });
    });
  };

  const renderWatchlist = (items) => {
    const target = select('[data-mod-centre-watch]');
    const empty = select('[data-mod-centre-watch-empty]');
    const rows = Array.isArray(items) ? items : [];
    target?.replaceChildren();
    if (empty) empty.hidden = rows.length !== 0;
    set('[data-mod-centre-watch-count]', `${rows.length} shown`);
    rows.forEach((item) => appendRow(target, {
      title: String(item?.psn_account || 'Unknown player'),
      detail: String(item?.reason || 'Staff review'),
      meta: `${String(item?.added_by_name || 'Administrator')} · ${dateLabel(item?.created_at)}`,
      tone: 'warning',
      actions: [button('Open Player', () => openPlayer(item?.psn_account))]
    }));
  };

  const renderNotes = (items) => {
    const target = select('[data-mod-centre-notes]');
    const empty = select('[data-mod-centre-notes-empty]');
    const rows = Array.isArray(items) ? items : [];
    target?.replaceChildren();
    if (empty) empty.hidden = rows.length !== 0;
    set('[data-mod-centre-note-count]', `${rows.length} shown`);
    rows.forEach((item) => appendRow(target, {
      title: String(item?.psn_account || 'Unknown player'),
      detail: String(item?.note || 'Private staff note'),
      meta: `${String(item?.author_name || 'Administrator')} · ${dateLabel(item?.created_at)}`,
      actions: [button('Open Player', () => openPlayer(item?.psn_account))]
    }));
  };

  const render = (payload) => {
    const summary = payload?.summary || {};
    const bindings = {
      '[data-mod-centre-active-cases]': summary.active_cases,
      '[data-mod-centre-warnings]': summary.active_warnings,
      '[data-mod-centre-timeouts]': summary.active_timeouts,
      '[data-mod-centre-discord-bans]': summary.discord_bans,
      '[data-mod-centre-dayz-bans]': summary.dayz_bans,
      '[data-mod-centre-review]': summary.under_review,
      '[data-mod-centre-appeals]': summary.appeals,
      '[data-mod-centre-watchlist]': summary.watchlist,
      '[data-mod-centre-overdue]': summary.overdue,
      '[data-mod-centre-unassigned]': summary.unassigned,
      '[data-mod-centre-no-evidence]': summary.without_evidence,
      '[data-mod-centre-failures]': summary.failed_operations
    };
    Object.entries(bindings).forEach(([query, value]) => set(query, Math.max(0, Number(value) || 0)));
    set('[data-moderation-centre-server]', `${payload?.server?.name || 'World War Z'} · ${friendly(payload?.server?.map || 'Selected server')}`);
    set('[data-moderation-centre-updated]', `Updated ${dateLabel(payload?.checked_at)}`);

    const attention = Math.max(0, Number(payload?.attention_score) || 0);
    if (navBadge) {
      navBadge.textContent = String(attention);
      navBadge.hidden = attention === 0;
    }

    renderCaseRows('[data-mod-centre-priority]', '[data-mod-centre-priority-empty]', '[data-mod-centre-priority-count]', payload?.priority_queue, { priority: true });
    renderCaseRows('[data-mod-centre-enforcement]', '[data-mod-centre-enforcement-empty]', '[data-mod-centre-enforcement-count]', payload?.active_enforcement);
    renderWatchlist(payload?.watchlist);
    renderNotes(payload?.recent_notes);
    renderCaseRows('[data-mod-centre-cases]', '[data-mod-centre-cases-empty]', '[data-mod-centre-case-count]', payload?.recent_cases);
    if (errorNote) errorNote.hidden = true;
  };

  const load = async () => {
    const token = typeof storageGet === 'function' ? storageGet(AUTH_SESSION_KEY) : '';
    if (!token || (typeof hasServerActionAccess === 'function' && !hasServerActionAccess()) || requestInProgress) return;
    requestInProgress = true;
    refreshButton?.setAttribute('disabled', '');
    refreshButton?.setAttribute('aria-busy', 'true');
    try {
      const response = await authFetch(ADMIN_MODERATION_CENTRE_URL, {
        method: 'GET',
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }
      });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        storageRemove(AUTH_SESSION_KEY);
        applySignedOutState();
        return;
      }
      if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Moderation Centre unavailable');
      render(payload);
    } catch (_) {
      if (errorNote) errorNote.hidden = false;
      set('[data-moderation-centre-updated]', 'Protected snapshot unavailable');
    } finally {
      requestInProgress = false;
      refreshButton?.removeAttribute('disabled');
      refreshButton?.removeAttribute('aria-busy');
    }
  };

  const renderPlayerSearch = (players) => {
    searchResults?.replaceChildren();
    const rows = Array.isArray(players) ? players : [];
    rows.forEach((player) => {
      const psn = String(player?.psn_id || '').trim();
      if (!psn || !searchResults) return;
      const control = document.createElement('button');
      control.type = 'button';
      control.className = 'moderation-centre-player-result';
      const copy = document.createElement('span');
      const title = document.createElement('strong');
      const detail = document.createElement('small');
      const state = document.createElement('span');
      title.textContent = psn;
      detail.textContent = player?.linked
        ? `${String(player?.discord_name || 'Discord profile')} · ${player?.online ? 'Online now' : `Last seen ${dateLabel(player?.last_seen)}`}`
        : `Unlinked DayZ player · Last seen ${dateLabel(player?.last_seen)}`;
      state.textContent = player?.online ? 'Online' : player?.linked ? 'Linked' : 'Unlinked';
      copy.append(title, detail);
      control.append(copy, state);
      control.addEventListener('click', () => openPlayer(psn));
      searchResults.append(control);
    });
    if (searchState) searchState.textContent = rows.length
      ? `${rows.length} protected result${rows.length === 1 ? '' : 's'} found. Select a survivor to open Player Intelligence.`
      : 'No matching player records were found.';
  };

  const searchPlayers = async (event) => {
    event?.preventDefault();
    const query = String(searchInput?.value || '').trim().replace(/\s+/g, ' ');
    if (query.length < 3) {
      if (searchState) searchState.textContent = 'Enter at least three characters of a PlayStation ID or Discord display name.';
      searchInput?.focus();
      return;
    }
    const token = typeof storageGet === 'function' ? storageGet(AUTH_SESSION_KEY) : '';
    if (!token || searchInProgress) return;
    searchInProgress = true;
    searchButton?.setAttribute('disabled', '');
    searchButton?.setAttribute('aria-busy', 'true');
    if (searchState) searchState.textContent = `Searching securely for “${query}”…`;
    try {
      const response = await authFetch(`${ADMIN_PLAYER_SEARCH_URL}?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }
      });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        storageRemove(AUTH_SESSION_KEY);
        applySignedOutState();
        return;
      }
      if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Player search unavailable');
      renderPlayerSearch(payload.players);
    } catch (_) {
      searchResults?.replaceChildren();
      if (searchState) searchState.textContent = 'Player search is temporarily unavailable. No data was changed.';
    } finally {
      searchInProgress = false;
      searchButton?.removeAttribute('disabled');
      searchButton?.removeAttribute('aria-busy');
    }
  };

  const active = ({ view = '', section = '' } = {}) => view === 'staff' && section === 'moderation-centre';
  const schedule = (detail) => {
    window.clearInterval(refreshTimer);
    refreshTimer = 0;
    if (!active(detail)) return;
    load();
    refreshTimer = window.setInterval(() => {
      const current = String(location.hash || '').replace(/^#/, '').split('/');
      if (current[0] === 'staff' && current[1] === 'moderation-centre' && document.visibilityState === 'visible') load();
    }, 60_000);
  };

  refreshButton?.addEventListener('click', load);
  searchForm?.addEventListener('submit', searchPlayers);
  root.querySelectorAll('[data-moderation-centre-nav-section]').forEach((control) => {
    control.addEventListener('click', () => navigate(control.dataset.moderationCentreNavSection));
  });
  window.addEventListener('wwz:viewchange', (event) => schedule(event.detail || {}));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    const current = String(location.hash || '').replace(/^#/, '').split('/');
    if (current[0] === 'staff' && current[1] === 'moderation-centre') load();
  });

  window.WWZModerationCentre = Object.freeze({ activate: schedule, refresh: load });
  window.__wwzModerationCentreReady = true;
})();
