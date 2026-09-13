(() => {
  'use strict';

  const root = document.querySelector('[data-dashboard-section="server-audit"]');
  if (!root) {
    window.__wwzOperationsCentreReady = true;
    return;
  }

  const select = (query) => root.querySelector(query);
  const selectAll = (query) => [...root.querySelectorAll(query)];
  const servicesRoot = select('[data-operations-services]');
  const workersRoot = select('[data-operations-workers]');
  const signalsRoot = select('[data-operations-signals]');
  const errorsRoot = select('[data-operations-errors-list]');
  const historyRoot = select('[data-operations-history]');
  const healthRoot = select('[data-operations-health-state]');
  const refreshButton = select('[data-refresh-operations-centre]');
  const errorNote = select('[data-operations-centre-error]');
  let requestInProgress = false;
  let refreshTimer = 0;

  const set = (query, value) => {
    const element = select(query);
    if (element) element.textContent = String(value ?? '—');
  };

  const safeState = (value) => ['healthy', 'watch', 'degraded', 'critical'].includes(String(value))
    ? String(value)
    : 'watch';

  const severityMark = (severity) => ({
    good: '✓', info: 'i', warning: '!', critical: '×'
  }[String(severity)] || '•');

  const friendly = (value) => String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const timeLabel = (value) => {
    if (!value) return 'Not available';
    try {
      return typeof formatUpdatedAt === 'function' ? formatUpdatedAt(value) : new Date(value).toLocaleString();
    } catch (_) {
      return String(value);
    }
  };

  const compactDuration = (value) => {
    const total = Math.max(0, Number(value) || 0);
    if (!total) return '0m';
    const minutes = Math.floor(total / 60);
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = minutes % 60;
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${Math.floor(total)}s`;
  };

  const stateLabel = (value) => friendly(value || 'unknown');

  const appendActivity = (target, { severity = 'info', title = 'Operational event', detail = '', meta = '' } = {}) => {
    const item = document.createElement('li');
    const mark = document.createElement('span');
    const body = document.createElement('div');
    const heading = document.createElement('strong');
    const copy = document.createElement('small');
    mark.className = 'operations-event-mark';
    mark.dataset.severity = String(severity);
    mark.textContent = severityMark(severity);
    heading.textContent = String(title || 'Operational event');
    copy.textContent = [detail, meta].filter(Boolean).join(' · ');
    body.append(heading, copy);
    item.append(mark, body);
    target.append(item);
  };

  const renderStateCards = (target, items, className) => {
    if (!target) return;
    target.replaceChildren();
    (Array.isArray(items) ? items : []).forEach((item) => {
      const card = document.createElement('article');
      const header = document.createElement('header');
      const title = document.createElement('strong');
      const state = document.createElement('span');
      const detail = document.createElement('p');
      card.className = className;
      card.dataset.state = safeState(item?.state);
      title.textContent = String(item?.label || 'Service');
      state.className = 'operations-service-state';
      state.textContent = String(item?.status || 'Unknown');
      detail.textContent = String(item?.detail || 'No operational detail reported.');
      header.append(title, state);
      card.append(header, detail);
      if (item?.updated_at) {
        const updated = document.createElement('small');
        updated.textContent = `Updated ${timeLabel(item.updated_at)}`;
        card.append(updated);
      }
      target.append(card);
    });
  };

  const renderServices = (services) => renderStateCards(servicesRoot, services, 'operations-service-card');

  const renderWorkers = (workers, summary = {}) => {
    renderStateCards(workersRoot, workers, 'operations-worker-card');
    const total = Math.max(0, Number(summary.total) || 0);
    const running = Math.max(0, Number(summary.running) || 0);
    const attention = Math.max(0, Number(summary.attention) || 0);
    set('[data-operations-worker-summary]', total ? `${running}/${total} running cleanly` : 'No worker data');
    set('[data-operations-worker-attention]', attention);
  };

  const renderSignals = (signals) => {
    if (!signalsRoot) return;
    signalsRoot.replaceChildren();
    const items = Array.isArray(signals) ? signals : [];
    items.slice(0, 10).forEach((signal) => appendActivity(signalsRoot, {
      severity: signal?.severity,
      title: signal?.title,
      detail: signal?.detail,
      meta: friendly(signal?.key)
    }));
    const empty = select('[data-operations-signals-empty]');
    if (empty) empty.hidden = items.length !== 0;
  };

  const renderErrors = (errors) => {
    if (!errorsRoot) return;
    errorsRoot.replaceChildren();
    const items = Array.isArray(errors) ? errors : [];
    items.slice(0, 8).forEach((error) => appendActivity(errorsRoot, {
      severity: 'critical',
      title: error?.title,
      detail: error?.detail,
      meta: `${friendly(error?.source)}${Number(error?.attempts) > 0 ? ` · ${Number(error.attempts)} attempt(s)` : ''}`
    }));
    const empty = select('[data-operations-errors-empty]');
    if (empty) empty.hidden = items.length !== 0;
  };

  const renderHistory = (history) => {
    if (!historyRoot) return;
    historyRoot.replaceChildren();
    const items = Array.isArray(history) ? history : [];
    items.slice(0, 12).forEach((event) => appendActivity(historyRoot, {
      severity: event?.severity,
      title: event?.title,
      detail: event?.detail,
      meta: `${friendly(event?.source)} · ${timeLabel(event?.created_at)}`
    }));
    const empty = select('[data-operations-history-empty]');
    if (empty) empty.hidden = items.length !== 0;
  };

  const renderRuntime = (payload) => {
    const runtime = payload?.runtime || {};
    const scope = payload?.scope || {};
    const restart = payload?.restart_summary || {};
    const adm = payload?.adm || {};

    set('[data-operations-context-world]', scope.map_name || 'Selected server');
    set('[data-operations-context-server]', [scope.server_name || 'World War Z', scope.platform].filter(Boolean).join(' · '));
    set('[data-operations-population]', `${Math.max(0, Number(runtime.players_current) || 0)}/${Math.max(0, Number(runtime.players_maximum) || 0)}`);
    set('[data-operations-population-note]', 'Live DayZ population');
    set('[data-operations-live-state]', stateLabel(runtime.dayz_status));
    set('[data-operations-nitrado-state]', `Nitrado: ${stateLabel(runtime.nitrado_status)}`);
    set('[data-operations-next-restart]', restart.next_scheduled_restart ? timeLabel(restart.next_scheduled_restart) : 'Not scheduled');
    set('[data-operations-restart-countdown]', restart.countdown_seconds == null ? 'No synchronized countdown' : `${compactDuration(restart.countdown_seconds)} remaining`);
    set('[data-operations-control-state]', runtime.server_actions_enabled ? 'Admin verified · controls connected' : 'Protected writes disabled');

    set('[data-operations-restart-next-detail]', restart.next_scheduled_restart ? timeLabel(restart.next_scheduled_restart) : 'Not scheduled');
    set('[data-operations-restart-countdown-detail]', restart.countdown_seconds == null ? 'Unavailable' : compactDuration(restart.countdown_seconds));
    set('[data-operations-restart-interval]', Number(restart.interval_minutes) > 0 ? `${Number(restart.interval_minutes)} minutes` : 'Not configured');
    set('[data-operations-restart-last]', restart.last_detected_at ? timeLabel(restart.last_detected_at) : 'No detected restart yet');
    set('[data-operations-restarts-7d]', Math.max(0, Number(restart.last_7d) || 0));
    set('[data-operations-restart-source]', restart.source || 'Unavailable');
    set('[data-operations-restart-sync]', restart.synchronised ? 'Synchronised' : (restart.configured ? 'Waiting for sync' : 'Not configured'));

    set('[data-operations-adm-state]', adm.task_running ? stateLabel(adm.status || 'running') : 'Worker stopped');
    set('[data-operations-adm-poll-interval]', Number(adm.poll_interval_seconds) > 0 ? `${Number(adm.poll_interval_seconds)} seconds` : 'Default cadence');
    set('[data-operations-adm-last-poll]', timeLabel(adm.last_poll_at));
    set('[data-operations-adm-last-success]', timeLabel(adm.last_success_at));
    set('[data-operations-adm-last-log]', timeLabel(adm.last_log_seen_at));
    set('[data-operations-adm-reconcile]', timeLabel(adm.last_session_reconcile_at));
    set('[data-operations-adm-last-error]', adm.last_error_kind ? friendly(adm.last_error_kind) : 'None recorded');
  };

  const render = (payload) => {
    const health = payload?.health || {};
    const score = Math.max(0, Math.min(100, Number(health.score) || 0));
    const healthState = safeState(health.state);
    if (healthRoot) healthRoot.dataset.operationsHealthState = healthState;
    set('[data-operations-health-score]', score);
    set('[data-operations-health-label]', health.label || friendly(healthState));
    const signalCount = Array.isArray(payload?.signals) ? payload.signals.length : 0;
    const workerAttention = Math.max(0, Number(payload?.worker_summary?.attention) || 0);
    const attentionTotal = signalCount + workerAttention;
    set('[data-operations-health-summary]', attentionTotal
      ? `${attentionTotal} operational item${attentionTotal === 1 ? '' : 's'} need review for ${payload?.scope?.map_name || 'this server'}.`
      : `${payload?.scope?.map_name || 'The selected server'} has no active operational health signals or stopped background workers.`);
    set('[data-operations-failures]', Math.max(0, Number(payload?.failure_count) || 0));
    set('[data-operations-restarts-24h]', Math.max(0, Number(payload?.restart_summary?.last_24h) || 0));
    set('[data-operations-audit-failures]', Math.max(0, Number(payload?.audit?.failures_24h) || 0));
    set('[data-operations-updated]', `Updated ${timeLabel(payload?.checked_at)}`);
    renderRuntime(payload);
    renderServices(payload?.services);
    renderWorkers(payload?.workers, payload?.worker_summary);
    renderSignals(payload?.signals);
    renderErrors(payload?.recent_errors);
    renderHistory(payload?.history);
    if (errorNote) errorNote.hidden = true;
  };

  const load = async () => {
    const token = typeof storageGet === 'function' ? storageGet(AUTH_SESSION_KEY) : '';
    if (!token || (typeof hasServerActionAccess === 'function' && !hasServerActionAccess()) || requestInProgress) return;
    requestInProgress = true;
    refreshButton?.setAttribute('aria-busy', 'true');
    refreshButton?.setAttribute('disabled', '');
    try {
      const response = await authFetch(ADMIN_OPERATIONS_CENTRE_URL, {
        method: 'GET',
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }
      });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        storageRemove(AUTH_SESSION_KEY);
        applySignedOutState();
        return;
      }
      if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Operations Centre unavailable');
      render(payload);
    } catch (_) {
      if (errorNote) errorNote.hidden = false;
      set('[data-operations-updated]', 'Live snapshot unavailable');
    } finally {
      requestInProgress = false;
      refreshButton?.removeAttribute('aria-busy');
      refreshButton?.removeAttribute('disabled');
    }
  };

  const navigate = (button) => {
    const view = String(button.dataset.operationsNavView || '').trim();
    const section = String(button.dataset.operationsNavSection || '').trim();
    if (!view) return;
    location.hash = section ? `#${view}/${section}` : `#${view}`;
  };

  selectAll('[data-operations-nav-view]').forEach((button) => {
    button.addEventListener('click', () => navigate(button));
  });

  const active = ({ view = '', section = '' } = {}) => view === 'staff' && section === 'server-audit';
  const schedule = (detail) => {
    window.clearInterval(refreshTimer);
    refreshTimer = 0;
    if (!active(detail)) return;
    load();
    refreshTimer = window.setInterval(() => {
      const current = String(location.hash || '').replace(/^#/, '').split('/');
      if (current[0] === 'staff' && current[1] === 'server-audit' && document.visibilityState === 'visible') load();
    }, 60_000);
  };

  refreshButton?.addEventListener('click', load);
  window.addEventListener('wwz:viewchange', (event) => schedule(event.detail || {}));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    const current = String(location.hash || '').replace(/^#/, '').split('/');
    if (current[0] === 'staff' && current[1] === 'server-audit') load();
  });

  window.WWZOperationsCentre = Object.freeze({ activate: schedule, refresh: load });
  window.__wwzOperationsCentreReady = true;
})();
