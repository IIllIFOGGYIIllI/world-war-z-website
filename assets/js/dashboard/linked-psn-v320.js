/* WWZ V3.20 — authenticated PlayStation alt account workspace.
 * All reads/writes are scoped by the Railway bearer session. The browser never
 * supplies an owner Discord ID. No unverified PSN is treated as linked.
 */
(function (root) {
  'use strict';
  if (!root || typeof document === 'undefined') return;
  const BASE = 'https://world-war-z.up.railway.app';
  const LIST_URL = BASE + '/api/account/psn-alts';
  const ACTION_URL = BASE + '/api/account/psn-alts/action';
  const SESSION_KEY = 'wwz_dashboard_session';
  const panel = document.querySelector('[data-view-panel="linked-psns"]');
  if (!panel) return;
  const $ = selector => panel.querySelector(selector);
  const content = $('[data-psn-alt-content]');
  const guest = $('[data-psn-alt-guest]');
  const primary = $('[data-psn-alt-primary]');
  const count = $('[data-psn-alt-count]');
  const list = $('[data-psn-alt-list]');
  const pending = $('[data-psn-alt-pending]');
  const form = $('[data-psn-alt-form]');
  const input = $('[data-psn-alt-input]');
  const submit = $('[data-psn-alt-submit]');
  const message = $('[data-psn-alt-message]');
  const refresh = $('[data-psn-alt-refresh]');
  const serverLabel = $('[data-psn-alt-server]');
  let authenticated = false;
  let active = false;
  let requestId = 0;
  let working = false;
  let canAdd = false;
  const psnValid = value => /^[A-Za-z][A-Za-z0-9_-]{2,15}$/.test(String(value || '').trim());
  const getToken = () => {
    try { return root.sessionStorage.getItem(SESSION_KEY) || ''; } catch (_) { return ''; }
  };
  const getServer = () => root.WWZServerContext?.getSelectedServer?.() || null;
  const authHeaders = () => ({
    Accept: 'application/json', Authorization: 'Bearer ' + getToken()
  });
  const validContext = () => authenticated && Boolean(getToken()) && Boolean(getServer()?.key);
  const request = (url, options) => {
    if (!root.WWZHttp?.request) throw new Error('Protected request client unavailable.');
    return root.WWZHttp.request(url, options, 15000);
  };
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const status = text => { message.textContent = String(text || ''); };
  const setWorking = value => {
    working = Boolean(value);
    if (submit) submit.disabled = working || !canAdd;
    if (refresh) refresh.disabled = working;
  };
  const clearPrivate = () => {
    ++requestId;
    canAdd = false;
    setWorking(false);
    primary.textContent = '—';
    count.textContent = '0 / 2';
    list.replaceChildren();
    pending.replaceChildren();
    pending.hidden = true;
    canAdd = false;
    input.disabled = true;
    input.value = '';
    status('');
  };
  const show = () => {
    const allowed = validContext();
    guest.hidden = allowed;
    content.hidden = !allowed;
    if (allowed) {
      serverLabel.textContent = String(getServer()?.name || 'Selected Nasdara server');
    }
  };

  const render = data => {
    primary.textContent = String(data.primary_psn || 'Not yet verified');
    const alts = Array.isArray(data.alts) ? data.alts : [];
    const max = Math.max(0, Number(data.max_alts) || 2);
    count.textContent = alts.length + ' / ' + max;
    list.replaceChildren();
    if (!alts.length) {
      list.append(make('p', 'wwz-psn-alt-empty', 'No secondary PSN accounts have been verified yet.'));
    }
    for (const alt of alts) {
      const psn = String(alt.psn_id || '');
      const card = make('div', 'wwz-psn-alt-item');
      const copy = make('div', 'wwz-psn-alt-copy');
      copy.append(make('strong', '', psn), make('small', '', 'Verified secondary PlayStation account'));
      const deactivate = make('button', 'secondary-action wwz-psn-alt-remove', 'Deactivate');
      deactivate.type = 'button';
      deactivate.setAttribute('aria-label', 'Deactivate secondary PSN ' + psn);
      deactivate.addEventListener('click', () => {
        if (working) return;
        if (!root.confirm || root.confirm(
          'Deactivate ' + psn + '? This will stop it resolving to your Discord account. Historical ownership and balances are retained.'
        )) {
          mutate({ action: 'deactivate', psn_id: psn, confirm: true });
        }
      });
      card.append(copy, deactivate);
      list.append(card);
    }
    pending.replaceChildren();
    const waiting = data.pending && typeof data.pending === 'object' ? data.pending : null;
    pending.hidden = !waiting;
    if (waiting) {
      const psn = String(waiting.psn_id || '');
      const expires = Date.parse(String(waiting.expires_at || ''));
      const expiry = Number.isFinite(expires)
        ? new Date(expires).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
        : 'soon';
      const details = make('div', '');
      details.append(
        make('strong', '', 'Waiting for DayZ verification: ' + psn),
        make('small', '', 'Join the selected Nasdara server before ' + expiry + '.')
      );
      const cancel = make('button', 'secondary-action', 'Cancel request');
      cancel.type = 'button';
      cancel.addEventListener('click', () => mutate({ action: 'cancel' }));
      pending.append(details, cancel);
    }
    canAdd = Boolean(data.primary_psn) && alts.length < max;
    input.disabled = !canAdd;
    submit.disabled = !canAdd || working;
    if (!data.primary_psn) {
      status('First link and verify a primary PlayStation ID using /account link in Discord.');
    } else if (alts.length >= max) {
      status('Two verified alts are linked. Deactivate an alt before adding another.');
    }
  };

  const load = async () => {
    if (!active) return;
    show();
    if (!validContext()) return;
    const token = getToken();
    const serverKey = getServer()?.key;
    const turn = ++requestId;
    setWorking(true);
    status('Loading your verified PlayStation identities…');
    try {
      const response = await request(LIST_URL, { method: 'GET', headers: authHeaders() });
      if (turn !== requestId || getToken() !== token || getServer()?.key !== serverKey || !active) return;
      const data = await response.json();
      if (!response.ok || data.status !== 'ok') throw new Error('Unable to verify account');
      render(data);
      if (data.primary_psn && (data.alts || []).length < (data.max_alts || 2)) status('');
    } catch (_) {
      if (turn === requestId) status('Unable to load your linked accounts. Check your connection and retry.');
    } finally {
      if (turn === requestId) setWorking(false);
    }
  };

  const mutate = async payload => {
    if (!active || !validContext() || working) return;
    const token = getToken();
    const serverKey = getServer()?.key;
    const turn = ++requestId;
    setWorking(true);
    status(payload.action === 'link' ? 'Creating your live PSN verification request…' : 'Updating linked PSN accounts…');
    try {
      const response = await request(ACTION_URL, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (turn !== requestId || getToken() !== token || getServer()?.key !== serverKey || !active) return;
      const data = await response.json();
      if (!response.ok || data.status !== 'ok') {
        status(String(data.message || 'The request was not accepted. Please retry.'));
        return;
      }
      render(data);
      if (payload.action === 'link') input.value = '';
      status(String(data.message || (payload.action === 'cancel' ?
        'Pending verification cancelled.' : 'Linked accounts updated.')));
    } catch (_) {
      if (turn === requestId) status('Your request could not be completed. Please retry.');
    } finally {
      if (turn === requestId) setWorking(false);
    }
  };

  form?.addEventListener('submit', event => {
    event.preventDefault();
    if (working) return;
    const psn_id = input.value.trim();
    if (!psnValid(psn_id)) {
      status('Enter the exact PSN name (3–16 characters; letters, digits, hyphen or underscore).');
      return;
    }
    mutate({ action: 'link', psn_id });
  });
  refresh?.addEventListener('click', load);
  root.addEventListener('wwz:authchange', event => {
    authenticated = event.detail?.authenticated === true;
    if (!authenticated) clearPrivate();
    show();
    if (authenticated && active) load();
  });
  root.addEventListener('wwz:serverchange', () => {
    clearPrivate();
    show();
    if (active && validContext()) load();
  });
  root.addEventListener('wwz:viewchange', event => {
    active = event.detail?.view === 'linked-psns';
    if (!active) clearPrivate();
    show();
    if (active && validContext()) load();
  });
  // A returning PWA session may already exist before this deferred module loads.
  input.disabled = true;
  submit.disabled = true;
  if (getToken() && getServer()?.key) authenticated = true;
  show();
  // When a bookmark opens directly at #linked-psns/overview, account.js or
  // the shell might have dispatched viewchange before this script subscribed.
  const restoreDeepLink = () => {
    active = Boolean(document.querySelector(
      '.sidebar-navigation .side-link.active[data-view="linked-psns"]'
    )) || String(root.location?.hash || '').startsWith('#linked-psns/');
    show();
    if (active && validContext()) load();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restoreDeepLink, { once: true });
  } else restoreDeepLink();
})(typeof window !== 'undefined' ? window : null);
