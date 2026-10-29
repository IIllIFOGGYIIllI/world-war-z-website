(() => {
  'use strict';
  const isIOS = (nav = navigator) => /iphone|ipad|ipod/i.test(nav.userAgent || '')
    || (nav.platform === 'MacIntel' && Number(nav.maxTouchPoints) > 1);
  const isInstalled = () => isIOS()
    && (navigator.standalone === true
      || window.matchMedia?.('(display-mode: standalone)')?.matches === true);
  const SESSION_HANDOFF_TTL_MS = 45_000;
  const SESSION_TOKEN_PATTERN = /^[a-z0-9_-]{32,256}$/i;

  // Share a newly issued token with another already-open Safari tab only when
  // iOS returned OAuth to a different tab. The record is short-lived and is
  // removed by the receiving tab; it is never used for installed-app storage.
  const createSessionHandoff = (rawToken, now = Date.now()) => {
    const token = String(rawToken || '');
    const createdAt = Number(now);
    if (!SESSION_TOKEN_PATTERN.test(token) || !Number.isSafeInteger(createdAt) || createdAt < 0) return null;
    return JSON.stringify({
      version: 1,
      token,
      created_at: createdAt,
      expires_at: createdAt + SESSION_HANDOFF_TTL_MS
    });
  };
  const parseSessionHandoff = (raw, now = Date.now()) => {
    try {
      const value = String(raw || '');
      if (!value || value.length > 512) return null;
      const record = JSON.parse(value);
      const createdAt = Number(record?.created_at);
      const expiresAt = Number(record?.expires_at);
      const checkedAt = Number(now);
      if (record?.version !== 1 || !SESSION_TOKEN_PATTERN.test(String(record?.token || ''))
          || !Number.isSafeInteger(createdAt) || !Number.isSafeInteger(expiresAt)
          || !Number.isSafeInteger(checkedAt) || createdAt < 0
          || createdAt > checkedAt + 5_000 || expiresAt <= checkedAt
          || expiresAt <= createdAt || expiresAt - createdAt > SESSION_HANDOFF_TTL_MS
          || checkedAt - createdAt > SESSION_HANDOFF_TTL_MS) return null;
      return Object.freeze({ token: String(record.token), expiresAt });
    } catch (_) {
      return null;
    }
  };
  const parseTransferLink = (raw, dashboardUrl = location.href) => {
    try {
      const value = String(raw || '').trim();
      if (!value || value.length > 2048) return null;
      const current = new URL(dashboardUrl);
      const link = new URL(value); // Require a full, absolute link; never accept arbitrary token text.
      const query = new URLSearchParams(link.search);
      const queryKeys = [...query.keys()];
      const allowedQuery = queryKeys.length === 0 || (
        queryKeys.length === 1 && queryKeys[0] === 'wwz_handoff'
        && query.get('wwz_handoff') === 'ios_app'
      );
      if (link.protocol !== 'https:' || link.origin !== current.origin
          || link.pathname !== current.pathname || !allowedQuery
          || link.username || link.password) return null;
      const params = new URLSearchParams(link.hash.slice(1));
      const keys = [...params.keys()];
      if (keys.length !== 1 || keys[0] !== 'login_ticket') return null;
      const ticket = params.get('login_ticket') || '';
      return /^[a-z0-9_-]{32,256}$/i.test(ticket) ? ticket : null;
    } catch (_) {
      return null;
    }
  };
  // Safari has separate storage from an installed iOS Home Screen web app.
  // A Safari-originated login keeps its own return-view marker; a callback
  // from the installed app generally arrives without that marker.
  const shouldOfferSafariHandoff = (hasLocalLoginMarker = false, appHandoffRequested = false) =>
    isIOS() && !isInstalled() && appHandoffRequested === true && !hasLocalLoginMarker;
  window.WWZIOSAuth = Object.freeze({
    isIOS, isInstalled, parseTransferLink, shouldOfferSafariHandoff,
    createSessionHandoff, parseSessionHandoff, SESSION_HANDOFF_TTL_MS
  });
})();
