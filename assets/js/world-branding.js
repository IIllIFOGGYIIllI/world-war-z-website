/* WWZ Stage 2D Phase 1: public, registry-sourced presentation only. */
(() => {
  'use strict';
  const ENDPOINT = 'https://world-war-z.up.railway.app/api/world/branding';
  const KEYS = new Set(['badlands']);
  let snapshot = null;
  const sanitize = (item) => item && KEYS.has(String(item.map_key || '').toLowerCase())
    && typeof item.world_name === 'string' && item.world_name.length <= 32
    ? item : null;
  const update = (data) => {
    const primary = sanitize(data?.primary);
    if (!primary || primary.primary !== true || primary.status !== 'active') return false;
    const secondary = (Array.isArray(data.servers) ? data.servers : []).find(item => item.server_key !== primary.server_key && item.map_key === 'badlands');
    const other = sanitize(secondary);
    if (!other) return false;
    // The public branding endpoint reflects the validated WWZ runtime
    // registry. This is service availability, NOT a live Nitrado game-state
    // or player-count reading; keep those on Discord's live status panels.
    const pvpAvailable = other.status === 'active';
    snapshot = Object.freeze({
      primary: 'Nasdara PvE',
      secondary: 'Nasdara PvP',
      mapKey: 'badlands',
      pvpAvailable,
      pvpServiceStatus: other.status
    });
    const updateText = (selector, value) => {
      document.querySelectorAll(selector).forEach(el => { el.textContent = value; });
    };
    updateText('[data-wwz-primary-world]', snapshot.primary);
    updateText('[data-wwz-network-worlds]', `${snapshot.primary} + ${snapshot.secondary}`);
    updateText('[data-wwz-rules-worlds]', `${snapshot.primary} and ${snapshot.secondary} keep separate published rulesets.`);
    updateText('[data-wwz-primary-live-copy]', `Primary world: ${snapshot.primary} · Secondary world: ${snapshot.secondary}`);
    updateText(
      '[data-wwz-service-notice]',
      pvpAvailable
        ? 'Nasdara PvE and Nasdara Full PvP services are available. See the live Discord status panels for current game state.'
        : 'Nasdara PvE service is available. Nasdara Full PvP is temporarily unavailable.'
    );
    updateText(
      '[data-wwz-network-state]',
      pvpAvailable ? 'PvE + Full PvP · Services available' : 'PvE available · Full PvP paused'
    );
    updateText(
      '[data-wwz-pvp-service-status]',
      pvpAvailable ? 'Secondary server · Service available' : 'Secondary server · Temporarily unavailable'
    );
    updateText(
      '[data-wwz-pvp-description]',
      pvpAvailable
        ? 'Nasdara Full PvP hosting and WWZ bot integrations are active again. Enjoy full-map player-versus-player gameplay with a separate economy, rentals and progression.'
        : 'Nasdara Full PvP is temporarily unavailable. Its server configuration, survivor records and separate economy remain preserved.'
    );
    updateText(
      '[data-wwz-pvp-operations]',
      pvpAvailable
        ? 'Separate Nitrado and Discord services, with active bot monitoring and shop integrations.'
        : 'Separate Nitrado and Discord services; gameplay is temporarily unavailable.'
    );
    document.querySelectorAll('[data-wwz-availability-banner]').forEach(el => {
      el.dataset.availabilityState = pvpAvailable ? 'active' : 'paused';
    });
    document.dispatchEvent(new CustomEvent('wwz:worldbranding', { detail: snapshot }));
    return true;
  };
  const refresh = async () => {
    try {
      const response = await fetch(ENDPOINT, { method: 'GET', mode: 'cors', cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!response.ok) return false;
      return update(await response.json());
    } catch (_) { return false; } // Retain neutral placeholders if the live world registry is offline.
  };
  window.WWZWorldBranding = Object.freeze({refresh, getSnapshot: () => snapshot});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh, { once: true });
  else refresh();
  // Keep a long-open homepage current without polling Nitrado or touching
  // players' authenticated server selections.
  if (typeof window.setInterval === 'function') {
    window.setInterval(() => {
      if (document.visibilityState !== 'hidden') void refresh();
    }, 180000);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void refresh();
  });
})();
