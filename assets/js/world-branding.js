/* WWZ Stage 2D Phase 1: public, registry-sourced presentation only. */
(() => {
  'use strict';
  const ENDPOINT = 'https://world-war-z.up.railway.app/api/world/branding';
  const KEYS = new Set(['chernarus', 'badlands', 'livonia']);
  let snapshot = null;
  const sanitize = (item) => item && KEYS.has(String(item.map_key || '').toLowerCase())
    && typeof item.world_name === 'string' && item.world_name.length <= 32
    ? item : null;
  const update = (data) => {
    const primary = sanitize(data?.primary);
    if (!primary || primary.primary !== true || primary.status !== 'active') return false;
    const secondary = (Array.isArray(data.servers) ? data.servers : []).find(item => item.map_key === 'livonia');
    const other = sanitize(secondary);
    if (!other) return false;
    snapshot = Object.freeze({primary: primary.world_name, secondary: other.world_name, mapKey: primary.map_key});
    document.querySelectorAll('[data-wwz-primary-world]').forEach(el => { el.textContent = snapshot.primary; });
    document.querySelectorAll('[data-wwz-network-worlds]').forEach(el => { el.textContent = `${snapshot.primary} + ${snapshot.secondary}`; });
    document.querySelectorAll('[data-wwz-rules-worlds]').forEach(el => { el.textContent = `${snapshot.primary} and ${snapshot.secondary} keep separate published rulesets.`; });
    document.querySelectorAll('[data-wwz-primary-live-copy]').forEach(el => { el.textContent = `Primary world: ${snapshot.primary} · Secondary world: ${snapshot.secondary}`; });
    document.dispatchEvent(new CustomEvent('wwz:worldbranding', { detail: snapshot }));
    return true;
  };
  const refresh = async () => {
    try {
      const response = await fetch(ENDPOINT, { method: 'GET', mode: 'cors', cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!response.ok) return false;
      return update(await response.json());
    } catch (_) { return false; } // Preserve truthful Chernarus labels when API is offline.
  };
  window.WWZWorldBranding = Object.freeze({refresh, getSnapshot: () => snapshot});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh, { once: true });
  else refresh();
})();
