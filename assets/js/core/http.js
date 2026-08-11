(() => {
  'use strict';

  const DEFAULT_TIMEOUT_MS = 10_000;
  const SERVER_STORAGE_KEY = 'wwz_dashboard_server';

  const selectedServerKey = () => {
    try {
      const value = JSON.parse(sessionStorage.getItem(SERVER_STORAGE_KEY) || 'null');
      return String(value?.key || '').trim().toLowerCase();
    } catch {
      return '';
    }
  };

  const routedHeaders = (url, source) => {
    const headers = new Headers(source || {});
    const key = selectedServerKey();
    let target;
    try { target = new URL(url, location.href); } catch { return headers; }
    if (key && target.pathname.startsWith('/api/')) {
      headers.set('X-WWZ-Server', key);
    }
    return headers;
  };

  const request = async (url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) => {
    const controller = new AbortController();
    const upstreamSignal = options.signal;
    const abortFromUpstream = () => controller.abort(upstreamSignal?.reason);
    if (upstreamSignal) {
      if (upstreamSignal.aborted) abortFromUpstream();
      else upstreamSignal.addEventListener('abort', abortFromUpstream, { once: true });
    }

    const timeout = window.setTimeout(() => controller.abort(), Math.max(1, Number(timeoutMs) || DEFAULT_TIMEOUT_MS));
    try {
      return await fetch(url, {
        cache: 'no-store',
        credentials: 'omit',
        ...options,
        headers: routedHeaders(url, options.headers),
        signal: controller.signal
      });
    } finally {
      window.clearTimeout(timeout);
      upstreamSignal?.removeEventListener?.('abort', abortFromUpstream);
    }
  };

  const json = async (url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) => {
    const response = await request(url, options, timeoutMs);
    const payload = await response.json().catch(() => ({}));
    return { response, payload };
  };

  const normaliseRestartOperations = (operations = {}) => {
    const value = { ...(operations || {}) };
    const target = value.next_scheduled_restart ? Date.parse(value.next_scheduled_restart) : NaN;
    if (Number.isFinite(target) && target <= Date.now()) {
      value.next_scheduled_restart = null;
      value.restart_countdown_seconds = null;
      value.restart_schedule_synchronised = false;
      value.restart_sync_state = 'waiting_for_restart_rollover';
    }
    return value;
  };

  window.WWZHttp = Object.freeze({ request, json, normaliseRestartOperations });
})();
