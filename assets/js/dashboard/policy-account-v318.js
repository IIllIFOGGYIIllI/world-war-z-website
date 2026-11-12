/* WWZ V3.18 — server-verified Discord policy acceptance and staff audit.
   No token or accepted state is written to localStorage. Server acceptance is
   checked after each authenticated server selection, not inferred from a browser
   preference. Existing public visitor notice remains unchanged. */
(function (root) {
  'use strict';
  const VERSION = '2026-11-12.1';
  const BASE = 'https://world-war-z.up.railway.app';
  const STATUS_URL = BASE + '/api/account/policy';
  const ACCEPT_URL = BASE + '/api/account/policy/accept';
  const AUDIT_URL = BASE + '/api/admin/policy/acceptances';
  const SESSION_KEY = 'wwz_dashboard_session';
  const shouldCheck = (authenticated, serverKey, token) =>
    authenticated === true && Boolean(serverKey && token && String(token).length >= 32);
  if (typeof module === 'object' && module.exports) module.exports = { VERSION, shouldCheck };
  if (!root || typeof document === 'undefined') return;

  let authenticated = false;
  let accessLevel = 'guest';
  let generation = 0;
  let dialog = null;
  let message = null;
  let submit = null;
  let agreed = null;
  let privacy = null;
  let pendingServer = '';
  const getToken = () => {
    try { return root.sessionStorage.getItem(SESSION_KEY) || ''; } catch (_) { return ''; }
  };
  const getServer = () => String(root.WWZServerContext?.getSelectedServer?.()?.key || '');
  const headers = () => ({ 'Accept': 'application/json', 'Authorization': 'Bearer ' + getToken() });
  const safeRequest = (url, options) => {
    if (!root.WWZHttp?.request) throw new Error('The protected API client is unavailable.');
    return root.WWZHttp.request(url, options, 15000);
  };
  const policyHref = (page) => page; // All authenticated routes live at dashboard.html.
  const make = (tag, cls, label) => {
    const element = document.createElement(tag);
    if (cls) element.className = cls;
    if (label !== undefined) element.textContent = label;
    return element;
  };
  const closeDialog = () => {
    if (dialog?.open) dialog.close();
    document.body.classList.remove('wwz-account-policy-pending');
    pendingServer = '';
  };
  const updateCheckboxes = () => { if (submit) submit.disabled = !(agreed?.checked && privacy?.checked); };
  const ensureDialog = () => {
    if (dialog) return dialog;
    dialog = make('dialog', 'wwz-account-policy-dialog');
    dialog.setAttribute('aria-labelledby', 'wwz-account-policy-title');
    dialog.setAttribute('aria-describedby', 'wwz-account-policy-intro');
    const frame = make('div', 'wwz-account-policy-inner');
    frame.append(
      make('p', 'wwz-account-policy-kicker', 'DISCORD ACCOUNT · CURRENT SERVER'),
      (() => { const title = make('h2', '', 'Confirm current community policies'); title.id = 'wwz-account-policy-title'; return title; })(),
      (() => { const intro = make('p', '', 'Your Discord account needs a current policy acknowledgement for this Nasdara server. This records the policy version and acceptance time in Railway, not just this browser.'); intro.id = 'wwz-account-policy-intro'; return intro; })()
    );
    const links = make('nav', 'wwz-account-policy-links');
    links.setAttribute('aria-label', 'Review community policies');
    for (const [label, page] of [
      ['Terms of Service', 'terms.html'], ['Privacy Policy', 'privacy.html'],
      ['Server Rules', 'rules.html'], ['Community Guidelines', 'community-guidelines.html'],
      ['Moderation & Appeals', 'moderation-policy.html']
    ]) {
      const link = make('a', '', label);
      link.href = policyHref(page); link.target = '_blank'; link.rel = 'noopener noreferrer';
      links.append(link);
    }
    frame.append(links);
    const checkbox = (text) => {
      const label = make('label', 'wwz-account-policy-check');
      const input = document.createElement('input');
      input.type = 'checkbox';
      const span = make('span', '', text);
      label.append(input, span);
      input.addEventListener('change', updateCheckboxes);
      frame.append(label);
      return input;
    };
    agreed = checkbox('I agree to the Terms of Service, Server Rules and Community Guidelines.');
    privacy = checkbox('I acknowledge the Privacy Policy, including GPS history and authorised staff access.');
    const actions = make('div', 'wwz-account-policy-actions');
    const leave = make('a', 'wwz-account-policy-leave', 'Not now · view policies');
    leave.href = 'legal.html';
    submit = make('button', 'wwz-account-policy-submit', 'Accept for this Discord account');
    submit.type = 'button';
    submit.disabled = true;
    actions.append(leave, submit);
    message = make('p', 'wwz-account-policy-message');
    message.setAttribute('role', 'status'); message.setAttribute('aria-live', 'polite');
    frame.append(actions, message);
    dialog.append(frame);
    document.body.append(dialog);
    dialog.addEventListener('cancel', event => event.preventDefault());
    submit.addEventListener('click', async () => {
      if (submit.disabled || !agreed.checked || !privacy.checked) return;
      const server = getServer();
      const token = getToken();
      if (!shouldCheck(authenticated, server, token) || server !== pendingServer) return;
      const ticket = ++generation;
      submit.disabled = true;
      message.textContent = 'Saving your account acknowledgement…';
      try {
        const response = await safeRequest(ACCEPT_URL, {
          method: 'POST',
          headers: { ...headers(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ policy_version: VERSION, agreed_to_terms: true, acknowledged_privacy: true })
        });
        if (ticket !== generation || getServer() !== server || getToken() !== token) return;
        const data = await response.json();
        if (!response.ok || data.policy_version !== VERSION || data.accepted !== true) {
          message.textContent = response.status === 409
            ? 'Policy version changed. Update WWZ Companion and review the new policies.'
            : String(data.message || 'Acceptance could not be saved. Please retry.');
          updateCheckboxes();
          return;
        }
        closeDialog();
        root.dispatchEvent(new CustomEvent('wwz:policyaccepted', {
          detail: { serverKey: server, policyVersion: VERSION }
        }));
      } catch (_) {
        if (ticket === generation) {
          message.textContent = 'Railway could not save your acknowledgement. Check your connection and try again.';
          updateCheckboxes();
        }
      }
    });
    return dialog;
  };
  const showDialog = (server) => {
    ensureDialog();
    pendingServer = server;
    agreed.checked = false;
    privacy.checked = false;
    updateCheckboxes();
    message.textContent = 'Policy version ' + VERSION + ' · only your current server account is recorded.';
    document.body.classList.add('wwz-account-policy-pending');
    if (!dialog.open) dialog.showModal();
    agreed.focus({ preventScroll: true });
  };

  let notice = null;
  const showNotice = (copy) => {
    if (!notice) {
      notice = make('div', 'wwz-account-policy-notice');
      notice.setAttribute('role', 'status');
      const text = make('span', '');
      const retry = make('button', '', 'Retry policy check');
      retry.type = 'button'; retry.addEventListener('click', () => { check(); });
      notice.append(text, retry);
      const main = document.querySelector('.dashboard-main');
      main?.prepend(notice);
    }
    if (!notice.isConnected) return;
    notice.firstElementChild.textContent = copy;
    notice.hidden = false;
  };
  const clearNotice = () => { if (notice) notice.hidden = true; };

  const check = async () => {
    const server = getServer();
    const token = getToken();
    const ticket = ++generation;
    if (!shouldCheck(authenticated, server, token)) { closeDialog(); clearNotice(); return; }
    try {
      const response = await safeRequest(STATUS_URL, { method: 'GET', headers: headers() });
      if (ticket !== generation || getServer() !== server || getToken() !== token || !authenticated) return;
      if (response.status === 401) { closeDialog(); clearNotice(); return; }
      if (!response.ok) throw new Error('Policy check unavailable');
      const data = await response.json();
      if (data.policy_version !== VERSION) {
        closeDialog();
        showNotice('A newer community policy version is available. Update WWZ Companion before accepting.');
        return;
      }
      clearNotice();
      if (data.accepted === true) closeDialog();
      else if (data.requires_acceptance === true) showDialog(server);
      else showNotice('The policy status response was incomplete. Retry the verification.');
    } catch (_) {
      if (ticket === generation && authenticated) {
        closeDialog();
        showNotice('Your Discord policy record could not be verified. Retry when the World War Z API is available.');
      }
    }
  };

  let auditPanel = null;
  const buildAuditPanel = () => {
    if (auditPanel) return auditPanel;
    const staffView = document.querySelector('[data-view-panel="staff"]');
    if (!staffView) return null;
    const panel = make('section', 'panel wwz-account-policy-audit');
    panel.hidden = true;
    panel.dataset.staffOnly = '';
    const title = make('h2', '', 'Discord policy acceptance audit');
    const note = make('p', '', 'Staff-only · current Nasdara server · Discord IDs, policy versions and Railway timestamps. No IP addresses or session tokens are stored.');
    const actions = make('div', 'wwz-account-policy-audit-actions');
    const refresh = make('button', 'secondary-action', 'Load acceptance records');
    refresh.type = 'button';
    const status = make('p', 'wwz-account-policy-audit-status', 'Select Load to verify current records.');
    status.setAttribute('role', 'status');
    const tableWrap = make('div', 'wwz-account-policy-audit-scroll');
    const table = make('table', 'wwz-account-policy-audit-table');
    const head = document.createElement('thead');
    const headRow = document.createElement('tr');
    ['Discord account ID', 'Policy version', 'Accepted (UTC)'].forEach(name => {
      const th = make('th', '', name); th.scope = 'col'; headRow.append(th);
    });
    head.append(headRow);
    const body = document.createElement('tbody');
    table.append(head, body);
    tableWrap.append(table);
    refresh.addEventListener('click', async () => {
      const server = getServer();
      const token = getToken();
      if (!shouldCheck(authenticated, server, token) || !['staff', 'owner'].includes(accessLevel)) return;
      refresh.disabled = true;
      status.textContent = 'Loading server-scoped acceptance records…';
      try {
        const response = await safeRequest(AUDIT_URL + '?limit=50', {
          method: 'GET', headers: headers()
        });
        if (getServer() !== server || getToken() !== token) return;
        if (!response.ok) throw new Error('Audit unavailable or access denied');
        const payload = await response.json();
        body.replaceChildren();
        for (const record of payload.records || []) {
          const tr = document.createElement('tr');
          [record.discord_id, record.policy_version, record.accepted_at].forEach(value => {
            tr.append(make('td', '', String(value ?? '—')));
          });
          body.append(tr);
        }
        status.textContent = `${Number(payload.current_acceptances || 0)} current-version acceptances · ${Number(payload.total_records || 0)} records · showing up to 50 latest`;
      } catch (_) {
        status.textContent = 'Unable to read the acceptance audit. Verify staff access and try again.';
      } finally { refresh.disabled = false; }
    });
    actions.append(refresh);
    panel.append(title, note, actions, status, tableWrap);
    staffView.append(panel);
    auditPanel = panel;
    return panel;
  };
  const updateAuditVisibility = () => {
    const panel = buildAuditPanel();
    if (panel) panel.hidden = !(authenticated && ['staff', 'owner'].includes(accessLevel));
  };
  root.addEventListener('wwz:authchange', event => {
    authenticated = event.detail?.authenticated === true;
    accessLevel = authenticated ? String(event.detail?.accessLevel || 'member') : 'guest';
    if (!authenticated) { ++generation; closeDialog(); clearNotice(); }
    updateAuditVisibility();
    if (authenticated) check();
  });
  root.addEventListener('wwz:accesschange', event => {
    if (authenticated && event.detail?.accessLevel) accessLevel = String(event.detail.accessLevel);
    updateAuditVisibility();
  });
  root.addEventListener('wwz:serverchange', () => {
    ++generation;
    closeDialog();
    clearNotice();
    if (auditPanel) {
      const tbody = auditPanel.querySelector('tbody'); tbody?.replaceChildren();
    }
    if (authenticated) check();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildAuditPanel, { once: true });
  else buildAuditPanel();
})(typeof window !== 'undefined' ? window : null);
