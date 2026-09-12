(() => {
  'use strict';

  const CONFIG_URL = `${DASHBOARD_API_BASE}/api/admin/economy-panels`;
  const ACTION_URL = `${DASHBOARD_API_BASE}/api/admin/economy-panels/action`;
  const root = document.querySelector('[data-economy-panels]');
  if (!root) return;

  const host = root.querySelector('[data-economy-panel-list]');
  const summary = root.querySelector('[data-economy-panels-summary]');
  const serverLabel = root.querySelector('[data-economy-panels-server]');
  const message = root.querySelector('[data-economy-panels-message]');
  const error = root.querySelector('[data-economy-panels-error]');
  const reloadButton = root.querySelector('[data-economy-panels-refresh]');
  const autoButton = root.querySelector('[data-economy-panels-autosetup]');
  const saveButton = root.querySelector('[data-economy-panels-save]');
  const publishAllButton = root.querySelector('[data-economy-panels-publish-all]');
  const refreshAllButton = root.querySelector('[data-economy-panels-refresh-all]');
  const unpublishAllButton = root.querySelector('[data-economy-panels-unpublish-all]');

  let state = { panels: [], channels: [], server: {} };
  let busy = false;

  const showMessage = (text = '', tone = 'error') => {
    if (!message) return;
    message.hidden = !text;
    message.textContent = text;
    message.dataset.tone = tone;
  };

  const channelOptionLabel = (channel) => `${channel.category ? `${channel.category} / ` : ''}#${channel.name}${channel.can_publish ? '' : ' · missing permissions'}`;

  const cardDescription = (key) => ({
    shop: 'Current shop guidance with direct General Shop, Vehicle/Event Shop and My Orders links.',
    item_prices: 'Live standard-item prices generated from the current server catalogue.',
    vehicle_prices: 'Live restart-bound vehicle/Event Item prices and configured restart ranges.',
    weed_operations: 'Server-scoped editable weed-operation and licence guidance.',
    pelt_info: 'Server-scoped editable Trader pelt drop-off instructions and payout list.',
    earn_income: 'Live daily/work/nightlife/crime/rob/pay values generated from the deployed economy configuration.',
    gamble: 'Current wager limits and gambling commands generated from the deployed economy configuration.',
    bot_commands: 'Compact Discord command gateway that points members to /help and the Command Centre.'
  }[key] || 'Managed World War Z information panel.');

  const collect = () => [...host.querySelectorAll('[data-economy-panel-card]')].map((card) => ({
    panel_key: card.dataset.panelKey,
    enabled: Boolean(card.querySelector('[data-panel-enabled]')?.checked),
    channel_key: card.querySelector('[data-panel-channel]')?.value || '',
    custom_text: card.querySelector('[data-panel-custom]')?.value || ''
  }));

  const panelState = (panel) => {
    if (!panel.enabled) return ['Disabled', 'muted'];
    if (!panel.channel_key) return ['Channel not set', 'warning'];
    if (Array.isArray(panel.permission_missing) && panel.permission_missing.length) return ['Permission issue', 'warning'];
    if (panel.published) return [`Published · ${panel.message_count || 1} msg`, 'published'];
    return ['Ready to publish', 'ready'];
  };

  const renderSummary = () => {
    const panels = state.panels || [];
    const enabled = panels.filter((panel) => panel.enabled).length;
    const routed = panels.filter((panel) => panel.channel_key).length;
    const published = panels.filter((panel) => panel.published).length;
    const warnings = panels.filter((panel) => Array.isArray(panel.permission_missing) && panel.permission_missing.length).length;
    summary.innerHTML = `
      <div><span>Enabled</span><strong>${enabled}</strong></div>
      <div><span>Channels Assigned</span><strong>${routed}</strong></div>
      <div><span>Published</span><strong>${published}</strong></div>
      <div><span>Permission Warnings</span><strong>${warnings}</strong></div>`;
  };

  const render = () => {
    serverLabel.textContent = state.server?.map_name || state.server?.name || 'Selected server';
    host.replaceChildren();
    const channels = Array.isArray(state.channels) ? state.channels : [];
    (state.panels || []).forEach((panel) => {
      const card = document.createElement('article');
      card.className = 'economy-panel-card';
      card.dataset.economyPanelCard = '';
      card.dataset.panelKey = panel.panel_key;
      const [stateText, stateTone] = panelState(panel);
      const head = document.createElement('div');
      head.className = 'economy-panel-card-head';
      head.innerHTML = `
        <label class="economy-panel-card-title"><input type="checkbox" data-panel-enabled ${panel.enabled ? 'checked' : ''}/><span><strong>${panel.label}</strong><small>${cardDescription(panel.panel_key)}</small></span></label>
        <span class="economy-panel-state" data-state="${stateTone}">${stateText}</span>`;
      card.append(head);

      const body = document.createElement('div');
      body.className = 'economy-panel-card-body';
      const field = document.createElement('label');
      field.className = 'dialog-field';
      field.innerHTML = '<span>Discord channel</span>';
      const select = document.createElement('select');
      select.dataset.panelChannel = '';
      select.append(new Option('Not configured', ''));
      channels.forEach((channel) => select.append(new Option(channelOptionLabel(channel), channel.key)));
      select.value = panel.channel_key || '';
      field.append(select);
      body.append(field);

      const actions = document.createElement('div');
      actions.className = 'economy-panel-actions';
      [['Publish','publish','primary-action compact-action'],['Refresh','refresh','secondary-action compact-action'],['Remove','unpublish','secondary-action compact-action danger-outline']].forEach(([label, actionName, className]) => {
        const button = document.createElement('button');
        button.type = 'button'; button.className = className; button.textContent = label;
        button.addEventListener('click', async () => {
          if (actionName === 'unpublish') {
            await action(actionName, button, panel.panel_key);
            return;
          }
          if (await action('save', button)) await action(actionName, button, panel.panel_key);
        });
        actions.append(button);
      });
      body.append(actions);

      if (['pelt_info', 'weed_operations'].includes(panel.panel_key)) {
        const custom = document.createElement('label');
        custom.className = 'dialog-field economy-panel-custom';
        custom.innerHTML = `<span>Published guidance <small>Server-scoped · Markdown supported</small></span><textarea data-panel-custom maxlength="8000" rows="8"></textarea>`;
        custom.querySelector('textarea').value = panel.custom_text || '';
        body.append(custom);
      }
      if (Array.isArray(panel.permission_missing) && panel.permission_missing.length) {
        const warning = document.createElement('div');
        warning.className = 'economy-panel-permission-warning';
        warning.textContent = `Bot permission warning: ${panel.permission_missing.join(', ')}`;
        body.append(warning);
      }
      card.append(body);
      host.append(card);
    });
    renderSummary();
  };

  const load = async () => {
    const token = storageGet(AUTH_SESSION_KEY);
    if (!token || !['staff', 'owner'].includes(dashboardAccessLevel)) return;
    error.hidden = true; showMessage('');
    try {
      const response = await authFetch(CONFIG_URL, { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } });
      const payload = await response.json().catch(() => ({}));
      if (handleAdminPlayerAuthorizationResponse(response, payload)) return;
      if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Economy Panels could not be loaded.');
      state = payload; render();
    } catch (problem) {
      error.hidden = false;
      error.textContent = problem instanceof Error ? problem.message : 'Economy Panels are temporarily unavailable.';
    }
  };

  const action = async (name, button, panelKey = '') => {
    const token = storageGet(AUTH_SESSION_KEY);
    if (!token || busy) return false;
    busy = true; button?.setAttribute('disabled', ''); showMessage('');
    try {
      const body = { action: name };
      if (name === 'save') body.panels = collect();
      if (panelKey) body.panel_key = panelKey;
      const response = await authFetch(ACTION_URL, {
        method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const payload = await response.json().catch(() => ({}));
      if (handleAdminPlayerAuthorizationResponse(response, payload, { actionRequest: true })) return false;
      if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Economy Panels action failed.');
      const success = payload.message || 'Economy Panels updated.';
      busy = false;
      await load();
      showMessage(success, 'success');
      return true;
    } catch (problem) {
      showMessage(problem instanceof Error ? problem.message : 'Economy Panels action failed.', 'error');
      return false;
    } finally {
      busy = false; button?.removeAttribute('disabled');
    }
  };

  reloadButton?.addEventListener('click', load);
  saveButton?.addEventListener('click', () => action('save', saveButton));
  autoButton?.addEventListener('click', () => {
    if (!window.confirm('Reuse matching Economy channels and create any missing channels for enabled panels?')) return;
    action('autosetup', autoButton);
  });
  publishAllButton?.addEventListener('click', async () => {
    if (!window.confirm('Publish every enabled Economy panel with a configured Discord channel? WWZ replaces only its own previous copies.')) return;
    if (await action('save', publishAllButton)) action('publish', publishAllButton);
  });
  refreshAllButton?.addEventListener('click', async () => {
    if (await action('save', refreshAllButton)) action('refresh', refreshAllButton);
  });
  unpublishAllButton?.addEventListener('click', () => {
    if (!window.confirm('Remove every Economy message currently managed by WWZ on this selected server? Routing and saved text are kept.')) return;
    action('unpublish', unpublishAllButton);
  });

  window.addEventListener('wwz:viewchange', (event) => {
    if (event.detail?.view === 'staff' && event.detail?.section === 'economy-panels') load();
  });
  window.addEventListener('wwz:serverchange', () => {
    if (location.hash.includes('staff/economy-panels')) load();
  });

  window.WWZEconomyPanels = { activate: load };
  window.__wwzEconomyPanelsReady = true;
})();
