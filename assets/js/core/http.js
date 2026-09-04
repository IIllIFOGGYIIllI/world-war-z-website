(() => {
  'use strict';

  const DEFAULT_TIMEOUT_MS = 10_000;
  const MINIMUM_TIMEOUT_MS = 1_000;
  const MAXIMUM_TIMEOUT_MS = 120_000;
  const DASHBOARD_API_ORIGIN = 'https://world-war-z.up.railway.app';
  const SERVER_STORAGE_KEY = 'wwz_dashboard_server';
  const SERVER_KEY_PATTERN = /^[a-z0-9][a-z0-9-]{1,62}$/;
  const BEARER_PATTERN = /^Bearer\s+\S{32,256}$/i;
  const GLOBAL_API_PATHS = new Set([
    '/',
    '/api/health',
    '/api/auth/config',
    '/api/auth/discord/login',
    '/api/auth/discord/callback',
    '/api/auth/discord/complete',
    '/api/auth/me',
    '/api/auth/logout',
    '/api/donations/servers'
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

  const targetUrl = (url) => {
    try {
      return new URL(url, location.href);
    } catch {
      throw new TypeError('The requested World War Z URL is invalid.');
    }
  };

  const isTrustedApiTarget = (target) => (
    target.origin === DASHBOARD_API_ORIGIN
    && target.pathname.startsWith('/api/')
  );

  const routedHeaders = (url, source) => {
    const headers = new Headers(source || {});
    const key = selectedServerKey();
    const target = targetUrl(url);
    const protectedRequest = headers.has('Authorization');

    if (protectedRequest) {
      const authorization = String(headers.get('Authorization') || '');
      if (!BEARER_PATTERN.test(authorization) || !isTrustedApiTarget(target)) {
        throw new Error('Protected World War Z credentials can only be sent to the trusted dashboard API.');
      }
    }

    const operationalApi = isTrustedApiTarget(target) && !GLOBAL_API_PATHS.has(target.pathname);
    if (operationalApi && !key) {
      throw new Error('Select a World War Z server before using this feature.');
    }
    if (key && isTrustedApiTarget(target)) {
      headers.set('X-WWZ-Server', key);
    }
    return { headers, target, protectedRequest };
  };

  const request = async (url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) => {
    if (navigator.onLine === false) {
      const error = new Error('Offline — live World War Z data and protected actions require a network connection.');
      error.name = 'WWZOfflineError';
      throw error;
    }

    const { headers, target, protectedRequest } = routedHeaders(url, options.headers);
    const numericTimeout = Number(timeoutMs);
    const safeTimeout = Math.min(
      MAXIMUM_TIMEOUT_MS,
      Math.max(
        MINIMUM_TIMEOUT_MS,
        Number.isFinite(numericTimeout) ? numericTimeout : DEFAULT_TIMEOUT_MS
      )
    );

    const controller = new AbortController();
    const upstreamSignal = options.signal;
    const abortFromUpstream = () => controller.abort(upstreamSignal?.reason);
    if (upstreamSignal) {
      if (upstreamSignal.aborted) abortFromUpstream();
      else upstreamSignal.addEventListener('abort', abortFromUpstream, { once: true });
    }

    const timeout = window.setTimeout(() => controller.abort(), safeTimeout);
    try {
      return await fetch(target.href, {
        ...options,
        // These values are intentionally applied after caller options so feature
        // modules cannot accidentally persist protected API data or send cookies.
        cache: 'no-store',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        redirect: protectedRequest ? 'error' : (options.redirect || 'follow'),
        headers,
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
