/* Retry-safe, server-scoped checkout keys for DayZ Survivor Shop. */
(() => {
  'use strict';
  const STORAGE_KEY = 'wwz_shop_checkout_pending_v1';
  const newKey = () => `${Date.now().toString(36)}-${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}-shop`;
  const signature = ({ server, identity, request }) => JSON.stringify({
    server_key: String(server?.key || ''),
    map_key: String(server?.map_key || ''),
    discord_id: String(identity || ''),
    purchase_request: request
  });
  const read = () => {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null'); }
    catch { return null; }
  };
  const prepare = ({ server, identity, request }) => {
    if (!server?.key || !identity || !request) throw new Error('A verified server, Discord account and checkout are required.');
    const fingerprint = signature({ server, identity, request });
    const prior = read();
    if (prior?.fingerprint === fingerprint && typeof prior.key === 'string' &&
        prior.key.length >= 12 && prior.key.length <= 100) return prior.key;
    const key = newKey();
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ fingerprint, key })); } catch {}
    return key;
  };
  const clear = key => {
    if (!key) return;
    try { if (read()?.key === key) sessionStorage.removeItem(STORAGE_KEY); } catch {}
  };
  window.WWZCheckoutIdempotency = Object.freeze({ prepare, clear });
})();
