(() => {
  const STORAGE_KEY = 'wwz_dashboard_server';
  const gateway = document.querySelector('[data-dashboard-gateway]');
  const loadingView = document.querySelector('[data-gateway-loading-view]');
  const loadingCopy = document.querySelector('[data-gateway-loading-copy]');
  const loginView = document.querySelector('[data-gateway-login-view]');
  const serverView = document.querySelector('[data-gateway-server-view]');
  const serverGrid = document.querySelector('[data-server-selection-grid]');
  const gatewayNotice = document.querySelector('[data-gateway-notice]');
  const selectionNotice = document.querySelector('[data-server-selection-notice]');
  const changeServerButton = document.querySelector('[data-change-server]');
  const gatewaySignOutButton = document.querySelector('[data-gateway-sign-out]');
  let availableServers = [];
  let selectedServer = null;
  let publicServer = null;
  let restoreWatchdog = null;
  const RESTORE_WATCHDOG_MS = 18_000;
  const SERVER_KEY_PATTERN = /^[a-z0-9][a-z0-9-]{1,62}$/;

  const readStoredServer = () => {
    try {
      const value = sessionStorage.getItem(STORAGE_KEY);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      return null;
    }
  };

  const storeServer = (server) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(server));
      return true;
    } catch (error) {
      return false;
    }
  };

  const clearStoredServer = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // The in-memory selection is still cleared when storage is unavailable.
    }
  };

  const normalizeServer = (value) => {
    const mapKey = String(value?.map_key || '').trim().toLowerCase();
    const key = String(value?.key || '').trim().toLowerCase();
    if (!SERVER_KEY_PATTERN.test(key) || !['chernarus', 'livonia'].includes(mapKey)) return null;
    const mapName = mapKey === 'livonia' ? 'Livonia' : 'Chernarus';
    return {
      key,
      name: String(value.name || value.discord_name || 'World War Z'),
      discord_name: String(value.discord_name || value.name || 'World War Z'),
      icon_url: value.icon_url ? String(value.icon_url) : null,
      map_key: mapKey,
      map_name: String(value.map_name || mapName),
      world_size: mapKey === 'livonia' ? 12800 : 15360,
      platform: String(value.platform || 'PlayStation 4 & 5'),
      access_level: String(value.access_level || 'member'),
      available: value.available !== false
    };
  };

  const setNotice = (element, message, tone = 'info') => {
    if (!element) return;
    element.textContent = message;
    element.dataset.tone = tone;
  };

  const setGatewayView = (view) => {
    if (view !== 'loading' && restoreWatchdog !== null) {
      window.clearTimeout(restoreWatchdog);
      restoreWatchdog = null;
    }
    if (loadingView) loadingView.hidden = view !== 'loading';
    if (loginView) loginView.hidden = view !== 'login';
    if (serverView) serverView.hidden = view !== 'servers';
    document.body.classList.toggle('dashboard-ready', view === 'dashboard');
    document.body.classList.toggle('dashboard-gated', view !== 'dashboard');
    if (gateway) gateway.setAttribute('aria-hidden', String(view === 'dashboard'));
  };

  const showLoading = (message = 'Restoring your secure dashboard session…') => {
    if (loadingCopy) loadingCopy.textContent = message;
    setGatewayView('loading');
    if (restoreWatchdog !== null) window.clearTimeout(restoreWatchdog);
    restoreWatchdog = window.setTimeout(() => {
      restoreWatchdog = null;
      if (loadingView?.hidden !== false) return;
      setNotice(
        gatewayNotice,
        'Session verification took too long. The dashboard was released from the loading screen; retry Discord sign-in when the connection is ready.',
        'error'
      );
      setGatewayView('login');
      window.dispatchEvent(new CustomEvent('wwz:gatewaytimeout'));
    }, RESTORE_WATCHDOG_MS);
  };

  const updateDashboardLabels = (server) => {
    document.querySelectorAll('[data-selected-server-name]').forEach((element) => {
      element.textContent = server.name;
    });
    document.querySelectorAll('[data-selected-server-detail]').forEach((element) => {
      element.textContent = `${server.platform.replace(' 4 & 5', '')} · ${server.map_name}`;
    });
    document.querySelectorAll('[data-server-map], [data-detail-map]').forEach((element) => {
      element.textContent = server.map_name;
    });
    document.querySelectorAll('[data-map-name]').forEach((element) => {
      element.textContent = `${server.map_name.toUpperCase()} LIVE`;
    });
    document.querySelectorAll('[data-map-source-title]').forEach((element) => {
      element.textContent = `${server.map_name} and DayZ imagery © Bohemia Interactive`;
    });
    document.querySelectorAll('[data-location-map-copy]').forEach((element) => {
      element.textContent = `Save real ${server.map_name} X, Y, Z and rotation values under names you can reuse for future trader and event-item orders.`;
    });
    const mapPreview = document.querySelector('.map-live-preview img');
    if (mapPreview) {
      mapPreview.src = server.map_key === 'livonia'
        ? 'assets/maps/livonia/tiles/0/0/0.webp?v=1.22.87'
        : 'assets/maps/chernarus/tiles/z0/0/0.webp?v=1.22.87';
      mapPreview.alt = `${server.map_name} satellite map preview`;
    }
    document.querySelectorAll('[data-map-frame], [data-location-map], [data-shop-coordinate-map]').forEach((element) => {
      element.setAttribute('aria-label', `${server.map_name} coordinate map. Drag to pan, scroll or pinch to zoom, and click to select X and Z.`);
    });
    document.querySelectorAll('[data-map-custom-x], [data-map-custom-z], [data-location-x], [data-location-z], [data-shop-delivery-x], [data-shop-delivery-z]').forEach((input) => {
      input.max = String(server.world_size);
    });
    const mapNavigation = document.querySelector('[data-view="map"][data-section="explorer"]');
    if (mapNavigation) mapNavigation.dataset.navLabel = `${server.map_name} Map`;
    changeServerButton?.removeAttribute('hidden');
  };

  const selectServer = (server, { restored = false } = {}) => {
    const normalized = normalizeServer(server);
    if (!normalized || !normalized.available) return false;
    const previousKey = selectedServer?.key || null;
    selectedServer = normalized;
    storeServer(normalized);
    if (previousKey !== normalized.key && !restored) {
      showLoading(`Switching securely to ${normalized.name}…`);
      location.reload();
      return true;
    }
    updateDashboardLabels(normalized);
    setGatewayView('dashboard');
    window.dispatchEvent(new CustomEvent('wwz:serverchange', {
      detail: { server: normalized, restored }
    }));
    return true;
  };

  const serverInitials = (server) => server.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'WZ';

  const renderServerCard = (server) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'wwz-server-card';
    card.disabled = !server.available;
    card.setAttribute('aria-label', `Open ${server.name} on ${server.map_name}`);

    const heading = document.createElement('div');
    heading.className = 'wwz-server-card-heading';
    const icon = document.createElement('span');
    icon.className = 'wwz-server-icon';
    const iconImage = document.createElement('img');
    iconImage.src = server.icon_url || 'assets/world-war-z-logo.webp?v=1.22.87';
    iconImage.alt = '';
    icon.append(iconImage);
    const headingCopy = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = server.name;
    const discord = document.createElement('small');
    discord.textContent = `Discord · ${serverInitials(server)}`;
    headingCopy.append(name, discord);
    heading.append(icon, headingCopy);

    const body = document.createElement('div');
    body.className = 'wwz-server-card-body';
    [
      ['DayZ world', server.map_name],
      ['Platform', server.platform],
      ['Your access', server.access_level.replace(/^./, (letter) => letter.toUpperCase())]
    ].forEach(([label, value]) => {
      const row = document.createElement('div');
      row.className = 'wwz-server-meta';
      const rowLabel = document.createElement('span');
      rowLabel.textContent = label;
      const rowValue = document.createElement('strong');
      rowValue.textContent = value;
      row.append(rowLabel, rowValue);
      body.append(row);
    });

    const footer = document.createElement('div');
    footer.className = 'wwz-server-card-footer';
    const state = document.createElement('span');
    state.className = 'wwz-server-live';
    state.textContent = server.available ? '● Available' : 'Unavailable';
    const enter = document.createElement('span');
    enter.className = 'wwz-server-enter';
    enter.textContent = 'Select server →';
    footer.append(state, enter);
    card.append(heading, body, footer);
    card.addEventListener('click', () => selectServer(server));
    return card;
  };

  const showServerSelection = (servers = availableServers) => {
    availableServers = servers.map(normalizeServer).filter(Boolean);
    serverGrid?.replaceChildren(...availableServers.map(renderServerCard));
    setNotice(
      selectionNotice,
      availableServers.length
        ? 'Your selected server controls the map across the dashboard, rentals and saved locations.'
        : 'No eligible World War Z Discord servers are available for this account.',
      availableServers.length ? 'info' : 'error'
    );
    setGatewayView('servers');
  };

  const handleAuthenticated = (payload, { requireSelection = false } = {}) => {
    availableServers = Array.isArray(payload?.servers)
      ? payload.servers.map(normalizeServer).filter(Boolean)
      : [];
    const stored = normalizeServer(readStoredServer());
    const restored = stored
      ? availableServers.find((server) => server.key === stored.key && server.map_key === stored.map_key)
      : null;
    if (!requireSelection && restored) {
      selectServer(restored, { restored: true });
      return;
    }
    showServerSelection(availableServers);
  };

  const showLogin = ({ unavailable = false } = {}) => {
    selectedServer = null;
    changeServerButton?.setAttribute('hidden', '');
    setNotice(
      gatewayNotice,
      unavailable
        ? 'Discord verification is temporarily unavailable. Please try again shortly.'
        : 'Discord securely verifies your World War Z membership and access level.',
      unavailable ? 'error' : 'info'
    );
    setGatewayView('login');
  };

  const clearSelection = () => {
    selectedServer = null;
    availableServers = [];
    clearStoredServer();
    showLogin();
  };

  const updatePublicStatus = (payload) => {
    const server = payload?.server || {};
    publicServer = normalizeServer({
      ...server,
      key: server.key || 'world-war-z',
      map_key: server.map_key || String(server.map || '').toLowerCase(),
      map_name: server.map,
      available: true
    });
  };

  changeServerButton?.addEventListener('click', () => showServerSelection());
  gatewaySignOutButton?.addEventListener('click', () => {
    const dashboardSignOut = document.querySelector('[data-sign-out]');
    if (dashboardSignOut instanceof HTMLButtonElement) dashboardSignOut.click();
    else clearSelection();
  });

  window.WWZServerContext = Object.freeze({
    clearSelection,
    getMapKey: () => selectedServer?.map_key || null,
    getSelectedServer: () => selectedServer,
    getWorldSize: () => selectedServer?.world_size || null,
    handleAuthenticated,
    selectServer,
    showLoading,
    showLogin,
    showServerSelection,
    updatePublicStatus
  });

  showLoading();
})();
