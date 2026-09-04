(() => {
  'use strict';

  const root = document.querySelector('[data-dashboard-section="data-management"]');
  if (!root) {
    window.__wwzDataManagementReady = true;
    return;
  }

  const CENTRE_URL = `${DASHBOARD_API_BASE}/api/owner/data/centre`;
  const ACTION_URL = `${DASHBOARD_API_BASE}/api/owner/data/action`;
  const DOWNLOAD_URL = (id) => `${DASHBOARD_API_BASE}/api/owner/data/artifact/${Number(id)}/download`;
  const BACKUP_CONFIRMATION = 'BACKUP ALL SERVERS';
  const select = (query) => root.querySelector(query);
  const message = select('[data-data-message]');
  const refreshButton = select('[data-data-refresh]');
  const backupList = select('[data-data-backup-list]');
  const exportList = select('[data-data-export-list]');
  const actionList = select('[data-data-action-list]');
  const exportKey = select('[data-data-export-key]');
  let payload = null;
  let busy = false;

  const token = () => { try { return storageGet(AUTH_SESSION_KEY) || ''; } catch { return ''; } };
  const friendlyBytes = (value) => {
    const bytes = Math.max(0, Number(value) || 0);
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB', 'TB'];
    let number = bytes / 1024;
    let unit = units[0];
    for (let index = 1; index < units.length && number >= 1024; index += 1) {
      number /= 1024; unit = units[index];
    }
    return `${number >= 10 ? number.toFixed(1) : number.toFixed(2)} ${unit}`;
  };
  const timeLabel = (value) => {
    if (!value) return '—';
    try { return typeof formatUpdatedAt === 'function' ? formatUpdatedAt(value) : new Date(value).toLocaleString(); }
    catch { return String(value); }
  };
  const set = (query, value) => { const element = select(query); if (element) element.textContent = String(value ?? '—'); };
  const showMessage = (text, state = 'info') => {
    if (!message) return;
    message.hidden = !text;
    message.dataset.state = state;
    message.textContent = String(text || '');
  };
  const setBusy = (value, label = '') => {
    busy = Boolean(value);
    root.querySelectorAll('button').forEach((button) => { if (busy) button.setAttribute('disabled', ''); else button.removeAttribute('disabled'); });
    if (refreshButton) refreshButton.setAttribute('aria-busy', String(busy));
    if (label) showMessage(label, 'info');
  };

  const authJson = async (url, options = {}, timeout = 60_000) => {
    const session = token();
    if (!session) throw new Error('Owner sign-in is required.');
    const response = await window.WWZHttp.request(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${session}`,
        ...(options.headers || {})
      }
    }, timeout);
    const body = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) {
      storageRemove(AUTH_SESSION_KEY);
      applySignedOutState?.();
      throw new Error(body.message || 'Owner access is required.');
    }
    if (!response.ok) throw new Error(body.message || 'The data-management request failed.');
    return body;
  };

  const action = (body, label) => authJson(ACTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }, 120_000).then(async (result) => {
    showMessage(result.message || label || 'Data operation completed.', 'success');
    await load(true, true);
    return result;
  });

  const button = (label, handler, className = 'secondary-action compact-action') => {
    const element = document.createElement('button');
    element.type = 'button';
    element.className = className;
    element.textContent = label;
    element.addEventListener('click', handler);
    return element;
  };

  const download = async (artifact) => {
    if (!artifact?.id || busy) return;
    setBusy(true, `Preparing ${artifact.filename || 'download'}…`);
    try {
      const response = await window.WWZHttp.request(DOWNLOAD_URL(artifact.id), {
        method: 'GET',
        headers: { Authorization: `Bearer ${token()}` }
      }, 120_000);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'The artifact could not be downloaded.');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = artifact.filename || `wwz-data-${artifact.id}`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      showMessage(`Downloaded ${artifact.filename}.`, 'success');
    } catch (error) {
      showMessage(error.message || 'Download failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const renderHealth = (data) => {
    const health = data?.health || {};
    set('[data-data-integrity]', String(health.integrity || 'unknown').toUpperCase());
    set('[data-data-quick-check]', `Quick check: ${health.quick_check || 'unknown'}`);
    set('[data-data-db-size]', friendlyBytes(health.size_bytes));
    set('[data-data-wal-size]', `WAL ${friendlyBytes(health.wal_size_bytes)}`);
    set('[data-data-server-rows]', Number(health.selected_server_rows || 0).toLocaleString());
    set('[data-data-table-count]', `${Number(health.guild_scoped_table_count || 0)} server-scoped tables · ${Number(health.table_count || 0)} total`);
    set('[data-data-storage-free]', friendlyBytes(health.storage?.free_bytes));
    set('[data-data-storage-total]', `${friendlyBytes(health.storage?.total_bytes)} total persistent storage`);
    const integrityCard = select('[data-data-integrity]')?.closest('article');
    if (integrityCard) integrityCard.dataset.state = health.integrity === 'healthy' ? 'healthy' : 'attention';
    set('[data-data-backup-retention]', data?.retention?.database_backups ?? '—');
    set('[data-data-export-retention]', data?.retention?.exports_days ?? '—');
    set('[data-data-restore-message]', data?.restore?.message || 'Offline restore safeguards are active.');
    const schemaMatches = Boolean(data?.restore?.latest_backup_schema_matches);
    const hasBackups = Array.isArray(data?.backups) && data.backups.length > 0;
    const schemaText = !hasBackups ? 'No backup yet' : (schemaMatches ? 'Schema matches live' : 'Schema differs from live');
    set('[data-data-schema-state]', schemaText);
    const schemaElement = select('[data-data-schema-state]');
    if (schemaElement) schemaElement.dataset.state = !hasBackups ? 'none' : (schemaMatches ? 'match' : 'mismatch');
    const restoreState = select('[data-data-restore-state]');
    if (restoreState) restoreState.textContent = data?.restore?.latest_backup_verified ? 'Verified backup ready' : 'Protected';
    set('[data-data-scope-notice]', data?.backup_scope_notice || 'Raw backups are global; logical exports are server-scoped.');
  };

  const renderExportOptions = (data) => {
    if (!exportKey) return;
    const current = exportKey.value;
    exportKey.replaceChildren();
    (Array.isArray(data?.export_options) ? data.export_options : []).forEach((option) => {
      const item = document.createElement('option');
      item.value = String(option.key || '');
      item.textContent = String(option.label || option.key || 'Data export');
      item.dataset.description = String(option.description || '');
      exportKey.append(item);
    });
    if ([...exportKey.options].some((item) => item.value === current)) exportKey.value = current;
    const selected = exportKey.selectedOptions[0];
    set('[data-data-export-description]', selected?.dataset?.description || 'Selected-server data export.');
  };

  const renderBackups = (items, liveSchemaHash) => {
    if (!backupList) return;
    backupList.replaceChildren();
    const backups = Array.isArray(items) ? items : [];
    set('[data-data-backup-count]', `${backups.length} stored`);
    const empty = select('[data-data-backup-empty]');
    if (empty) empty.hidden = backups.length !== 0;
    backups.forEach((item) => {
      const row = document.createElement('tr');
      const title = document.createElement('td');
      const strong = document.createElement('strong');
      const code = document.createElement('code');
      strong.textContent = `Backup #${item.id}`;
      code.textContent = String(item.sha256 || '').slice(0, 12);
      title.append(strong, document.createElement('br'), code);
      const created = document.createElement('td'); created.textContent = timeLabel(item.created_at);
      const size = document.createElement('td'); size.textContent = friendlyBytes(item.size_bytes);
      const integrity = document.createElement('td');
      const pill = document.createElement('span'); pill.className = 'data-integrity-pill'; pill.dataset.state = item.integrity_status; pill.textContent = item.integrity_status === 'verified' ? '✓ Verified' : '⚠ Check'; integrity.append(pill);
      const schema = document.createElement('td'); schema.textContent = item.schema_hash === liveSchemaHash ? 'Matches live' : 'Different';
      const actions = document.createElement('td'); actions.className = 'data-artifact-actions';
      actions.append(
        button('Download', () => download(item)),
        button('Verify', async () => {
          if (busy) return; setBusy(true, `Verifying ${item.filename}…`);
          try { await action({ action: 'verify_backup', artifact_id: item.id }, 'Backup verified.'); }
          catch (error) { showMessage(error.message, 'error'); }
          finally { setBusy(false); }
        }),
        button('Delete', async () => {
          if (busy || !window.confirm(`Delete stored backup #${item.id}? This cannot be undone.`)) return;
          const confirmation = window.prompt('Type DELETE to confirm removal:') || '';
          if (!confirmation) return;
          setBusy(true, `Deleting ${item.filename}…`);
          try { await action({ action: 'delete_artifact', artifact_id: item.id, confirmation }, 'Backup deleted.'); }
          catch (error) { showMessage(error.message, 'error'); }
          finally { setBusy(false); }
        }, 'danger-outline compact-action')
      );
      row.append(title, created, size, integrity, schema, actions);
      backupList.append(row);
    });
  };

  const renderExports = (items) => {
    if (!exportList) return;
    exportList.replaceChildren();
    const exports = Array.isArray(items) ? items : [];
    set('[data-data-export-count]', `${exports.length} stored`);
    const empty = select('[data-data-export-empty]');
    if (empty) empty.hidden = exports.length !== 0;
    exports.forEach((item) => {
      const row = document.createElement('tr');
      const title = document.createElement('td'); title.textContent = `Export #${item.id} · ${(item.format || '').toUpperCase()}`;
      const dataset = document.createElement('td'); dataset.textContent = item.metadata?.dataset_label || item.export_key || 'Server data';
      const rows = document.createElement('td'); rows.textContent = Number(item.row_count || 0).toLocaleString();
      const created = document.createElement('td'); created.textContent = timeLabel(item.created_at);
      const size = document.createElement('td'); size.textContent = friendlyBytes(item.size_bytes);
      const actions = document.createElement('td'); actions.className = 'data-artifact-actions';
      actions.append(
        button('Download', () => download(item)),
        button('Delete', async () => {
          if (busy || !window.confirm(`Delete generated export #${item.id}?`)) return;
          const confirmation = window.prompt('Type DELETE to confirm removal:') || '';
          if (!confirmation) return;
          setBusy(true, `Deleting ${item.filename}…`);
          try { await action({ action: 'delete_artifact', artifact_id: item.id, confirmation }, 'Export deleted.'); }
          catch (error) { showMessage(error.message, 'error'); }
          finally { setBusy(false); }
        }, 'danger-outline compact-action')
      );
      row.append(title, dataset, rows, created, size, actions);
      exportList.append(row);
    });
  };

  const renderActions = (items) => {
    if (!actionList) return;
    actionList.replaceChildren();
    const actions = Array.isArray(items) ? items : [];
    const empty = select('[data-data-action-empty]');
    if (empty) empty.hidden = actions.length !== 0;
    actions.forEach((item) => {
      const li = document.createElement('li');
      const mark = document.createElement('span'); mark.className = 'data-action-mark'; mark.dataset.state = item.success ? 'success' : 'failure'; mark.textContent = item.success ? '✓' : '!';
      const body = document.createElement('div');
      const strong = document.createElement('strong'); strong.textContent = String(item.target || item.action || 'Data action');
      const small = document.createElement('small'); small.textContent = `${String(item.action || '').replace(/_/g, ' ')} · ${item.actor_name || 'Owner'} · ${timeLabel(item.created_at)}${item.detail ? ` · ${item.detail}` : ''}`;
      body.append(strong, small); li.append(mark, body); actionList.append(li);
    });
  };

  const render = (data) => {
    payload = data;
    renderHealth(data);
    renderExportOptions(data);
    renderBackups(data?.backups, data?.health?.schema_hash);
    renderExports(data?.exports);
    renderActions(data?.actions);
    set('[data-data-updated]', `Updated ${timeLabel(data?.generated_at)}`);
  };

  async function load(quiet = false, force = false) {
    if ((busy && !force) || dashboardAccessLevel !== 'owner' || !token()) return;
    if (!quiet) setBusy(true, 'Refreshing data-management snapshot…');
    try {
      const data = await authJson(CENTRE_URL, { method: 'GET' }, 60_000);
      render(data);
      if (!quiet) showMessage('Data Management Centre refreshed.', 'success');
    } catch (error) {
      showMessage(error.message || 'Data Management Centre is unavailable.', 'error');
    } finally {
      if (!quiet) setBusy(false);
    }
  }

  refreshButton?.addEventListener('click', () => load(false));
  exportKey?.addEventListener('change', () => {
    const selected = exportKey.selectedOptions[0];
    set('[data-data-export-description]', selected?.dataset?.description || 'Selected-server data export.');
  });
  select('[data-data-create-backup]')?.addEventListener('click', async () => {
    if (busy) return;
    const reason = select('[data-data-backup-reason]')?.value || '';
    const confirmation = select('[data-data-backup-confirm]')?.value || '';
    if (confirmation.trim().toUpperCase() !== BACKUP_CONFIRMATION) {
      showMessage(`Type ${BACKUP_CONFIRMATION} to confirm this whole-database backup.`, 'error');
      select('[data-data-backup-confirm]')?.focus();
      return;
    }
    setBusy(true, 'Creating and verifying the whole Railway database backup…');
    try {
      await action({ action: 'create_backup', reason, confirmation }, 'Database backup created.');
      if (select('[data-data-backup-confirm]')) select('[data-data-backup-confirm]').value = '';
    } catch (error) { showMessage(error.message, 'error'); }
    finally { setBusy(false); }
  });
  select('[data-data-create-export]')?.addEventListener('click', async () => {
    if (busy) return;
    const reason = select('[data-data-export-reason]')?.value || '';
    const format = select('[data-data-export-format]')?.value || 'json';
    const key = exportKey?.value || 'complete';
    setBusy(true, 'Generating and verifying the selected-server export…');
    try { await action({ action: 'create_export', export_key: key, format, reason }, 'Server export created.'); }
    catch (error) { showMessage(error.message, 'error'); }
    finally { setBusy(false); }
  });

  const active = ({ view = '', section = '' } = {}) => view === 'configuration' && section === 'data-management';
  const activate = (detail = {}) => { if (active(detail)) load(false); };
  window.addEventListener('wwz:viewchange', (event) => activate(event.detail || {}));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    const [view, section] = String(location.hash || '').replace(/^#/, '').split('/', 2);
    if (active({ view, section })) load(true);
  });

  window.WWZDataManagement = Object.freeze({ activate, refresh: load });
  window.__wwzDataManagementReady = true;
})();
