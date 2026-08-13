(() => {
  'use strict';

  const DEFAULT_TIMEOUT_MS = 10_000;
  const SERVER_STORAGE_KEY = 'wwz_dashboard_server';
  const SERVER_KEY_PATTERN = /^[a-z0-9][a-z0-9-]{1,62}$/;
  const GLOBAL_API_PATHS = new Set([
    '/',
    '/api/health',
    '/api/auth/config',
    '/api/auth/discord/login',
    '/api/auth/discord/callback',
    '/api/auth/discord/complete',
    '/api/auth/me',
    '/api/auth/logout'
  ]);

  const selectedServerKey = () => {
    try {
      const value = JSON.parse(sessionStorage.getItem(SERVER_STORAGE_KEY) || 'null');
      const key = String(value?.key || '').trim().toLowerCase();
      return SERVER_KEY_PATTERN.test(key) ? key : '';
    } catch {
      return '';
    }
  };

  const routedHeaders = (url, source) => {
    const headers = new Headers(source || {});
    const key = selectedServerKey();
    let target;
    try { target = new URL(url, location.href); } catch { return headers; }
    const operationalApi = target.pathname.startsWith('/api/') && !GLOBAL_API_PATHS.has(target.pathname);
    if (operationalApi && !key) {
      throw new Error('Select a World War Z server before using this feature.');
    }
    if (key && target.pathname.startsWith('/api/')) {
      headers.set('X-WWZ-Server', key);
    }
    return headers;
  };

  const request = async (url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) => {
    if (navigator.onLine === false) {
      const error = new Error('Offline — live World War Z data and protected actions require a network connection.');
      error.name = 'WWZOfflineError';
      throw error;
    }
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
