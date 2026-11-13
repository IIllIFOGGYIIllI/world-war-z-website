/* WWZ V3.19 — unchanged Discord policy gate plus enhanced staff audit.
   No token or accepted state is written to localStorage. Server acceptance is
   checked after each authenticated server selection, not inferred from a browser
   preference. Existing public visitor notice remains unchanged. */
(function (root) {
  'use strict';
  const VERSION = '2026-11-13.1';
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

  // V3.19: policy audit is always scoped to the currently selected Nasdara
  // server. The API enforces staff permissions and binds the verified guild.
  let auditPanel = null;
  let auditElements = null;
  let auditOffset = 0;
  let auditRequestId = 0;
  const AUDIT_PAGE_SIZE = 25;

  const auditOption = (value, title) => {
    const option = make('option', '', title);
    option.value = value;
    return option;
  };
  const refreshAuditVersions = (versions, selected) => {
    if (!auditElements) return;
    const select = auditElements.version;
    select.replaceChildren(
      auditOption('all', 'All policy versions'),
      auditOption('current', 'Current version'),
      auditOption('older', 'Previous versions')
    );
    for (const item of Array.isArray(versions) ? versions : []) {
      const version = String(item?.version || '');
      if (!/^\\d{4}-\\d{2}-\\d{2}\\.\\d{1,3}$/.test(version)) continue;
      select.append(auditOption(version, version + ' (' + Number(item.records || 0) + ')'));
    }
    if ([...select.options].some(option => option.value === selected)) select.value = selected;
    else select.value = 'all';
  };

  const clearAuditResults = () => {
    ++auditRequestId; // Prevent an old request from exposing another server's results.
    auditOffset = 0;
    if (!auditElements) return;
    const { body, summary, stats, previous, next, refresh, search, version } = auditElements;
    body.replaceChildren();
    summary.textContent = 'Select Load records to view this server’s acceptance history.';
    stats.hidden = true;
    previous.disabled = true;
    next.disabled = true;
    refresh.disabled = false;
    refresh.textContent = 'Load records';
    search.value = '';
    version.value = 'all';
  };

  const loadPolicyAudit = async ({ resetOffset = false } = {}) => {
    if (!auditElements) return;
    const server = getServer();
    const token = getToken();
    if (!shouldCheck(authenticated, server, token) ||
        !['staff', 'owner'].includes(accessLevel)) return;
    const { search, version, body, summary, stats, figures, pageInfo,
      previous, next, refresh, serverName } = auditElements;
    const prefix = search.value.trim();
    if (prefix && !/^[0-9]{3,20}$/.test(prefix)) {
      summary.textContent = 'Enter at least 3 digits from the start of a Discord account ID.';
      return;
    }
    if (resetOffset) auditOffset = 0;
    const requestId = ++auditRequestId;
    const query = new URLSearchParams({
      limit: String(AUDIT_PAGE_SIZE),
      offset: String(auditOffset),
      version: version.value
    });
    if (prefix) query.set('discord', prefix);
    refresh.disabled = true;
    previous.disabled = true;
    next.disabled = true;
    summary.textContent = 'Verifying acceptance records for this Nasdara server…';
    const selected = root.WWZServerContext?.getSelectedServer?.();
    serverName.textContent = String(selected?.name || 'Selected Nasdara server');
    try {
      const response = await safeRequest(AUDIT_URL + '?' + query.toString(), {
        method: 'GET', headers: headers()
      });
      if (requestId !== auditRequestId || getServer() !== server ||
          getToken() !== token || !authenticated || !['staff','owner'].includes(accessLevel)) return;
      if (!response.ok) throw new Error('Audit search was not authorised or is temporarily unavailable.');
      const payload = await response.json();
      if (requestId !== auditRequestId || getServer() !== server ||
          getToken() !== token || !authenticated || !['staff','owner'].includes(accessLevel)) return;
      const records = Array.isArray(payload.records) ? payload.records : [];
      body.replaceChildren();
      for (const record of records) {
        const row = document.createElement('tr');
        for (const value of [record.discord_id, record.policy_version, record.accepted_at]) {
          row.append(make('td', '', String(value ?? '—')));
        }
        body.append(row);
      }
      if (!records.length) {
        const row = document.createElement('tr');
        const cell = make('td', '', 'No acceptance records match these filters.');
        cell.colSpan = 3;
        row.append(cell);
        body.append(row);
      }
      const safeCount = value => Math.max(0, Number(value) || 0).toLocaleString('en-AU');
      figures.accounts.textContent = safeCount(payload.unique_accounts);
      figures.current.textContent = safeCount(payload.current_accounts);
      figures.older.textContent = safeCount(payload.older_only_accounts);
      figures.history.textContent = safeCount(payload.total_records);
      stats.hidden = false;
      refreshAuditVersions(payload.versions, version.value);
      const filtered = Math.max(0, Number(payload.filtered_records) || 0);
      const first = filtered ? auditOffset + 1 : 0;
      const last = Math.min(filtered, auditOffset + records.length);
      pageInfo.textContent = first + '–' + last + ' of ' +
        filtered.toLocaleString('en-AU') + ' matching records';
      summary.textContent = 'Showing accepted policy records for ' +
        serverName.textContent + '. Statistics count only accounts with recorded acceptance.';
      previous.disabled = auditOffset <= 0;
      next.disabled = payload.has_more !== true;
      refresh.textContent = 'Refresh records';
    } catch (_) {
      if (requestId === auditRequestId && getServer() === server &&
          getToken() === token && authenticated) {
        summary.textContent = 'Unable to load policy records. Check staff permissions or retry.';
      }
    } finally {
      if (requestId === auditRequestId) {
        refresh.disabled = false;
      }
    }
  };

  const buildAuditPanel = () => {
    if (auditPanel) return auditPanel;
    const staffView = document.querySelector('[data-view-panel="staff"]');
    if (!staffView) return null;
    const panel = make('section', 'panel wwz-account-policy-audit');
    panel.id = 'wwz-policy-acceptance-audit';
    panel.hidden = true;
    panel.dataset.staffOnly = '';
    const title = make('h2', '', 'Policy acceptance audit');
    const note = make('p', '', 'Staff-only · records belong to your selected Nasdara server. Use the top-bar server switcher to inspect PvE or PvP separately.');
    const serverName = make('p', 'wwz-account-policy-audit-server', 'Selected Nasdara server');

    const stats = make('div', 'wwz-account-policy-audit-stats');
    stats.hidden = true;
    const figures = {};
    for (const [key, caption] of [
      ['accounts', 'Accounts recorded'],
      ['current', 'Accepted current version'],
      ['older', 'Previous versions only'],
      ['history', 'Total acceptance records']
    ]) {
      const tile = make('div', 'wwz-account-policy-audit-stat');
      const number = make('strong', '', '0');
      number.setAttribute('aria-label', caption);
      const label = make('small', '', caption);
      tile.append(number, label);
      stats.append(tile);
      figures[key] = number;
    }

    const form = make('form', 'wwz-account-policy-audit-filters');
    form.setAttribute('role', 'search');
    const searchLabel = make('label', '', 'Find Discord account ID');
    const search = document.createElement('input');
    search.type = 'search';
    search.inputMode = 'numeric';
    search.maxLength = 20;
    search.autocomplete = 'off';
    search.placeholder = 'First 3+ digits (optional)';
    search.setAttribute('aria-label', 'Discord account ID prefix');
    searchLabel.append(search);

    const versionLabel = make('label', '', 'Policy version');
    const version = document.createElement('select');
    version.setAttribute('aria-label', 'Policy version filter');
    version.append(
      auditOption('all', 'All policy versions'),
      auditOption('current', 'Current version'),
      auditOption('older', 'Previous versions')
    );
    versionLabel.append(version);

    const searchButton = make('button', 'secondary-action', 'Search records');
    searchButton.type = 'submit';
    const clearButton = make('button', 'secondary-action', 'Clear filters');
    clearButton.type = 'button';
    const refresh = make('button', 'secondary-action', 'Load records');
    refresh.type = 'button';
    form.append(searchLabel, versionLabel, searchButton, clearButton, refresh);

    const summary = make('p', 'wwz-account-policy-audit-status',
      'Select Load records to view this server’s acceptance history.');
    summary.setAttribute('role', 'status');
    summary.setAttribute('aria-live', 'polite');

    const tableWrap = make('div', 'wwz-account-policy-audit-scroll');
    const table = make('table', 'wwz-account-policy-audit-table');
    const head = document.createElement('thead');
    const headRow = document.createElement('tr');
    for (const name of ['Discord account ID', 'Policy version', 'Accepted (UTC)']) {
      const th = make('th', '', name); th.scope = 'col'; headRow.append(th);
    }
    head.append(headRow);
    const body = document.createElement('tbody');
    table.append(head, body);
    tableWrap.append(table);

    const paging = make('div', 'wwz-account-policy-audit-paging');
    const previous = make('button', 'secondary-action', 'Previous');
    previous.type = 'button'; previous.disabled = true;
    const pageInfo = make('span', '', 'No records loaded');
    pageInfo.setAttribute('aria-live', 'polite');
    const next = make('button', 'secondary-action', 'Next');
    next.type = 'button'; next.disabled = true;
    paging.append(previous, pageInfo, next);
    panel.append(title, note, serverName, stats, form, summary, tableWrap, paging);
    staffView.append(panel);
    auditPanel = panel;
    auditElements = { body, summary, stats, figures, pageInfo,
      previous, next, refresh, search, version, serverName };

    form.addEventListener('submit', event => {
      event.preventDefault();
      loadPolicyAudit({ resetOffset: true });
    });
    refresh.addEventListener('click', () => loadPolicyAudit());
    version.addEventListener('change', () => loadPolicyAudit({ resetOffset: true }));
    clearButton.addEventListener('click', () => {
      search.value = '';
      version.value = 'all';
      loadPolicyAudit({ resetOffset: true });
    });
    previous.addEventListener('click', () => {
      if (previous.disabled) return;
      auditOffset = Math.max(0, auditOffset - AUDIT_PAGE_SIZE);
      loadPolicyAudit();
    });
    next.addEventListener('click', () => {
      if (next.disabled) return;
      auditOffset += AUDIT_PAGE_SIZE;
      loadPolicyAudit();
    });
    return panel;
  };
  const updateAuditVisibility = () => {
    const panel = buildAuditPanel();
    if (!panel) return;
    const allowed = authenticated && ['staff', 'owner'].includes(accessLevel);
    if (!allowed) clearAuditResults();
    panel.hidden = !allowed;
  };
  root.addEventListener('wwz:authchange', event => {
    authenticated = event.detail?.authenticated === true;
    accessLevel = authenticated ? String(event.detail?.accessLevel || 'member') : 'guest';
    if (!authenticated) { ++generation; closeDialog(); clearNotice(); clearAuditResults(); }
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
    clearAuditResults();
    if (authenticated) check();
  });
  const boot = () => {
    buildAuditPanel();
    // Restore a saved session after reload even if an earlier auth event raced
    // script loading. Railway still authenticates the bearer token before read.
    if (getToken() && getServer()) { authenticated = true; check(); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})(typeof window !== 'undefined' ? window : null);
