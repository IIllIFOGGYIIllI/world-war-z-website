(() => {
  'use strict';
  const isIOS = (nav = navigator) => /iphone|ipad|ipod/i.test(nav.userAgent || '')
    || (nav.platform === 'MacIntel' && Number(nav.maxTouchPoints) > 1);
  const isInstalled = () => isIOS()
    && (navigator.standalone === true
      || window.matchMedia?.('(display-mode: standalone)')?.matches === true);
  const parseTransferLink = (raw, dashboardUrl = location.href) => {
    try {
      const value = String(raw || '').trim();
      if (!value || value.length > 2048) return null;
      const current = new URL(dashboardUrl);
      const link = new URL(value); // Require a full, absolute link; never accept arbitrary token text.
      if (link.protocol !== 'https:' || link.origin !== current.origin
          || link.pathname !== current.pathname || link.search
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
  const shouldOfferSafariHandoff = (hasLocalLoginMarker = false) =>
    isIOS() && !isInstalled() && !hasLocalLoginMarker;
  window.WWZIOSAuth = Object.freeze({ isIOS, isInstalled, parseTransferLink, shouldOfferSafariHandoff });
})();
