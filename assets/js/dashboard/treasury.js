(() => {
  'use strict';

  const root = document.querySelector('[data-treasury-root]');
  if (!root) return;

  const STATE_URL = `${DASHBOARD_API_BASE}/api/account/treasury`;
  const ACTION_URL = `${DASHBOARD_API_BASE}/api/account/treasury/action`;
  const ADMIN_ACTION_URL = `${DASHBOARD_API_BASE}/api/admin/treasury/action`;
  const q = (selector) => root.querySelector(selector);
  const qa = (selector) => [...root.querySelectorAll(selector)];
  const token = () => storageGet(AUTH_SESSION_KEY);
  let loading = false;
  let payload = null;

  const localTime = (iso) => {
    const time = Date.parse(String(iso || ''));
    if (!Number.isFinite(time)) return 'Unknown time';
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(time));
  };

  const setText = (selector, value) => {
    const node = q(selector);
    if (node) node.textContent = String(value ?? '—');
  };

  const setMessage = (copy = '', tone = 'info') => {
    const node = q('[data-treasury-message]');
    if (!node) return;
    node.textContent = copy;
    node.hidden = !copy;
    node.dataset.tone = tone;
  };

  const renderActivity = (rows = []) => {
    const list = q('[data-treasury-activity]');
    const empty = q('[data-treasury-activity-empty]');
    if (!list) return;
    list.replaceChildren();
    const safe = Array.isArray(rows) ? rows : [];
    if (empty) empty.hidden = safe.length !== 0;
    safe.slice(0, 12).forEach((row) => {
      const amount = Math.trunc(Number(row.amount) || 0);
      const li = document.createElement('li');
      const mark = document.createElement('span');
      mark.className = 'treasury-activity-mark';
      mark.textContent = amount > 0 ? '+' : amount < 0 ? '−' : '•';
      const body = document.createElement('div');
      const title = document.createElement('strong');
      const signed = amount === 0 ? 'No balance change' : `${amount > 0 ? '+' : '−'}${formatMoney(Math.abs(amount))}`;
      title.textContent = `${signed} · ${String(row.transaction_type || 'Treasury activity').replaceAll('_', ' ')}`;
      const meta = document.createElement('small');
      const target = row.counterparty_psn_id ? ` · ${row.counterparty_psn_id}` : '';
      meta.textContent = `${row.actor_name || 'System'}${target} · ${localTime(row.created_at)}${row.details ? ` · ${row.details}` : ''}`;
      body.append(title, meta);
      li.append(mark, body);
      list.append(li);
    });
  };

  const adminAction = async (body) => {
    const session = token();
    if (!session) throw new Error('Sign in with an Admin account to continue.');
    const response = await protectedActionFetch(ADMIN_ACTION_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${session}` },
      body: JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({}));
    if (typeof handleAdminPlayerAuthorizationResponse === 'function' && handleAdminPlayerAuthorizationResponse(response, data, { actionRequest: true })) return null;
    if (!response.ok || data.status !== 'ok') throw new Error(data.message || 'Treasury administration failed.');
    return data;
  };

  const renderEscrows = (rows = []) => {
    const list = q('[data-treasury-escrows]');
    const empty = q('[data-treasury-escrows-empty]');
    if (!list) return;
    list.replaceChildren();
    const held = (Array.isArray(rows) ? rows : []).filter((row) => String(row.status) === 'held');
    if (empty) empty.hidden = held.length !== 0;
    held.forEach((row) => {
      const li = document.createElement('li');
      const mark = document.createElement('span');
      mark.className = 'treasury-activity-mark'; mark.textContent = '🔐';
      const body = document.createElement('div');
      const title = document.createElement('strong'); title.textContent = `${row.escrow_key} · ${formatMoney(row.amount)}`;
      const meta = document.createElement('small'); meta.textContent = `${row.purpose || 'Managed reserve'} · ${row.created_by_name || 'Admin'} · ${localTime(row.created_at)}`;
      const actions = document.createElement('div'); actions.className = 'treasury-escrow-actions';
      const release = document.createElement('button'); release.className = 'primary-action compact-action'; release.type = 'button'; release.textContent = 'Release';
      release.addEventListener('click', async () => {
        const psn = window.prompt(`Release ${row.escrow_key} (${formatMoney(row.amount)}) to which verified PlayStation ID?`, '');
        if (!psn) return;
        const note = window.prompt('Optional release note:', '') ?? '';
        try { setMessage('Releasing escrow…'); const data = await adminAction({ action: 'escrow_release', escrow_key: row.escrow_key, psn_id: psn, note }); if (data) { payload.treasury = data.treasury; render(payload); setMessage(data.message || 'Escrow released.', 'success'); } } catch (error) { setMessage(error.message || 'Escrow release failed.', 'error'); }
      });
      const refund = document.createElement('button'); refund.className = 'secondary-action compact-action'; refund.type = 'button'; refund.textContent = 'Refund';
      refund.addEventListener('click', async () => {
        if (!window.confirm(`Return ${formatMoney(row.amount)} from ${row.escrow_key} to the community treasury?`)) return;
        const note = window.prompt('Optional refund note:', '') ?? '';
        try { setMessage('Refunding escrow…'); const data = await adminAction({ action: 'escrow_refund', escrow_key: row.escrow_key, note }); if (data) { payload.treasury = data.treasury; render(payload); setMessage(data.message || 'Escrow refunded.', 'success'); } } catch (error) { setMessage(error.message || 'Escrow refund failed.', 'error'); }
      });
      actions.append(release, refund); body.append(title, meta, actions); li.append(mark, body); list.append(li);
    });
  };

  const render = (data = {}) => {
    payload = data;
    const treasury = data.treasury || {};
    setText('[data-treasury-available]', formatMoney(treasury.balance));
    setText('[data-treasury-reserved]', formatMoney(treasury.reserved));
    setText('[data-treasury-managed]', formatMoney(treasury.managed_total));
    setText('[data-treasury-contributed]', formatMoney(treasury.total_contributed));
    setText('[data-treasury-granted]', formatMoney(treasury.total_granted));
    setText('[data-treasury-escrow-count]', Number(treasury.active_escrows) || 0);
    setText('[data-treasury-bank-balance]', formatMoney(data.bank_balance));
    setText('[data-treasury-minimum]', `Minimum contribution ${formatMoney(data.limits?.minimum_contribution || 1000)}`);
    setText('[data-treasury-server-name]', data.server_name || 'Selected server');
    renderActivity(treasury.transactions || []);

    const canAdmin = Boolean(data.can_administer) && ['staff', 'owner'].includes(String(dashboardAccessLevel || data.access_level || ''));
    qa('[data-treasury-admin]').forEach((node) => { node.hidden = !canAdmin; });
    renderEscrows(canAdmin ? treasury.escrows : []);
    const market = q('[data-treasury-market-note]');
    if (market) {
      const isLivonia = String(data.server_key || '').toLowerCase().includes('livonia');
      market.textContent = isLivonia
        ? 'Livonia Player Marketplace is planned for the next dedicated economy phase and will use this escrow framework.'
        : 'Player Marketplace remains intentionally disabled here; the planned marketplace is Livonia-specific.';
    }
  };

  const load = async ({ quiet = false } = {}) => {
    if (loading) return;
    const session = token();
    if (!session) { if (!quiet) setMessage('Sign in with Discord to view the community treasury.', 'error'); return; }
    loading = true;
    if (!quiet) setMessage('Loading community treasury…');
    try {
      const response = await authFetch(STATE_URL, { headers: { Accept: 'application/json', Authorization: `Bearer ${session}` } });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) { storageRemove(AUTH_SESSION_KEY); applySignedOutState(); return; }
      if (!response.ok || data.status !== 'ok') throw new Error(data.message || 'Community treasury is unavailable.');
      render(data); setMessage('');
    } catch (error) { setMessage(error.message || 'Community treasury is unavailable.', 'error'); }
    finally { loading = false; }
  };

  q('[data-treasury-contribute]')?.addEventListener('click', async () => {
    const session = token();
    const input = q('[data-treasury-amount]');
    const amount = Math.trunc(Number(input?.value) || 0);
    if (!session) { setMessage('Sign in with Discord before contributing.', 'error'); return; }
    if (amount <= 0) { setMessage('Enter a valid whole-dollar contribution.', 'error'); input?.focus(); return; }
    try {
      setMessage('Contributing protected savings…');
      const response = await authFetch(ACTION_URL, {
        method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${session}` }, body: JSON.stringify({ action: 'contribute', amount })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.status !== 'ok') throw new Error(data.message || 'Treasury contribution failed.');
      if (input) input.value = '';
      await load({ quiet: true });
      setMessage(data.message || 'Contribution recorded.', 'success');
      if (typeof loadAccountSummary === 'function') void loadAccountSummary(session);
    } catch (error) { setMessage(error.message || 'Treasury contribution failed.', 'error'); }
  });

  q('[data-treasury-admin-adjust]')?.addEventListener('click', async () => {
    const raw = window.prompt('Treasury adjustment. Positive adds funds; negative removes funds:', '0'); if (raw === null) return;
    const amount = Number.parseInt(raw, 10); if (!Number.isFinite(amount) || amount === 0) { setMessage('Enter a non-zero whole-dollar amount.', 'error'); return; }
    const note = window.prompt('Required audited reason:', '') ?? '';
    try { setMessage('Applying treasury adjustment…'); const data = await adminAction({ action: 'adjust', amount, note }); if (data) { payload.treasury = data.treasury; render(payload); setMessage('Treasury adjusted.', 'success'); } } catch (error) { setMessage(error.message || 'Treasury adjustment failed.', 'error'); }
  });

  q('[data-treasury-admin-grant]')?.addEventListener('click', async () => {
    const psn = window.prompt('Verified PlayStation ID receiving the treasury grant:', ''); if (!psn) return;
    const raw = window.prompt('Grant amount:', '1000'); if (raw === null) return;
    const amount = Number.parseInt(raw, 10); const note = window.prompt('Required audited reason:', '') ?? '';
    try { setMessage('Issuing treasury grant…'); const data = await adminAction({ action: 'grant', psn_id: psn, amount, note }); if (data) { payload.treasury = data.treasury; render(payload); setMessage('Treasury grant issued.', 'success'); } } catch (error) { setMessage(error.message || 'Treasury grant failed.', 'error'); }
  });

  q('[data-treasury-admin-hold]')?.addEventListener('click', async () => {
    const raw = window.prompt('Amount to reserve in escrow:', '1000'); if (raw === null) return;
    const amount = Number.parseInt(raw, 10); const purpose = window.prompt('Required escrow purpose:', '') ?? '';
    try { setMessage('Reserving treasury funds…'); const data = await adminAction({ action: 'escrow_hold', amount, purpose }); if (data) { payload.treasury = data.treasury; render(payload); setMessage(`Escrow ${data.result?.escrow_key || ''} created.`, 'success'); } } catch (error) { setMessage(error.message || 'Escrow reservation failed.', 'error'); }
  });

  window.addEventListener('wwz:viewchange', (event) => {
    if (event.detail?.view === 'economy' && event.detail?.section === 'treasury') load({ quiet: true });
  });
  window.addEventListener('wwz:serverchange', () => { payload = null; if (location.hash.includes('economy/treasury')) load({ quiet: true }); });
  window.addEventListener('wwz:authchange', () => { payload = null; if (token()) load({ quiet: true }); });
  window.addEventListener('wwz:accesschange', () => { if (payload) render(payload); });
})();
