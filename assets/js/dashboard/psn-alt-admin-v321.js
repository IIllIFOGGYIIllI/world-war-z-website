/* V3.21: staff PSN identity review and owner-only audited actions. */
(function (root) {
  'use strict';
  if (!root || typeof document === 'undefined') return;
  const panel = document.querySelector('[data-psn-alt-admin]');
  if (!panel) return;
  const $ = selector => panel.querySelector(selector);
  const form = $('[data-alt-admin-form]');
  const input = $('[data-alt-admin-query]');
  const status = $('[data-alt-admin-status]');
  const results = $('[data-alt-admin-results]');
  const history = $('[data-alt-admin-history]');
  const audit = $('[data-alt-admin-audit]');
  const searchButton = $('[data-alt-admin-search]');
  const base = 'https://world-war-z.up.railway.app';
  const tokenKey = 'wwz_dashboard_session';
  let epoch = 0;
  let active = false;
  let busy = false;
  let lastQuery = '';
  const token = () => {
    try { return root.sessionStorage.getItem(tokenKey) || ''; } catch (_) { return ''; }
  };
  const serverKey = () => String(root.WWZServerContext?.getSelectedServer?.()?.key || '');
  const authorized = () => Boolean(active && token() && serverKey());
  const clean = value => String(value == null ? '' : value);
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = clean(text);
    return node;
  };
  const setMessage = (message, tone = '') => {
    status.textContent = clean(message);
    status.dataset.tone = tone;
  };
  const clear = () => {
    epoch++;
    lastQuery = '';
    busy = false;
    if (input) input.value = '';
    results.replaceChildren();
    history.replaceChildren();
    audit.replaceChildren();
    setMessage('');
    if (searchButton) searchButton.disabled = false;
  };
  const request = async (path, opts = {}) => {
    if (!root.WWZHttp?.request) throw new Error('Protected API client is unavailable.');
    const response = await root.WWZHttp.request(base + path, {
      ...opts,
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer ' + token(),
        ...(opts.body ? { 'Content-Type': 'application/json' } : {})
      }
    }, 15000);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status !== 'ok') {
      throw new Error(clean(payload.message || 'The request was denied.'));
    }
    return payload;
  };
  const setBusy = value => {
    busy = Boolean(value);
    if (searchButton) searchButton.disabled = busy;
    if (input) input.disabled = busy;
  };
  const eventEntry = data => {
    const item = element('li', 'wwz-alt-admin-audit-item');
    const meta = element('small', '', clean(data.created_at || '') + ' · ' +
      clean(data.actor_kind || 'system'));
    item.append(element('strong', '', clean(data.action || 'event') +
      ' · ' + clean(data.psn_id || 'PSN')), meta);
    if (data.reason) item.append(element('span', '', clean(data.reason)));
    return item;
  };
  const renderAudit = rows => {
    audit.replaceChildren();
    if (!Array.isArray(rows) || !rows.length) {
      audit.append(element('li', 'wwz-alt-admin-empty', 'No matching identity activity recorded yet.'));
      return;
    }
    rows.slice(0, 50).forEach(entry => audit.append(eventEntry(entry)));
  };
  const renderHistory = rows => {
    history.replaceChildren();
    if (!Array.isArray(rows) || !rows.length) {
      history.append(element('p', 'wwz-alt-admin-empty', 'No exact historic player match in either world.'));
      return;
    }
    rows.forEach(record => {
      const block = element('div', 'wwz-alt-admin-conflict');
      block.append(
        element('strong', '', clean(record.psn_id || 'PSN') + ' · ' + clean(record.server_key || 'server')),
        element('small', '', 'Existing record attached to Discord ' +
          clean(record.discord_id || 'unknown') + ' · review required before any linking')
      );
      history.append(block);
    });
  };
  const submitOwnerAction = async (action, record, psn, reason) => {
    if (!authorized() || busy) return;
    const cleanReason = clean(reason).trim();
    if (cleanReason.length < 8) {
      setMessage('Enter a reason of at least 8 characters for an administrative change.', 'error');
      return;
    }
    const description = action === 'deactivate' ? 'Deactivate verified alt ' + psn :
      'Cancel pending alt verification for ' + clean(record.primary_psn || record.discord_id);
    if (!root.confirm || !root.confirm(description +
      '? This is audited and does not delete game history, wallets or purchases.')) return;
    const server = serverKey(), capturedToken = token(), turn = ++epoch;
    setBusy(true);
    setMessage('Saving audited identity change…', 'info');
    try {
      const payload = await request('/api/admin/account/psn-alts/action', {
        method: 'POST', body: JSON.stringify({
          action, discord_id: clean(record.discord_id),
          psn_id: clean(psn), reason: cleanReason, confirm: true
        })
      });
      if (turn !== epoch || serverKey() !== server || token() !== capturedToken || !active) return;
      setMessage(payload.message + (payload.dm_delivered ? ' Discord notice delivered.' :
        ' Discord DM could not be delivered; action remains logged.'), 'success');
      setBusy(false);
      await search(lastQuery, { preserveMessage: true });
    } catch (error) {
      if (turn === epoch) setMessage(error.message || 'Unable to update PSN link.', 'error');
    } finally {
      if (turn === epoch) setBusy(false);
    }
  };
  const addAction = (parent, action, record, psn, reasonInput) => {
    const label = action === 'deactivate' ? 'Deactivate ' + psn : 'Cancel pending request';
    const button = element('button', 'secondary-action wwz-alt-admin-manage', label);
    button.type = 'button';
    button.addEventListener('click', () => submitOwnerAction(action, record, psn, reasonInput.value));
    parent.append(button);
  };
  const renderAccounts = (rows, canManage) => {
    results.replaceChildren();
    if (!Array.isArray(rows) || !rows.length) {
      results.append(element('p', 'wwz-alt-admin-empty', 'No verified survivor matches this search.'));
      return;
    }
    for (const record of rows) {
      const card = element('section', 'wwz-alt-admin-record');
      const heading = element('div', 'wwz-alt-admin-record-heading');
      heading.append(element('strong', '', clean(record.primary_psn || 'Unverified')),
        element('small', '', 'Discord ID ' + clean(record.discord_id) +
          (record.primary_verified ? ' · Primary verified' : ' · Primary unverified')));
      card.append(heading);
      const linked = Array.isArray(record.alts) ? record.alts : [];
      if (!linked.length) card.append(element('p', 'wwz-alt-admin-empty', 'No secondary PSNs on record.'));
      const reasonInput = element('input', 'wwz-alt-admin-reason');
      reasonInput.type = 'text';
      reasonInput.maxLength = 500;
      reasonInput.placeholder = 'Reason for owner action (8+ characters)';
      reasonInput.setAttribute('aria-label', 'Audit reason for ' + clean(record.primary_psn || record.discord_id));
      for (const alt of linked) {
        const row = element('div', 'wwz-alt-admin-psn');
        row.append(element('span', '', clean(alt.psn_id || 'PSN')),
          element('small', '', Number(alt.active) === 1 ? 'Verified · active' : 'Inactive · ownership reserved'));
        if (canManage && Number(alt.active) === 1)
          addAction(row, 'deactivate', record, clean(alt.psn_id), reasonInput);
        card.append(row);
      }
      if (record.pending) {
        const row = element('div', 'wwz-alt-admin-psn');
        row.append(element('span', '', clean(record.pending.psn_id || 'Pending PSN')),
          element('small', '', 'Awaiting live DayZ verification · ' + clean(record.pending.expires_at || '')));
        if (canManage) addAction(row, 'cancel_pending', record, '', reasonInput);
        card.append(row);
      }
      if (canManage) card.append(reasonInput);
      results.append(card);
    }
  };
  const search = async (value, opts = {}) => {
    const q = clean(value).trim().slice(0, 64);
    if (!authorized() || busy || q.length < 3) {
      if (q.length < 3) setMessage('Enter at least three characters to search.', 'error');
      return;
    }
    lastQuery = q;
    const turn = ++epoch, server = serverKey(), capturedToken = token();
    setBusy(true);
    if (!opts.preserveMessage) setMessage('Searching verified PSN identity registry…', 'info');
    try {
      const data = await request('/api/admin/account/psn-alts?q=' + encodeURIComponent(q), { method: 'GET' });
      if (turn !== epoch || serverKey() !== server || token() !== capturedToken || !active) return;
      renderAccounts(data.results, data.can_manage);
      renderHistory(data.history_conflicts);
      renderAudit(data.audit);
      if (!opts.preserveMessage) {
        setMessage((data.results || []).length + ' linked survivor(s) found. ' +
          'Existing funded identities remain review-only.', 'success');
      }
    } catch (error) {
      if (turn === epoch) setMessage(error.message || 'Search failed.', 'error');
    } finally {
      if (turn === epoch) setBusy(false);
    }
  };
  form?.addEventListener('submit', event => {
    event.preventDefault();
    if (!busy) search(input.value);
  });
  root.addEventListener('wwz:authchange', clear);
  root.addEventListener('wwz:serverchange', clear);
  root.addEventListener('wwz:viewchange', event => {
    const next = event.detail?.view === 'staff' && event.detail?.section === 'identity-sync';
    if (!next && active) clear();
    active = next;
  });
  active = String(root.location?.hash || '').includes('identity-sync');
})(typeof window !== 'undefined' ? window : null);
