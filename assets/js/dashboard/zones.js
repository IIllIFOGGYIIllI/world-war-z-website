(() => {
  'use strict';

  const state = {
    zones: [],
    channels: [],
    roles: [],
    users: [],
    eventOptions: [],
    dynamicLists: [],
    mapKey: '',
    mapName: '',
    worldSize: 0,
    serverKey: '',
    loaded: false,
    loading: false,
    activeSection: '',
    zoneMap: null,
    editorMap: null,
    onlineMap: null,
    zoneLayers: null,
    editorLayers: null,
    onlineLayers: null,
    editorShape: 'circle',
    editorZoneId: null,
    editorPoints: [],
    onlineTimer: null,
    onlineLoading: false,
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const isAdmin = () => ['staff', 'owner'].includes(String(dashboardAccessLevel || ''));
  const sessionToken = () => storageGet(AUTH_SESSION_KEY);
  const selectedServer = () => window.WWZServerContext?.getSelectedServer?.() || null;
  const selectedServerKey = () => String(selectedServer()?.key || '');
  const selectedMapKey = () => String(window.WWZServerContext?.getMapKey?.() || state.mapKey || 'chernarus');
  const safeHex = (value, fallback = '#d52b1e') => /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : fallback;
  const formatCoordinate = (value) => Number.isFinite(Number(value)) ? Number(value).toFixed(1) : '—';
  const circleRadiusUnits = (radius, mapKey = selectedMapKey()) => {
    const config = window.WWZMap?.getConfig?.(mapKey);
    if (!config) return Number(radius) || 0;
    return (Number(radius) || 0) * (config.mapUnits / config.mapMetres);
  };


  const ZONE_RULE_KEYS = [
    'ban_on_login', 'ban_on_emote', 'ban_on_dismantle', 'ban_on_build', 'ban_on_place',
    'ban_on_fold', 'ban_on_mount', 'ban_on_unmount', 'ban_on_bury', 'ban_on_unbury',
    'ban_on_pack', 'ban_on_repair', 'ban_on_flag_lower', 'ban_on_flag_raise', 'ban_on_kill',
    'ban_on_npc_kill', 'ban_on_kill_ignore_bounty_kills', 'ban_on_hit', 'ban_on_bear_death',
    'ban_on_wolf_death', 'ban_on_explosion_death', 'ban_on_trap_death', 'ban_on_vehicle_death',
    'ban_on_explosion_suicide_death', 'ban_on_zombie_death', 'ban_on_bleed_out_death',
    'ban_on_fall_death', 'ban_on_suicide_death', 'ban_on_barbed_wire_death', 'ban_on_fire_death',
    'ban_on_respawn_death', 'ban_on_pvp_respawn_death', 'ban_on_unknown_death',
    'ban_on_detection_outside', 'ban_on_detection', 'kill_zone', 'kill_zone_ignore_bounty_kills', 'hit_zone',
  ];

  const setRuleValues = (zone = {}) => {
    ZONE_RULE_KEYS.forEach((key) => {
      const input = $(`[data-zone-rule="${key}"]`);
      if (input) input.checked = Boolean(zone[key]);
    });
  };

  const rulePayload = () => Object.fromEntries(ZONE_RULE_KEYS.map((key) => [
    key,
    Boolean($(`[data-zone-rule="${key}"]`)?.checked),
  ]));

  const message = (text = '', kind = 'info') => {
    const element = $('[data-zone-message]');
    if (!element) return;
    element.hidden = !text;
    element.textContent = text;
    element.dataset.kind = kind;
  };

  const onlineMessage = (text = '', kind = 'info') => {
    const element = $('[data-zone-online-message]');
    if (!element) return;
    element.hidden = !text;
    element.textContent = text;
    element.dataset.kind = kind;
  };

  const editorMessage = (text = '', kind = 'info') => {
    const element = $('[data-zone-editor-message]');
    if (!element) return;
    element.hidden = !text;
    element.textContent = text;
    element.dataset.kind = kind;
  };

  const authenticatedJson = async (url, options = {}, timeout = 15_000) => {
    const token = sessionToken();
    if (!token) throw new Error('Your dashboard session has expired. Sign in again.');
    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');
    headers.set('Authorization', `Bearer ${token}`);
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    const { response, payload } = await window.WWZHttp.json(url, { ...options, headers }, timeout);
    if (response.status === 401 || response.status === 403) {
      throw new Error(response.status === 403
        ? 'Your current Discord account does not have Admin access to Zones.'
        : 'Your dashboard session has expired. Sign in again.');
    }
    if (!response.ok || !['ok', 'accepted'].includes(String(payload?.status || ''))) {
      throw new Error(payload?.message || `Zone request failed with HTTP ${response.status}.`);
    }
    return payload;
  };

  const clearLayerGroup = (name) => {
    const group = state[name];
    if (group?.clearLayers) group.clearLayers();
  };

  const destroyMap = (name) => {
    const mapInstance = state[name];
    if (mapInstance?.destroy) mapInstance.destroy();
    state[name] = null;
    const groupName = `${name.replace(/Map$/, '')}Layers`;
    state[groupName] = null;
  };

  const destroyAllMaps = () => {
    ['zoneMap', 'editorMap', 'onlineMap'].forEach(destroyMap);
  };

  const makeControls = (root) => ({
    zoomInButton: $('[data-zone-map-zoom-in]', root),
    zoomOutButton: $('[data-zone-map-zoom-out]', root),
    resetButton: $('[data-zone-map-reset]', root),
    gridToggle: $('[data-zone-map-grid]', root),
  });

  const createMap = (container, options = {}) => {
    if (!container || !window.WWZMap?.create) return null;
    const controls = makeControls(container);
    const instance = window.WWZMap.create(container, {
      mapKey: options.mapKey || selectedMapKey(),
      mode: options.mode || 'zones',
      selectable: options.selectable !== false,
      roadsVisible: true,
      trailsVisible: true,
      gridVisible: false,
      loadRoads: true,
      ...controls,
      onSelect: options.onSelect,
      emptySelectionText: 'Click or tap the map',
    });
    return instance;
  };

  const ensureZoneMap = () => {
    const container = $('[data-zone-map-frame]');
    if (!container) return null;
    if (state.zoneMap?.mapKey !== selectedMapKey()) destroyMap('zoneMap');
    if (!state.zoneMap) {
      state.zoneMap = createMap(container, { mode: 'zone-overview', selectable: false });
      if (state.zoneMap) state.zoneLayers = window.L.layerGroup().addTo(state.zoneMap.map);
    }
    state.zoneMap?.invalidateSize?.();
    return state.zoneMap;
  };

  const ensureOnlineMap = () => {
    const container = $('[data-zone-online-map-frame]');
    if (!container) return null;
    if (state.onlineMap?.mapKey !== selectedMapKey()) destroyMap('onlineMap');
    if (!state.onlineMap) {
      state.onlineMap = createMap(container, { mode: 'online-players', selectable: false });
      if (state.onlineMap) state.onlineLayers = window.L.layerGroup().addTo(state.onlineMap.map);
    }
    state.onlineMap?.invalidateSize?.();
    return state.onlineMap;
  };

  const ensureEditorMap = () => {
    const container = $('[data-zone-editor-map]');
    if (!container) return null;
    if (state.editorMap?.mapKey !== selectedMapKey()) destroyMap('editorMap');
    if (!state.editorMap) {
      state.editorMap = createMap(container, {
        mode: 'zone-editor',
        selectable: true,
        onSelect: (point) => {
          if (state.editorShape === 'circle') {
            const x = $('[data-zone-center-x]');
            const z = $('[data-zone-center-z]');
            if (x) x.value = formatCoordinate(point.x);
            if (z) z.value = formatCoordinate(point.z);
          } else if (state.editorPoints.length < 64) {
            state.editorPoints.push({ x: Number(point.x.toFixed(1)), z: Number(point.z.toFixed(1)) });
          }
          renderEditorGeometry();
        },
      });
      if (state.editorMap) state.editorLayers = window.L.layerGroup().addTo(state.editorMap.map);
    }
    state.editorMap?.invalidateSize?.();
    return state.editorMap;
  };

  const overlayStyle = (zone) => ({
    color: safeHex(zone.colour),
    weight: zone.active ? 3 : 2,
    opacity: zone.active ? 0.95 : 0.55,
    fillColor: safeHex(zone.colour),
    fillOpacity: zone.active ? 0.18 : 0.08,
    dashArray: zone.active ? null : '7 6',
  });

  const addZoneOverlay = (zone, mapInstance, layerGroup, { interactive = true } = {}) => {
    if (!zone || !mapInstance || !layerGroup || !window.L) return null;
    let layer = null;
    const style = overlayStyle(zone);
    if (zone.shape === 'circle' && Number.isFinite(Number(zone.center_x)) && Number.isFinite(Number(zone.center_z))) {
      const latlng = window.WWZMap.worldToLeaflet([zone.center_x, zone.center_z], mapInstance.mapKey);
      if (latlng) layer = window.L.circle(latlng, { ...style, radius: circleRadiusUnits(zone.radius, mapInstance.mapKey), interactive });
    } else if (zone.shape === 'polygon' && Array.isArray(zone.points) && zone.points.length >= 3) {
      const points = zone.points.map((point) => window.WWZMap.worldToLeaflet([point.x, point.z], mapInstance.mapKey)).filter(Boolean);
      if (points.length >= 3) layer = window.L.polygon(points, { ...style, interactive });
    }
    if (!layer) return null;
    layer.addTo(layerGroup);
    if (interactive) {
      layer.bindTooltip(zone.name || 'Zone', { sticky: true, direction: 'top' });
      layer.on('click', () => focusZone(zone));
    }
    return layer;
  };

  const focusZone = (zone) => {
    const mapInstance = ensureZoneMap();
    if (!mapInstance || !zone) return;
    if (zone.shape === 'circle') {
      mapInstance.focus(zone.center_x, zone.center_z, 6);
    } else if (Number.isFinite(Number(zone.center_x)) && Number.isFinite(Number(zone.center_z))) {
      mapInstance.focus(zone.center_x, zone.center_z, 6);
    }
    $$('.zone-row.is-selected').forEach((row) => row.classList.remove('is-selected'));
    $(`[data-zone-row-id="${Number(zone.id)}"]`)?.classList.add('is-selected');
  };

  const renderZoneOverlays = () => {
    const mapInstance = ensureZoneMap();
    if (!mapInstance || !state.zoneLayers) return;
    state.zoneLayers.clearLayers();
    state.zones.forEach((zone) => addZoneOverlay(zone, mapInstance, state.zoneLayers));
    const count = $('[data-zone-map-count]');
    if (count) count.textContent = String(state.zones.length);
    const name = $('[data-zone-map-name]');
    if (name) name.textContent = state.mapName || window.WWZMap.getConfig(selectedMapKey()).name;
  };

  const checkboxPill = (labelText, checked, className = '') => {
    const span = document.createElement('span');
    span.className = `zone-status-pill ${className}`.trim();
    span.textContent = labelText;
    span.dataset.active = String(Boolean(checked));
    return span;
  };

  const geometryLabel = (zone) => zone.shape === 'circle'
    ? `X ${formatCoordinate(zone.center_x)} · Z ${formatCoordinate(zone.center_z)} · ${formatCoordinate(zone.radius)} m`
    : `${Number(zone.point_count || zone.points?.length || 0)} points · centre X ${formatCoordinate(zone.center_x)} · Z ${formatCoordinate(zone.center_z)}`;

  const renderZoneList = () => {
    const body = $('[data-zone-list]');
    const empty = $('[data-zone-empty]');
    const total = $('[data-zone-count]');
    if (total) total.textContent = String(state.zones.length);
    if (!body) return;
    body.replaceChildren();
    const query = String($('[data-zone-search]')?.value || '').trim().toLowerCase();
    const filter = String($('[data-zone-filter]')?.value || 'all');
    const records = state.zones.filter((zone) => {
      if (filter === 'active' && !zone.active) return false;
      if (filter === 'inactive' && zone.active) return false;
      if (filter === 'circle' && zone.shape !== 'circle') return false;
      if (filter === 'polygon' && zone.shape !== 'polygon') return false;
      if (!query) return true;
      return `${zone.name} ${zone.shape} ${geometryLabel(zone)}`.toLowerCase().includes(query);
    });
    if (empty) empty.hidden = records.length > 0;

    records.forEach((zone) => {
      const row = document.createElement('article');
      row.className = 'zone-row';
      row.dataset.zoneRowId = String(zone.id);

      const swatch = document.createElement('span');
      swatch.className = 'zone-colour-swatch';
      swatch.style.setProperty('--zone-colour', safeHex(zone.colour));
      swatch.setAttribute('aria-hidden', 'true');

      const copy = document.createElement('div');
      copy.className = 'zone-row-copy';
      const heading = document.createElement('div');
      heading.className = 'zone-row-heading';
      const name = document.createElement('strong');
      name.textContent = zone.name;
      const type = document.createElement('span');
      type.textContent = zone.shape === 'circle' ? 'Circular' : 'Polygon';
      heading.append(name, type);
      const geometry = document.createElement('small');
      geometry.textContent = geometryLabel(zone);
      const meta = document.createElement('div');
      meta.className = 'zone-row-status';
      meta.append(
        checkboxPill(zone.active ? 'Active' : 'Inactive', zone.active, 'activity'),
        checkboxPill(zone.ping_on_detection ? `Radar ${Number(zone.radar_interval_minutes || 5)}m` : 'Radar off', zone.ping_on_detection, 'activity'),
        checkboxPill(zone.alert_on_enter ? 'Entry alerts' : 'Entry off', zone.alert_on_enter),
        checkboxPill(zone.alert_on_exit ? 'Exit alerts' : 'Exit off', zone.alert_on_exit),
        checkboxPill(zone.channel_key ? 'Channel set' : 'No channel', Boolean(zone.channel_key))
      );
      copy.append(heading, geometry, meta);

      const actions = document.createElement('div');
      actions.className = 'zone-row-actions';
      const locate = document.createElement('button');
      locate.type = 'button';
      locate.className = 'secondary-action compact-action';
      locate.textContent = 'Map';
      locate.addEventListener('click', () => {
        document.querySelector('[data-view="zones"][data-section="map"]')?.click();
        window.setTimeout(() => focusZone(zone), 180);
      });
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'secondary-action compact-action';
      edit.textContent = 'Edit';
      edit.addEventListener('click', () => openEditor(zone.shape, zone));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'danger-action compact-action';
      remove.textContent = 'Delete';
      remove.addEventListener('click', () => deleteZone(zone));
      actions.append(locate, edit, remove);

      row.append(swatch, copy, actions);
      body.append(row);
    });
  };

  const fillChannelOptions = (selectedKey = '') => {
    const select = $('[data-zone-channel]');
    if (!select) return;
    select.replaceChildren();
    const none = document.createElement('option');
    none.value = '';
    none.textContent = 'No Discord alert channel';
    select.append(none);
    state.channels.forEach((channel) => {
      const option = document.createElement('option');
      option.value = channel.key;
      option.textContent = `#${channel.name}`;
      option.selected = channel.key === selectedKey;
      select.append(option);
    });
  };

  const fillRoleChecklist = (selector, selectedKeys = []) => {
    const root = $(selector);
    if (!root) return;
    root.replaceChildren();
    const selected = new Set((selectedKeys || []).map(String));
    if (!state.roles.length) {
      const empty = document.createElement('small');
      empty.textContent = 'No selectable Discord roles are currently available.';
      root.append(empty);
      return;
    }
    state.roles.forEach((role) => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = role.key;
      input.checked = selected.has(String(role.key));
      const text = document.createElement('span');
      text.textContent = role.name;
      label.append(input, text);
      root.append(label);
    });
  };

  const fillOptionChecklist = (selector, options = [], selectedKeys = [], emptyText = 'No options are available.') => {
    const root = $(selector);
    if (!root) return;
    root.replaceChildren();
    const selected = new Set((selectedKeys || []).map(String));
    if (!options.length) {
      const empty = document.createElement('small');
      empty.textContent = emptyText;
      root.append(empty);
      return;
    }
    options.forEach((item) => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = String(item.key || '');
      input.checked = selected.has(input.value);
      const text = document.createElement('span');
      text.textContent = String(item.name || item.key || 'Option');
      label.append(input, text);
      root.append(label);
    });
  };

  const selectedChecklistValues = (selector) => $$(selector).filter((input) => input.checked).map((input) => input.value);

  const normaliseDynamicList = (item = {}) => ({
    name: String(item.name || '').trim().slice(0, 80),
    mode: String(item.mode || 'ignore').toLowerCase() === 'allow' ? 'allow' : 'ignore',
    active: item.active !== false,
    entries: Array.isArray(item.entries) ? item.entries.map(String).filter(Boolean) : [],
  });

  const renderDynamicLists = () => {
    const root = $('[data-zone-dynamic-lists]');
    if (!root) return;
    root.replaceChildren();
    if (!state.dynamicLists.length) {
      const empty = document.createElement('p');
      empty.className = 'zone-dynamic-empty';
      empty.textContent = 'No dynamic lists configured.';
      root.append(empty);
      return;
    }
    state.dynamicLists.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'zone-dynamic-row';
      row.innerHTML = `
        <label class="zone-field"><span>List Name</span><input type="text" maxlength="80" data-dynamic-name="${index}"></label>
        <label class="zone-field"><span>Mode</span><select data-dynamic-mode="${index}"><option value="ignore">Ignore</option><option value="allow">Allow</option></select></label>
        <label class="zone-dynamic-active"><input type="checkbox" data-dynamic-active="${index}"><span>Active</span></label>
        <button class="danger-action compact-action" data-dynamic-remove="${index}" type="button">Remove</button>
        <label class="zone-field zone-dynamic-entries"><span>Player Names / PSNs</span><textarea maxlength="4096" data-dynamic-entries="${index}" placeholder="One per line or comma-separated"></textarea></label>`;
      const name = $('[data-dynamic-name]', row);
      const mode = $('[data-dynamic-mode]', row);
      const active = $('[data-dynamic-active]', row);
      const entries = $('[data-dynamic-entries]', row);
      name.value = item.name || '';
      mode.value = item.mode || 'ignore';
      active.checked = item.active !== false;
      entries.value = (item.entries || []).join('\n');
      name.addEventListener('input', () => { state.dynamicLists[index].name = name.value; });
      mode.addEventListener('change', () => { state.dynamicLists[index].mode = mode.value; });
      active.addEventListener('change', () => { state.dynamicLists[index].active = active.checked; });
      entries.addEventListener('input', () => {
        state.dynamicLists[index].entries = entries.value.split(/[\n,]+/).map((value) => value.trim()).filter(Boolean);
      });
      $('[data-dynamic-remove]', row)?.addEventListener('click', () => {
        state.dynamicLists.splice(index, 1);
        renderDynamicLists();
      });
      root.append(row);
    });
  };

  const setShapeFields = () => {
    const circle = state.editorShape === 'circle';
    $('[data-zone-circle-fields]')?.toggleAttribute('hidden', !circle);
    $('[data-zone-polygon-fields]')?.toggleAttribute('hidden', circle);
    $$('[data-zone-circle-fields] input').forEach((input) => { input.disabled = !circle; });
    const title = $('[data-zone-editor-title]');
    const kicker = $('[data-zone-editor-kicker]');
    if (title) title.textContent = `${state.editorZoneId ? 'Edit' : 'Create'} ${circle ? 'Circular' : 'Polygon'} Zone`;
    if (kicker) kicker.textContent = circle ? 'Circular zone' : 'Polygon zone';
  };

  const renderPolygonPointList = () => {
    const list = $('[data-zone-point-list]');
    const count = $('[data-zone-point-count]');
    if (count) count.textContent = `${state.editorPoints.length} / 64 points`;
    if (!list) return;
    list.replaceChildren();
    state.editorPoints.forEach((point, index) => {
      const item = document.createElement('li');
      const text = document.createElement('span');
      text.textContent = `#${index + 1} · X ${formatCoordinate(point.x)} · Z ${formatCoordinate(point.z)}`;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '×';
      remove.setAttribute('aria-label', `Remove polygon point ${index + 1}`);
      remove.addEventListener('click', () => {
        state.editorPoints.splice(index, 1);
        renderEditorGeometry();
      });
      item.append(text, remove);
      list.append(item);
    });
  };

  const renderEditorGeometry = () => {
    const mapInstance = ensureEditorMap();
    if (!mapInstance || !state.editorLayers) return;
    state.editorLayers.clearLayers();
    const colour = safeHex($('[data-zone-colour]')?.value || '#d52b1e');
    const active = Boolean($('[data-zone-active]')?.checked);
    const style = { color: colour, weight: 3, opacity: active ? 0.95 : 0.55, fillColor: colour, fillOpacity: active ? 0.18 : 0.08 };

    if (state.editorShape === 'circle') {
      const x = Number($('[data-zone-center-x]')?.value);
      const z = Number($('[data-zone-center-z]')?.value);
      const radius = Number($('[data-zone-radius]')?.value);
      if ([x, z, radius].every(Number.isFinite) && radius > 0) {
        const latlng = window.WWZMap.worldToLeaflet([x, z], mapInstance.mapKey);
        if (latlng) window.L.circle(latlng, { ...style, radius: circleRadiusUnits(radius, mapInstance.mapKey), interactive: false }).addTo(state.editorLayers);
        mapInstance.setSelection(x, z, { notify: false, marker: true });
      }
    } else {
      const latlngs = state.editorPoints.map((point) => window.WWZMap.worldToLeaflet([point.x, point.z], mapInstance.mapKey)).filter(Boolean);
      if (latlngs.length >= 2) window.L.polyline(latlngs, { color: colour, weight: 3, opacity: 0.95, interactive: false }).addTo(state.editorLayers);
      if (latlngs.length >= 3) window.L.polygon(latlngs, style).addTo(state.editorLayers);
      state.editorPoints.forEach((point, index) => {
        const latlng = window.WWZMap.worldToLeaflet([point.x, point.z], mapInstance.mapKey);
        if (!latlng) return;
        window.L.circleMarker(latlng, { radius: 5, color: colour, weight: 2, fillColor: '#ffffff', fillOpacity: 1, interactive: false })
          .bindTooltip(String(index + 1), { permanent: true, direction: 'center', className: 'zone-point-tooltip' })
          .addTo(state.editorLayers);
      });
    }
    renderPolygonPointList();
  };

  const resetEditor = () => {
    const form = $('[data-zone-editor-form]');
    form?.reset?.();
    state.editorZoneId = null;
    state.editorShape = 'circle';
    state.editorPoints = [];
    state.dynamicLists = [];
    if ($('[data-zone-colour]')) $('[data-zone-colour]').value = '#d52b1e';
    if ($('[data-zone-active]')) $('[data-zone-active]').checked = true;
    if ($('[data-zone-alert-enter]')) $('[data-zone-alert-enter]').checked = true;
    if ($('[data-zone-include-location]')) $('[data-zone-include-location]').checked = true;
    if ($('[data-zone-ping-on-detection]')) $('[data-zone-ping-on-detection]').checked = true;
    if ($('[data-zone-radar-interval]')) $('[data-zone-radar-interval]').value = '5';
    if ($('[data-zone-ping-payout]')) $('[data-zone-ping-payout]').value = '0';
    if ($('[data-zone-temporary-ban-minutes]')) $('[data-zone-temporary-ban-minutes]').value = '60';
    if ($('[data-zone-radius]')) $('[data-zone-radius]').value = '150';
    setRuleValues({});
    fillChannelOptions('');
    fillRoleChecklist('[data-zone-ping-roles]', []);
    fillRoleChecklist('[data-zone-allowlist-roles]', []);
    fillOptionChecklist('[data-zone-management-users]', state.users, [], 'No Discord users are currently cached.');
    fillOptionChecklist('[data-zone-ignored-events]', state.eventOptions, []);
    fillOptionChecklist('[data-zone-allowed-events]', state.eventOptions, []);
    renderDynamicLists();
    state.editorLayers?.clearLayers?.();
    state.editorMap?.clearSelection?.({ notify: false });
    editorMessage('');
  };

  const openEditor = (shape, zone = null) => {
    if (!isAdmin()) return;
    resetEditor();
    state.editorShape = shape === 'polygon' ? 'polygon' : 'circle';
    state.editorZoneId = zone ? Number(zone.id) : null;
    setShapeFields();

    if (zone) {
      $('[data-zone-name]').value = zone.name || '';
      $('[data-zone-colour]').value = safeHex(zone.colour);
      $('[data-zone-active]').checked = Boolean(zone.active);
      $('[data-zone-alert-enter]').checked = Boolean(zone.alert_on_enter);
      $('[data-zone-alert-exit]').checked = Boolean(zone.alert_on_exit);
      $('[data-zone-include-location]').checked = Boolean(zone.include_location);
      $('[data-zone-verbose]').checked = Boolean(zone.verbose_mode);
      $('[data-zone-ping-on-detection]').checked = zone.ping_on_detection !== false;
      $('[data-zone-ping-bounties]').checked = Boolean(zone.ping_bounties);
      $('[data-zone-radar-interval]').value = String(Number(zone.radar_interval_minutes || 5));
      $('[data-zone-ping-payout]').value = String(Number(zone.ping_on_detection_payout || 0));
      $('[data-zone-temporary-ban]').checked = Boolean(zone.temporary_ban);
      $('[data-zone-temporary-ban-minutes]').value = String(Number(zone.temporary_ban_minutes || 60));
      setRuleValues(zone);
      $('[data-zone-allowlist-names]').value = (zone.allowlist_names || []).join('\n');
      fillChannelOptions(zone.channel_key || '');
      fillRoleChecklist('[data-zone-ping-roles]', zone.ping_role_keys || []);
      fillRoleChecklist('[data-zone-allowlist-roles]', zone.allowlist_role_keys || []);
      fillOptionChecklist('[data-zone-management-users]', state.users, zone.allowlist_management_user_keys || [], 'No Discord users are currently cached.');
      fillOptionChecklist('[data-zone-ignored-events]', state.eventOptions, zone.ignored_events || []);
      fillOptionChecklist('[data-zone-allowed-events]', state.eventOptions, zone.allowed_events || []);
      state.dynamicLists = (zone.dynamic_lists || []).map(normaliseDynamicList);
      renderDynamicLists();
      if (state.editorShape === 'circle') {
        $('[data-zone-center-x]').value = formatCoordinate(zone.center_x);
        $('[data-zone-center-z]').value = formatCoordinate(zone.center_z);
        $('[data-zone-radius]').value = formatCoordinate(zone.radius);
      } else {
        state.editorPoints = (zone.points || []).map((point) => ({ x: Number(point.x), z: Number(point.z) }));
      }
    }

    const dialog = $('[data-zone-dialog]');
    if (typeof dialog?.showModal === 'function') dialog.showModal();
    else dialog?.setAttribute('open', '');
    window.setTimeout(() => {
      ensureEditorMap();
      renderEditorGeometry();
      if (zone && Number.isFinite(Number(zone.center_x)) && Number.isFinite(Number(zone.center_z))) {
        state.editorMap?.focus?.(zone.center_x, zone.center_z, 6);
      }
      $('[data-zone-name]')?.focus?.();
    }, 80);
  };

  const zonePayloadFromEditor = () => {
    const common = {
      action: state.editorZoneId ? 'update' : 'create',
      zone_id: state.editorZoneId || undefined,
      name: String($('[data-zone-name]')?.value || '').trim(),
      shape: state.editorShape,
      colour: safeHex($('[data-zone-colour]')?.value),
      active: Boolean($('[data-zone-active]')?.checked),
      alert_on_enter: Boolean($('[data-zone-alert-enter]')?.checked),
      alert_on_exit: Boolean($('[data-zone-alert-exit]')?.checked),
      include_location: Boolean($('[data-zone-include-location]')?.checked),
      verbose_mode: Boolean($('[data-zone-verbose]')?.checked),
      ping_on_detection: Boolean($('[data-zone-ping-on-detection]')?.checked),
      ping_bounties: Boolean($('[data-zone-ping-bounties]')?.checked),
      radar_interval_minutes: Number($('[data-zone-radar-interval]')?.value || 5),
      ping_on_detection_payout: Number($('[data-zone-ping-payout]')?.value || 0),
      temporary_ban: Boolean($('[data-zone-temporary-ban]')?.checked),
      temporary_ban_minutes: Number($('[data-zone-temporary-ban-minutes]')?.value || 60),
      channel_key: String($('[data-zone-channel]')?.value || ''),
      ping_role_keys: selectedChecklistValues('[data-zone-ping-roles] input[type="checkbox"]'),
      allowlist_role_keys: selectedChecklistValues('[data-zone-allowlist-roles] input[type="checkbox"]'),
      allowlist_management_user_keys: selectedChecklistValues('[data-zone-management-users] input[type="checkbox"]'),
      ignored_events: selectedChecklistValues('[data-zone-ignored-events] input[type="checkbox"]'),
      allowed_events: selectedChecklistValues('[data-zone-allowed-events] input[type="checkbox"]'),
      dynamic_lists: state.dynamicLists.map(normaliseDynamicList),
      allowlist_names: String($('[data-zone-allowlist-names]')?.value || ''),
      ...rulePayload(),
    };
    if (state.editorShape === 'circle') {
      common.center_x = Number($('[data-zone-center-x]')?.value);
      common.center_z = Number($('[data-zone-center-z]')?.value);
      common.radius = Number($('[data-zone-radius]')?.value);
    } else {
      common.points = state.editorPoints.map((point) => ({ x: Number(point.x.toFixed(1)), z: Number(point.z.toFixed(1)) }));
    }
    return common;
  };

  const saveZone = async (event) => {
    event.preventDefault();
    const submit = $('[data-zone-save]');
    submit?.setAttribute('disabled', '');
    editorMessage('Railway is validating the zone and your current Admin access…');
    try {
      const payload = zonePayloadFromEditor();
      if (!payload.name) throw new Error('Enter a zone name.');
      if (payload.ping_on_detection && !payload.channel_key) throw new Error('Select a Discord alert channel for Ping on Detection.');
      if (payload.shape === 'polygon' && payload.points.length < 3) throw new Error('Polygon zones need at least three map points.');
      const result = await authenticatedJson(ADMIN_ZONES_ACTION_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
      }, 30_000);
      const zone = result.zone;
      const existing = state.zones.findIndex((item) => Number(item.id) === Number(zone.id));
      if (existing >= 0) state.zones.splice(existing, 1, zone);
      else state.zones.push(zone);
      state.zones.sort((a, b) => Number(b.active) - Number(a.active) || String(a.name).localeCompare(String(b.name)));
      renderZoneList();
      renderZoneOverlays();
      $('[data-zone-dialog]')?.close?.();
      message(`${zone.name} was ${result.action === 'create' ? 'created' : 'updated'} successfully.`, 'success');
    } catch (error) {
      editorMessage(error?.message || 'The zone could not be saved.', 'error');
    } finally {
      submit?.removeAttribute('disabled');
    }
  };

  const deleteZone = async (zone) => {
    if (!zone || !window.confirm(`Delete “${zone.name}”? This removes its saved geometry and detection configuration.`)) return;
    message(`Deleting ${zone.name}…`);
    try {
      await authenticatedJson(ADMIN_ZONES_ACTION_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'delete', zone_id: Number(zone.id) }),
      }, 30_000);
      state.zones = state.zones.filter((item) => Number(item.id) !== Number(zone.id));
      renderZoneList();
      renderZoneOverlays();
      message(`${zone.name} was deleted.`, 'success');
    } catch (error) {
      message(error?.message || 'The zone could not be deleted.', 'error');
    }
  };

  const loadZones = async ({ force = false } = {}) => {
    if (!isAdmin() || state.loading) return;
    const currentServer = selectedServerKey();
    if (!force && state.loaded && state.serverKey === currentServer) return;
    state.loading = true;
    message('Loading saved zones and Discord resources…');
    try {
      const payload = await authenticatedJson(`${ADMIN_ZONES_URL}?t=${Date.now()}`);
      state.zones = Array.isArray(payload.zones) ? payload.zones : [];
      state.channels = Array.isArray(payload.channels) ? payload.channels : [];
      state.roles = Array.isArray(payload.roles) ? payload.roles : [];
      state.users = Array.isArray(payload.users) ? payload.users : [];
      state.eventOptions = Array.isArray(payload.event_options) ? payload.event_options : [];
      state.mapKey = String(payload.map_key || selectedMapKey());
      state.mapName = String(payload.map_name || window.WWZMap?.getConfig?.(state.mapKey)?.name || 'DayZ');
      state.worldSize = Number(payload.world_size) || window.WWZMap?.getConfig?.(state.mapKey)?.mapMetres || 0;
      state.serverKey = currentServer;
      state.loaded = true;
      fillChannelOptions('');
      fillRoleChecklist('[data-zone-ping-roles]', []);
      fillRoleChecklist('[data-zone-allowlist-roles]', []);
      fillOptionChecklist('[data-zone-management-users]', state.users, [], 'No Discord users are currently cached.');
      fillOptionChecklist('[data-zone-ignored-events]', state.eventOptions, []);
      fillOptionChecklist('[data-zone-allowed-events]', state.eventOptions, []);
      renderZoneList();
      if (state.activeSection === 'map') renderZoneOverlays();
      const mapLabels = $$('[data-zone-world-name]');
      mapLabels.forEach((element) => { element.textContent = state.mapName; });
      const radarWithoutChannel = state.zones.filter((zone) => zone.ping_on_detection && !zone.channel_key).length;
      if (radarWithoutChannel) {
        message(`${radarWithoutChannel} radar zone${radarWithoutChannel === 1 ? '' : 's'} need a Discord alert channel before detection pings can be delivered.`, 'warning');
      } else {
        message('');
      }
    } catch (error) {
      message(error?.message || 'Zones are temporarily unavailable.', 'error');
    } finally {
      state.loading = false;
    }
  };

  const makePlayerIcon = (player) => window.L.divIcon({
    className: 'zone-player-div-icon',
    html: `<span class="zone-player-marker"><span class="zone-player-dot"></span><span class="zone-player-label"></span></span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  const renderOnlinePlayers = (payload) => {
    const mapInstance = ensureOnlineMap();
    if (!mapInstance || !state.onlineLayers) return;
    state.onlineLayers.clearLayers();
    const players = Array.isArray(payload.players) ? payload.players : [];
    players.forEach((player) => {
      const latlng = window.WWZMap.worldToLeaflet([player.x, player.z], mapInstance.mapKey);
      if (!latlng) return;
      const marker = window.L.marker(latlng, {
        icon: makePlayerIcon(player),
        keyboard: true,
        title: String(player.name || 'Online player'),
        zIndexOffset: 600,
      });
      const label = document.createElement('span');
      label.textContent = String(player.name || 'Player');
      marker.on('add', () => {
        const element = marker.getElement();
        const target = element?.querySelector('.zone-player-label');
        if (target) target.textContent = label.textContent;
      });
      marker.bindTooltip(`X ${formatCoordinate(player.x)} · Z ${formatCoordinate(player.z)}`, { direction: 'top', offset: [0, -12] });
      marker.addTo(state.onlineLayers);
    });
    const count = $('[data-zone-online-count]');
    if (count) count.textContent = String(players.length);
    const snapshot = $('[data-zone-online-snapshot]');
    if (snapshot) snapshot.textContent = payload.snapshot_time ? `ADM snapshot ${payload.snapshot_time}` : 'Waiting for ADM snapshot';
    const mapName = $('[data-zone-online-map-name]');
    if (mapName) mapName.textContent = String(payload.map_name || state.mapName || 'DayZ');
    onlineMessage(payload.message || (players.length ? '' : 'No online player positions are available yet.'), players.length ? 'info' : 'warning');
  };

  const loadOnlinePlayers = async ({ force = false } = {}) => {
    if (!isAdmin() || state.onlineLoading) return;
    if (!force && state.activeSection !== 'online') return;
    state.onlineLoading = true;
    const refresh = $('[data-zone-online-refresh]');
    refresh?.setAttribute('disabled', '');
    try {
      const payload = await authenticatedJson(`${ADMIN_ONLINE_PLAYERS_MAP_URL}?t=${Date.now()}`);
      if (payload.map_key && state.onlineMap?.mapKey !== payload.map_key) destroyMap('onlineMap');
      renderOnlinePlayers(payload);
    } catch (error) {
      onlineMessage(error?.message || 'Online player positions are temporarily unavailable.', 'error');
    } finally {
      state.onlineLoading = false;
      refresh?.removeAttribute('disabled');
    }
  };

  const stopOnlineTimer = () => {
    if (state.onlineTimer) window.clearInterval(state.onlineTimer);
    state.onlineTimer = null;
  };

  const startOnlineTimer = () => {
    stopOnlineTimer();
    state.onlineTimer = window.setInterval(() => {
      if (state.activeSection === 'online' && document.visibilityState === 'visible') loadOnlinePlayers({ force: true });
    }, 30_000);
  };

  const activate = async ({ section = 'manage' } = {}) => {
    if (!isAdmin()) return;
    state.activeSection = section || 'manage';
    if (state.activeSection !== 'online') stopOnlineTimer();
    await loadZones();
    if (state.activeSection === 'map') {
      renderZoneOverlays();
      window.setTimeout(() => state.zoneMap?.invalidateSize?.(), 40);
    } else if (state.activeSection === 'online') {
      ensureOnlineMap();
      await loadOnlinePlayers({ force: true });
      startOnlineTimer();
      window.setTimeout(() => state.onlineMap?.invalidateSize?.(), 40);
    } else {
      stopOnlineTimer();
      renderZoneList();
    }
  };

  const bind = () => {
    $('[data-zone-create-circle]')?.addEventListener('click', () => openEditor('circle'));
    $('[data-zone-create-polygon]')?.addEventListener('click', () => openEditor('polygon'));
    $('[data-zone-refresh]')?.addEventListener('click', () => loadZones({ force: true }));
    $('[data-zone-search]')?.addEventListener('input', renderZoneList);
    $('[data-zone-filter]')?.addEventListener('change', renderZoneList);
    $('[data-zone-online-refresh]')?.addEventListener('click', () => loadOnlinePlayers({ force: true }));
    $('[data-zone-editor-form]')?.addEventListener('submit', saveZone);
    $('[data-zone-add-dynamic-list]')?.addEventListener('click', () => {
      if (state.dynamicLists.length >= 20) {
        editorMessage('A maximum of 20 dynamic lists can be configured per zone.', 'warning');
        return;
      }
      state.dynamicLists.push({ name: `List ${state.dynamicLists.length + 1}`, mode: 'ignore', active: true, entries: [] });
      renderDynamicLists();
    });
    $$('[data-zone-editor-cancel]').forEach((button) => button.addEventListener('click', () => $('[data-zone-dialog]')?.close?.()));
    $('[data-zone-dialog]')?.addEventListener('click', (event) => {
      if (event.target === $('[data-zone-dialog]')) $('[data-zone-dialog]')?.close?.();
    });
    $('[data-zone-dialog]')?.addEventListener('close', () => {
      state.editorLayers?.clearLayers?.();
      state.editorMap?.clearSelection?.({ notify: false });
    });
    ['[data-zone-center-x]', '[data-zone-center-z]', '[data-zone-radius]', '[data-zone-colour]', '[data-zone-active]']
      .forEach((selector) => $(selector)?.addEventListener('input', renderEditorGeometry));
    $('[data-zone-undo-point]')?.addEventListener('click', () => {
      state.editorPoints.pop();
      renderEditorGeometry();
    });
    $('[data-zone-clear-points]')?.addEventListener('click', () => {
      state.editorPoints = [];
      state.editorMap?.clearSelection?.({ notify: false });
      renderEditorGeometry();
    });
    window.addEventListener('wwz:viewchange', (event) => {
      if (String(event.detail?.view || '') !== 'zones') {
        state.activeSection = '';
        stopOnlineTimer();
      }
    });
    window.addEventListener('wwz:serverchange', () => {
      stopOnlineTimer();
      destroyAllMaps();
      state.loaded = false;
      state.zones = [];
      state.channels = [];
      state.roles = [];
      state.users = [];
      state.eventOptions = [];
      state.dynamicLists = [];
      if (state.activeSection) loadZones({ force: true }).then(() => activate({ section: state.activeSection })).catch(() => {});
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && state.activeSection === 'online') loadOnlinePlayers({ force: true });
    });
  };

  bind();
  window.__wwzZonesReady = true;
  window.WWZZones = Object.freeze({ activate, loadZones, openEditor });
})();
