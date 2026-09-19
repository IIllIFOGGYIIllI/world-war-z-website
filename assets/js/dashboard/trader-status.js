(() => {
  'use strict';

  const STATUS_URL = `${DASHBOARD_API_BASE}/api/trader/status`;
  const ACTION_URL = `${DASHBOARD_API_BASE}/api/admin/trader/action`;
  const root = document.querySelector('[data-trader-status-root]');
  if (!root) return;

  const stateBadge = root.querySelector('[data-trader-state]');
  const stateTitle = root.querySelector('[data-trader-state-title]');
  const stateCopy = root.querySelector('[data-trader-state-copy]');
  const art = root.querySelector('[data-trader-art]');
  const updatedLocal = root.querySelector('[data-trader-updated-local]');
  const updatedUtc = root.querySelector('[data-trader-updated-utc]');
  const updatedBy = root.querySelector('[data-trader-updated-by]');
  const mapLink = root.querySelector('[data-trader-map-link]');
  const adminPanels = [...root.querySelectorAll('[data-trader-admin-panel]')];
  const announcementChannel = root.querySelector('[data-trader-announcement-channel]');
  const panelChannel = root.querySelector('[data-trader-panel-channel]');
  const routeWarning = root.querySelector('[data-trader-route-warning]');
  const historyList = root.querySelector('[data-trader-history]');
  const historyEmpty = root.querySelector('[data-trader-history-empty]');
  const message = root.querySelector('[data-trader-message]');
  const actionButtons = [...root.querySelectorAll('[data-trader-set-state]')];
  const refreshButton = root.querySelector('[data-trader-refresh]');
  let loading = false;

  const selectedServer = () => window.WWZServerContext?.getSelectedServer?.() || null;
  const isChernarus = () => String(selectedServer()?.map_key || '').toLowerCase() === 'chernarus';

  const setMessage = (copy = '', tone = 'info') => {
    if (!message) return;
    message.textContent = copy;
    message.hidden = !copy;
    message.dataset.tone = tone;
  };

  const localTime = (iso) => {
    const parsed = Date.parse(String(iso || ''));
    if (!Number.isFinite(parsed)) return 'Not changed yet';
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'full',
      timeStyle: 'short'
    }).format(new Date(parsed));
  };

  const utcTime = (iso) => {
    const parsed = Date.parse(String(iso || ''));
    if (!Number.isFinite(parsed)) return '';
    return `${new Date(parsed).toISOString().replace('.000Z', 'Z')} · stored in UTC`;
  };

  const renderHistory = (rows = []) => {
    if (!historyList) return;
    historyList.replaceChildren();
    const visible = Array.isArray(rows) ? rows : [];
    historyEmpty.hidden = visible.length > 0;
    visible.forEach((row) => {
      const li = document.createElement('li');
      const mark = document.createElement('span');
      mark.className = 'trader-history-mark';
      mark.textContent = String(row.state || '').toLowerCase() === 'open' ? '🟢' : '🔴';
      const copy = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = `Trader ${String(row.state || 'closed').toUpperCase()}`;
      const small = document.createElement('small');
      small.textContent = `${row.actor_name || 'Admin'} · ${localTime(row.at)}`;
      copy.append(strong, small);
      li.append(mark, copy);
      historyList.append(li);
    });
  };

  const render = (payload = {}) => {
    const state = String(payload.state || 'closed').toLowerCase() === 'open' ? 'open' : 'closed';
    const isOpen = state === 'open';
    stateBadge.dataset.state = state;
    stateBadge.textContent = isOpen ? 'OPEN' : 'CLOSED';
    stateTitle.textContent = `Radio Zenit Trader — ${isOpen ? 'OPEN' : 'CLOSED'}`;
    stateCopy.textContent = isOpen
      ? 'Trader services are currently available at Radio Zenit.'
      : 'Trader services are currently unavailable. Wait for the next opening announcement before travelling to trade.';
    art.src = `assets/trader/wwz-trader-${state}.gif?v=1.56.1`;
    art.alt = `World War Z Radio Zenit Trader ${isOpen ? 'open' : 'closed'}`;
    updatedLocal.textContent = localTime(payload.updated_at);
    updatedUtc.textContent = utcTime(payload.updated_at);
    if (updatedBy) updatedBy.textContent = payload.updated_by || 'WWZ Admin Team';
    if (mapLink) mapLink.href = payload.map_url || 'map-link.html?map=chernarus&x=8143&z=9156&marker=Radio%20Zenit%20Trader';

    const canManage = Boolean(payload.can_manage) && ['staff', 'owner'].includes(String(dashboardAccessLevel || ''));
    adminPanels.forEach((panel) => { panel.hidden = !canManage; });
    announcementChannel.textContent = payload.announcement_channel?.name ? `#${payload.announcement_channel.name}` : 'Not configured';
    panelChannel.textContent = payload.panel_channel?.name ? `#${payload.panel_channel.name}` : 'Not published';
    routeWarning.hidden = Boolean(payload.announcement_channel);
    renderHistory(canManage ? payload.history : []);
  };

  const load = async ({ quiet = false } = {}) => {
    if (loading || !isChernarus()) return;
    loading = true;
    if (!quiet) setMessage('Loading live Trader status…');
    try {
      const headers = { Accept: 'application/json' };
      const token = storageGet(AUTH_SESSION_KEY);
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await authFetch(STATUS_URL, { headers });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Trader status is unavailable.');
      render(payload);
      setMessage('');
    } catch (error) {
      setMessage(error?.message || 'Trader status is unavailable.', 'error');
    } finally {
      loading = false;
    }
  };

  const setState = async (state) => {
    if (loading || !['open', 'closed'].includes(state)) return;
    const token = storageGet(AUTH_SESSION_KEY);
    if (!token) {
      setMessage('Sign in with an Admin account to change Trader status.', 'error');
      return;
    }
    const label = state === 'open' ? 'OPEN' : 'CLOSED';
    if (!window.confirm(`Set Radio Zenit Trader to ${label}? This will send a fresh @everyone announcement to the configured main chat.`)) return;
    loading = true;
    actionButtons.forEach((button) => { button.disabled = true; });
    setMessage(`Setting Trader ${label}…`);
    try {
      const response = await protectedActionFetch(ACTION_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'set_status', state })
      });
      const payload = await response.json().catch(() => ({}));
      if (handleAdminPlayerAuthorizationResponse?.(response, payload, { actionRequest: true })) return;
      if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Trader status could not be changed.');
      render(payload.trader || {});
      setMessage(payload.message || `Trader is now ${label}.`, 'success');
    } catch (error) {
      setMessage(error?.message || 'Trader status could not be changed.', 'error');
    } finally {
      loading = false;
      actionButtons.forEach((button) => { button.disabled = false; });
    }
  };

  actionButtons.forEach((button) => button.addEventListener('click', () => setState(button.dataset.traderSetState)));
  refreshButton?.addEventListener('click', () => load());
  window.addEventListener('wwz:viewchange', (event) => {
    if (event.detail?.view === 'trader') load({ quiet: true });
  });
  window.addEventListener('wwz:serverchange', () => {
    if (isChernarus()) load({ quiet: true });
  });
  window.addEventListener('wwz:accesschange', () => load({ quiet: true }));
  window.addEventListener('wwz:authchange', () => load({ quiet: true }));

  if (isChernarus()) load({ quiet: true });
})();
