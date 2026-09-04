(() => {
  'use strict';

  const root = document.querySelector('[data-dashboard-section="server-audit"]');
  if (!root) {
    window.__wwzOperationsCentreReady = true;
    return;
  }

  const select = (query) => root.querySelector(query);
  const servicesRoot = select('[data-operations-services]');
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
    if (!value) return 'No timestamp yet';
    try {
      return typeof formatUpdatedAt === 'function' ? formatUpdatedAt(value) : new Date(value).toLocaleString();
    } catch (_) {
      return String(value);
    }
  };

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

  const renderServices = (services) => {
    if (!servicesRoot) return;
    servicesRoot.replaceChildren();
    (Array.isArray(services) ? services : []).forEach((service) => {
      const card = document.createElement('article');
      const header = document.createElement('header');
      const title = document.createElement('strong');
      const state = document.createElement('span');
      const detail = document.createElement('p');
      const updated = document.createElement('small');
      card.className = 'operations-service-card';
      card.dataset.state = safeState(service?.state);
      title.textContent = String(service?.label || 'Service');
      state.className = 'operations-service-state';
      state.textContent = String(service?.status || 'Unknown');
      detail.textContent = String(service?.detail || 'No operational detail reported.');
      updated.textContent = `Updated ${timeLabel(service?.updated_at)}`;
      header.append(title, state);
      card.append(header, detail, updated);
      servicesRoot.append(card);
    });
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

  const render = (payload) => {
    const health = payload?.health || {};
    const score = Math.max(0, Math.min(100, Number(health.score) || 0));
    const healthState = safeState(health.state);
    if (healthRoot) healthRoot.dataset.operationsHealthState = healthState;
    set('[data-operations-health-score]', score);
    set('[data-operations-health-label]', health.label || friendly(healthState));
    const signalCount = Array.isArray(payload?.signals) ? payload.signals.length : 0;
    set('[data-operations-health-summary]', signalCount
      ? `${signalCount} active health signal${signalCount === 1 ? '' : 's'} need review for ${payload?.scope?.map_name || 'this server'}.`
      : `${payload?.scope?.map_name || 'The selected server'} has no active operational health signals.`);
    set('[data-operations-failures]', Math.max(0, Number(payload?.failure_count) || 0));
    set('[data-operations-errors]', Array.isArray(payload?.recent_errors) ? payload.recent_errors.length : 0);
    set('[data-operations-restarts-24h]', Math.max(0, Number(payload?.restart_summary?.last_24h) || 0));
    set('[data-operations-audit-failures]', Math.max(0, Number(payload?.audit?.failures_24h) || 0));
    set('[data-operations-updated]', `Updated ${timeLabel(payload?.checked_at)}`);
    renderServices(payload?.services);
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
