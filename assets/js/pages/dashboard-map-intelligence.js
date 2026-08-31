(() => {
  'use strict';

  if (window.__wwzMapIntelligenceReady) return;
  const root = document.querySelector('[data-map-intel-panel]');
  if (!root || !window.WWZDashboardMap) return;

  const READ_URL = `${DASHBOARD_API_BASE}/api/map/intelligence`;
  const MARKER_ACTION_URL = `${DASHBOARD_API_BASE}/api/account/map/markers/action`;
  const GROUP_ACTION_URL = `${DASHBOARD_API_BASE}/api/account/map/groups/action`;
  const ACTIVE_REFRESH_MS = 45_000;
  const RESUME_REFRESH_AGE_MS = 15_000;

  const layerControls = root.querySelector('[data-map-intel-layers]');
  const status = root.querySelector('[data-map-intel-status]');
  const markerList = root.querySelector('[data-map-intel-marker-list]');
  const markerEmpty = root.querySelector('[data-map-intel-marker-empty]');
  const markerForm = root.querySelector('[data-map-intel-marker-form]');
  const markerFormPanel = root.querySelector('[data-map-intel-marker-editor]');
  const markerId = root.querySelector('[data-map-intel-marker-id]');
  const markerScope = root.querySelector('[data-map-intel-marker-scope]');
  const markerTarget = root.querySelector('[data-map-intel-marker-target]');
  const markerName = root.querySelector('[data-map-intel-marker-name]');
  const markerCategory = root.querySelector('[data-map-intel-marker-category]');
  const markerDescription = root.querySelector('[data-map-intel-marker-description]');
  const markerX = root.querySelector('[data-map-intel-marker-x]');
  const markerZ = root.querySelector('[data-map-intel-marker-z]');
  const markerSubmit = root.querySelector('[data-map-intel-marker-submit]');
  const markerHeading = root.querySelector('[data-map-intel-marker-heading]');
  const markerScopeHelp = root.querySelector('[data-map-intel-marker-scope-help]');
  const groupList = root.querySelector('[data-map-intel-group-list]');
  const groupEmpty = root.querySelector('[data-map-intel-group-empty]');
  const groupCreateForm = root.querySelector('[data-map-intel-group-create]');
  const groupJoinForm = root.querySelector('[data-map-intel-group-join]');
  const inviteNotice = root.querySelector('[data-map-intel-invite-notice]');
  const signedOutNotices = [...root.querySelectorAll('[data-map-intel-signed-out]')];
  const signedInTools = [...root.querySelectorAll('[data-map-intel-signed-in]')];
  const killCount = root.querySelector('[data-map-intel-kill-count]');

  let instance = null;
  let active = false;
  let timer = null;
  let requestInFlight = null;
  let lastFetchAt = 0;
  let lastFingerprint = '';
  let state = { authenticated: false, groups: [], faction: null, shared_markers: [], kill_zones: [], livonia_pvp: null, chernarus_pve: null };
  let groupLayers = new Map();
  let factionLayer = null;
  let killZoneLayer = null;
  let killLabelLayer = null;
  let livoniaHotspotLayer = null;
  let livoniaObjectiveLayer = null;
  let livoniaHeatmapLayer = null;
  let chernarusExpeditionLayer = null;
  let chernarusHeatmapLayer = null;
  let layerVisibility = { private: true, public: true, faction: true, killzones: true, livoniapvp: true, livoniaheatmap: false, chernaruspve: true, chernarusheatmap: false, groups: new Map() };

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
  const cleanColour = (value, fallback = '#D52B1E') => /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : fallback;
  const mapVisible = () => active && !document.hidden;
  const sessionToken = () => {
    try { return storageGet(AUTH_SESSION_KEY) || ''; } catch { return ''; }
  };
  const setStatus = (message = '', tone = '') => {
    if (!status) return;
    status.hidden = !message;
    status.textContent = message;
    status.dataset.tone = tone;
  };
  const apiMessage = (payload, fallback) => String(payload?.message || fallback || 'That map request could not be completed.');

  const request = async (url, { method = 'GET', body = null, authenticated = false } = {}) => {
    const headers = { Accept: 'application/json' };
    const token = sessionToken();
    if (authenticated && !token) throw new Error('Sign in with Discord to use collaborative map features.');
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== null) headers['Content-Type'] = 'application/json';
    const response = await authFetch(url, { method, headers, body: body === null ? undefined : JSON.stringify(body), cache: 'no-store' });
    let payload = null;
    try { payload = await response.json(); } catch {}
    if (!response.ok) {
      const error = new Error(apiMessage(payload, `Map request failed (${response.status}).`));
      error.status = response.status;
      throw error;
    }
    return payload || {};
  };

  const clearLayers = () => {
    groupLayers.forEach((layer) => layer?.clearLayers?.());
    groupLayers = new Map();
    factionLayer?.clearLayers?.();
    killZoneLayer?.clearLayers?.();
    killLabelLayer?.clearLayers?.();
    livoniaHotspotLayer?.clearLayers?.();
    livoniaObjectiveLayer?.clearLayers?.();
    livoniaHeatmapLayer?.clearLayers?.();
    chernarusExpeditionLayer?.clearLayers?.();
    chernarusHeatmapLayer?.clearLayers?.();
    factionLayer = null;
    killZoneLayer = null;
    killLabelLayer = null;
    livoniaHotspotLayer = null;
    livoniaObjectiveLayer = null;
    livoniaHeatmapLayer = null;
    chernarusExpeditionLayer = null;
    chernarusHeatmapLayer = null;
  };

  const ensureLayer = (scope, id = null) => {
    if (!instance?.map || !window.L) return null;
    if (scope === 'faction') {
      if (!factionLayer) factionLayer = L.layerGroup();
      return factionLayer;
    }
    if (scope === 'killzones') {
      if (!killZoneLayer) killZoneLayer = L.layerGroup();
      return killZoneLayer;
    }
    if (scope === 'killlabels') {
      if (!killLabelLayer) killLabelLayer = L.layerGroup();
      return killLabelLayer;
    }
    if (scope === 'livoniahotspots') {
      if (!livoniaHotspotLayer) livoniaHotspotLayer = L.layerGroup();
      return livoniaHotspotLayer;
    }
    if (scope === 'livoniaobjective') {
      if (!livoniaObjectiveLayer) livoniaObjectiveLayer = L.layerGroup();
      return livoniaObjectiveLayer;
    }
    if (scope === 'livoniaheatmap') {
      if (!livoniaHeatmapLayer) livoniaHeatmapLayer = L.layerGroup();
      return livoniaHeatmapLayer;
    }
    if (scope === 'chernarusexpeditions') {
      if (!chernarusExpeditionLayer) chernarusExpeditionLayer = L.layerGroup();
      return chernarusExpeditionLayer;
    }
    if (scope === 'chernarusheatmap') {
      if (!chernarusHeatmapLayer) chernarusHeatmapLayer = L.layerGroup();
      return chernarusHeatmapLayer;
    }
    const key = Number(id);
    if (!groupLayers.has(key)) groupLayers.set(key, L.layerGroup());
    return groupLayers.get(key);
  };

  const syncLayerToMap = (layer, visible) => {
    if (!instance?.map || !layer) return;
    if (visible) {
      if (!instance.map.hasLayer(layer)) layer.addTo(instance.map);
    } else if (instance.map.hasLayer(layer)) {
      instance.map.removeLayer(layer);
    }
  };

  const zoneCentroid = (zone) => {
    if (zone.shape === 'circle') return { x: Number(zone.center_x), z: Number(zone.center_z) };
    const points = Array.isArray(zone.points) ? zone.points : [];
    if (!points.length) return null;
    const total = points.reduce((acc, point) => ({ x: acc.x + Number(point.x), z: acc.z + Number(point.z) }), { x: 0, z: 0 });
    return { x: total.x / points.length, z: total.z / points.length };
  };

  const circleWorldPoints = (zone) => {
    const cx = Number(zone.center_x), cz = Number(zone.center_z), radius = Number(zone.radius);
    if (![cx, cz, radius].every(Number.isFinite) || radius <= 0) return [];
    return Array.from({ length: 72 }, (_, index) => {
      const angle = (index / 72) * Math.PI * 2;
      return { x: cx + Math.cos(angle) * radius, z: cz + Math.sin(angle) * radius };
    });
  };

  const renderKillZones = () => {
    const shapes = ensureLayer('killzones');
    const labels = ensureLayer('killlabels');
    shapes?.clearLayers?.();
    labels?.clearLayers?.();
    if (!instance || !shapes || !labels) return;
    state.kill_zones.forEach((zone) => {
      const worldPoints = zone.shape === 'polygon' ? zone.points : circleWorldPoints(zone);
      const latLngs = (Array.isArray(worldPoints) ? worldPoints : [])
        .map((point) => window.WWZMap?.worldToLeaflet?.([Number(point.x), Number(point.z)], instance.mapKey))
        .filter(Boolean);
      if (latLngs.length < 3) return;
      const colour = cleanColour(zone.colour);
      const polygon = L.polygon(latLngs, { color: colour, weight: 2.5, opacity: 0.95, fillColor: colour, fillOpacity: 0.18, interactive: true, className: 'wwz-kill-zone-shape' });
      polygon.bindPopup(`<div class="wwz-map-intel-popup"><strong>${escapeHtml(zone.name || 'Kill Zone')}</strong><span>Active Kill Zone</span><small>${zone.shape === 'polygon' ? `${latLngs.length} exact polygon vertices` : `${Number(zone.radius).toFixed(0)} m radius`}</small></div>`);
      shapes.addLayer(polygon);
      const center = zoneCentroid(zone);
      const latLng = center && window.WWZMap?.worldToLeaflet?.([center.x, center.z], instance.mapKey);
      if (latLng) {
        const label = L.marker(latLng, { interactive: false, keyboard: false, icon: L.divIcon({ className: 'wwz-kill-zone-label-icon', html: `<span>${escapeHtml(zone.name || 'KILL ZONE')}</span>`, iconSize: null }) });
        labels.addLayer(label);
      }
    });
    syncLayerToMap(shapes, layerVisibility.killzones);
    syncLayerToMap(labels, layerVisibility.killzones);
    if (killCount) killCount.textContent = String(state.kill_zones.length);
  };

  const renderLivoniaPvp = () => {
    const hotspotLayer = ensureLayer('livoniahotspots');
    const objectiveLayer = ensureLayer('livoniaobjective');
    const heatmapLayer = ensureLayer('livoniaheatmap');
    hotspotLayer?.clearLayers?.();
    objectiveLayer?.clearLayers?.();
    heatmapLayer?.clearLayers?.();
    if (!instance || !hotspotLayer || !objectiveLayer || !heatmapLayer || !state.livonia_pvp) {
      syncLayerToMap(hotspotLayer, false);
      syncLayerToMap(objectiveLayer, false);
      syncLayerToMap(heatmapLayer, false);
      return;
    }
    const makeCircle = (item, colour, label) => {
      const center = window.WWZMap?.worldToLeaflet?.([Number(item.x), Number(item.z)], instance.mapKey);
      if (!center) return null;
      const zone = { center_x: Number(item.x), center_z: Number(item.z), radius: Number(item.radius) };
      const latLngs = circleWorldPoints(zone).map((point) => window.WWZMap?.worldToLeaflet?.([point.x, point.z], instance.mapKey)).filter(Boolean);
      if (latLngs.length < 3) return null;
      const polygon = L.polygon(latLngs, { color: colour, weight: 2.5, opacity: .95, fillColor: colour, fillOpacity: .12, interactive: true });
      polygon.bindPopup(`<div class="wwz-map-intel-popup"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(label)}</span><small>${Number(item.radius).toFixed(0)} m radius</small></div>`);
      return polygon;
    };
    (state.livonia_pvp.hotspots || []).forEach((item) => {
      const shape = makeCircle(item, '#f2a33a', 'Active Livonia PvP Hotspot');
      if (shape) hotspotLayer.addLayer(shape);
    });
    if (state.livonia_pvp.faction_objective) {
      const shape = makeCircle(state.livonia_pvp.faction_objective, '#d52b1e', 'Active Faction Control Objective');
      if (shape) objectiveLayer.addLayer(shape);
    }
    const heat = Array.isArray(state.livonia_pvp.heatmap_24h) ? state.livonia_pvp.heatmap_24h : [];
    const peak = Math.max(1, ...heat.map((item) => Number(item.kills || 0)));
    heat.forEach((item) => {
      const size = Math.max(200, Number(item.grid_size || 600));
      const half = size / 2;
      const corners = [
        [Number(item.x) - half, Number(item.z) - half],
        [Number(item.x) + half, Number(item.z) - half],
        [Number(item.x) + half, Number(item.z) + half],
        [Number(item.x) - half, Number(item.z) + half]
      ].map((point) => window.WWZMap?.worldToLeaflet?.(point, instance.mapKey)).filter(Boolean);
      if (corners.length !== 4) return;
      const intensity = Math.max(.08, Math.min(.48, .1 + (Number(item.kills || 0) / peak) * .38));
      const polygon = L.polygon(corners, { color: '#ff5c48', weight: 1, opacity: .35, fillColor: '#ff5c48', fillOpacity: intensity, interactive: true });
      polygon.bindPopup(`<div class="wwz-map-intel-popup"><strong>PvP Heat</strong><span>${Number(item.kills || 0)} confirmed kills · last 24h</span><small>X ${Number(item.x).toFixed(0)} / Z ${Number(item.z).toFixed(0)} · ${size.toFixed(0)} m grid</small></div>`);
      heatmapLayer.addLayer(polygon);
    });
    syncLayerToMap(hotspotLayer, layerVisibility.livoniapvp);
    syncLayerToMap(objectiveLayer, layerVisibility.livoniapvp);
    syncLayerToMap(heatmapLayer, layerVisibility.livoniaheatmap);
  };


  const renderChernarusPve = () => {
    const expeditionLayer = ensureLayer('chernarusexpeditions');
    const heatmapLayer = ensureLayer('chernarusheatmap');
    expeditionLayer?.clearLayers?.();
    heatmapLayer?.clearLayers?.();
    if (!instance || !expeditionLayer || !heatmapLayer || !state.chernarus_pve) {
      syncLayerToMap(expeditionLayer, false);
      syncLayerToMap(heatmapLayer, false);
      return;
    }
    const makeCircle = (item) => {
      const zone = { center_x: Number(item.x), center_z: Number(item.z), radius: Number(item.radius) };
      const latLngs = circleWorldPoints(zone).map((point) => window.WWZMap?.worldToLeaflet?.([point.x, point.z], instance.mapKey)).filter(Boolean);
      if (latLngs.length < 3) return null;
      const colour = String(item.tier || '').toLowerCase() === 'endgame' ? '#d52b1e' : '#4caf78';
      const polygon = L.polygon(latLngs, { color: colour, weight: 2.5, opacity: .95, fillColor: colour, fillOpacity: .12, interactive: true });
      polygon.bindPopup(`<div class="wwz-map-intel-popup"><strong>${escapeHtml(item.name)}</strong><span>Active Chernarus PvE Expedition · ${escapeHtml(item.tier || 'PvE')}</span><small>${Number(item.radius).toFixed(0)} m radius</small></div>`);
      return polygon;
    };
    (state.chernarus_pve.expeditions || []).forEach((item) => {
      const shape = makeCircle(item);
      if (shape) expeditionLayer.addLayer(shape);
    });
    const heat = Array.isArray(state.chernarus_pve.heatmap_24h) ? state.chernarus_pve.heatmap_24h : [];
    const peak = Math.max(1, ...heat.map((item) => Number(item.checkins || 0)));
    heat.forEach((item) => {
      const size = Math.max(200, Number(item.grid_size || 600));
      const half = size / 2;
      const corners = [
        [Number(item.x) - half, Number(item.z) - half],
        [Number(item.x) + half, Number(item.z) - half],
        [Number(item.x) + half, Number(item.z) + half],
        [Number(item.x) - half, Number(item.z) + half]
      ].map((point) => window.WWZMap?.worldToLeaflet?.(point, instance.mapKey)).filter(Boolean);
      if (corners.length !== 4) return;
      const intensity = Math.max(.07, Math.min(.44, .09 + (Number(item.checkins || 0) / peak) * .35));
      const polygon = L.polygon(corners, { color: '#4caf78', weight: 1, opacity: .35, fillColor: '#4caf78', fillOpacity: intensity, interactive: true });
      polygon.bindPopup(`<div class="wwz-map-intel-popup"><strong>PvE Participation</strong><span>${Number(item.checkins || 0)} periodic check-ins · ${Number(item.participants || 0)} survivors · last 24h</span><small>X ${Number(item.x).toFixed(0)} / Z ${Number(item.z).toFixed(0)} · ${size.toFixed(0)} m grid</small></div>`);
      heatmapLayer.addLayer(polygon);
    });
    syncLayerToMap(expeditionLayer, layerVisibility.chernaruspve);
    syncLayerToMap(heatmapLayer, layerVisibility.chernarusheatmap);
  };

  const renderSharedMarkers = () => {
    groupLayers.forEach((layer) => layer.clearLayers());
    factionLayer?.clearLayers?.();
    const groupsById = new Map(state.groups.map((group) => [Number(group.group_id), group]));
    state.groups.forEach((group) => {
      if (!layerVisibility.groups.has(Number(group.group_id))) layerVisibility.groups.set(Number(group.group_id), true);
      ensureLayer('group', group.group_id);
    });
    if (state.faction) ensureLayer('faction');

    state.shared_markers.forEach((marker) => {
      const group = marker.scope === 'group' ? groupsById.get(Number(marker.scope_id)) : null;
      const layer = marker.scope === 'group' ? ensureLayer('group', marker.scope_id) : ensureLayer('faction');
      if (!layer) return;
      const colour = cleanColour(marker.colour, marker.scope === 'faction' ? '#8F1D1D' : '#D52B1E');
      const leafletMarker = instance.addPoi(marker, { layer, custom: true, colour, showLabel: true, onClick: () => {} });
      leafletMarker?.bindPopup?.(`<div class="wwz-map-intel-popup"><strong>${escapeHtml(marker.name)}</strong><span>${escapeHtml(marker.scope_name || (marker.scope === 'group' ? group?.name : state.faction?.name) || marker.scope)}</span><small>${escapeHtml(marker.category || 'Shared')} · X ${Number(marker.x).toFixed(1)} / Z ${Number(marker.z).toFixed(1)}</small>${marker.description ? `<p>${escapeHtml(marker.description)}</p>` : ''}</div>`);
    });
    state.groups.forEach((group) => syncLayerToMap(ensureLayer('group', group.group_id), layerVisibility.groups.get(Number(group.group_id)) !== false));
    syncLayerToMap(factionLayer, layerVisibility.faction && Boolean(state.faction));
  };

  const renderLayers = () => {
    if (!layerControls) return;
    const groupRows = state.groups.map((group) => {
      const id = Number(group.group_id);
      const checked = layerVisibility.groups.get(id) !== false;
      return `<label class="map-intel-layer-row"><input data-intel-layer-group="${id}" type="checkbox" ${checked ? 'checked' : ''}><span class="map-intel-swatch" style="--intel-colour:${cleanColour(group.colour)}"></span><span><strong>${escapeHtml(group.name)}</strong><small>Group · ${Number(group.member_count || 0)} members</small></span></label>`;
    }).join('');
    const factionRow = state.faction ? `<label class="map-intel-layer-row"><input data-intel-layer="faction" type="checkbox" ${layerVisibility.faction ? 'checked' : ''}><span class="map-intel-swatch" style="--intel-colour:${cleanColour(state.faction.colour, '#8F1D1D')}"></span><span><strong>${escapeHtml(state.faction.name)}</strong><small>Faction</small></span></label>` : '';
    const livoniaPvpRow = state.livonia_pvp ? `<label class="map-intel-layer-row"><input data-intel-layer="livoniapvp" type="checkbox" ${layerVisibility.livoniapvp ? 'checked' : ''}><span class="map-intel-swatch" style="--intel-colour:#f2a33a"></span><span><strong>Livonia PvP</strong><small>Hotspots &amp; faction objective</small></span></label>` : '';
    const livoniaHeatRow = state.livonia_pvp ? `<label class="map-intel-layer-row"><input data-intel-layer="livoniaheatmap" type="checkbox" ${layerVisibility.livoniaheatmap ? 'checked' : ''}><span class="map-intel-swatch" style="--intel-colour:#ff5c48"></span><span><strong>PvP Heatmap</strong><small>Confirmed kills · last 24 hours</small></span></label>` : '';
    const chernarusPveRow = state.chernarus_pve ? `<label class="map-intel-layer-row"><input data-intel-layer="chernaruspve" type="checkbox" ${layerVisibility.chernaruspve ? 'checked' : ''}><span class="map-intel-swatch" style="--intel-colour:#4caf78"></span><span><strong>Chernarus PvE</strong><small>Active expedition areas</small></span></label>` : '';
    const chernarusHeatRow = state.chernarus_pve ? `<label class="map-intel-layer-row"><input data-intel-layer="chernarusheatmap" type="checkbox" ${layerVisibility.chernarusheatmap ? 'checked' : ''}><span class="map-intel-swatch" style="--intel-colour:#8ad7a9"></span><span><strong>PvE Heatmap</strong><small>Periodic expedition check-ins · last 24 hours</small></span></label>` : '';
    layerControls.innerHTML = `
      <label class="map-intel-layer-row"><input data-intel-layer="private" type="checkbox" ${layerVisibility.private ? 'checked' : ''}><span class="map-intel-swatch private"></span><span><strong>Private</strong><small>This browser only</small></span></label>
      <label class="map-intel-layer-row"><input data-intel-layer="public" type="checkbox" ${layerVisibility.public ? 'checked' : ''}><span class="map-intel-swatch public"></span><span><strong>Public</strong><small>Admin published</small></span></label>
      ${groupRows}${factionRow}${livoniaPvpRow}${livoniaHeatRow}${chernarusPveRow}${chernarusHeatRow}
      <label class="map-intel-layer-row"><input data-intel-layer="killzones" type="checkbox" ${layerVisibility.killzones ? 'checked' : ''}><span class="map-intel-swatch killzone"></span><span><strong>Kill Zones</strong><small><span data-inline-kill-count>${state.kill_zones.length}</span> active areas</small></span></label>`;
  };

  const renderMarkerList = () => {
    if (!markerList) return;
    const sorted = [...state.shared_markers].sort((a, b) => String(a.name).localeCompare(String(b.name), undefined, { sensitivity: 'base' }));
    markerList.innerHTML = '';
    sorted.forEach((marker) => {
      const item = document.createElement('article');
      item.className = 'map-intel-marker-card';
      item.innerHTML = `<div><span class="map-intel-swatch" style="--intel-colour:${cleanColour(marker.colour)}"></span><div><strong>${escapeHtml(marker.name)}</strong><small>${escapeHtml(marker.scope_name || marker.scope)} · ${escapeHtml(marker.category || 'Shared')}</small></div></div><div class="map-intel-marker-coords">X ${Number(marker.x).toFixed(1)} · Z ${Number(marker.z).toFixed(1)}</div><div class="map-intel-card-actions"><button class="secondary-action compact-action" data-intel-focus="${Number(marker.marker_id)}" data-intel-scope="${escapeHtml(marker.scope)}" type="button">Centre</button>${marker.can_manage ? `<button class="secondary-action compact-action" data-intel-edit="${Number(marker.marker_id)}" data-intel-scope="${escapeHtml(marker.scope)}" type="button">Edit</button><button class="danger-action compact-action" data-intel-delete="${Number(marker.marker_id)}" type="button">Delete</button>` : ''}</div>`;
      markerList.append(item);
    });
    if (markerEmpty) markerEmpty.hidden = sorted.length !== 0;
  };

  const memberActions = (group, member) => {
    if (member.me) return '<span class="map-intel-you">You</span>';
    const buttons = [];
    if (group.my_role === 'owner' && member.role !== 'owner') {
      buttons.push(`<button class="secondary-action compact-action" data-group-role="${escapeHtml(member.key)}" data-group-id="${group.group_id}" data-role="${member.role === 'moderator' ? 'member' : 'moderator'}" type="button">${member.role === 'moderator' ? 'Make Member' : 'Make Moderator'}</button>`);
      buttons.push(`<button class="secondary-action compact-action" data-group-transfer="${escapeHtml(member.key)}" data-group-id="${group.group_id}" type="button">Transfer Owner</button>`);
    }
    if ((group.my_role === 'owner' && member.role !== 'owner') || (group.my_role === 'moderator' && member.role === 'member')) {
      buttons.push(`<button class="danger-action compact-action" data-group-remove="${escapeHtml(member.key)}" data-group-id="${group.group_id}" type="button">Remove</button>`);
    }
    return buttons.join('');
  };

  const renderGroups = () => {
    if (!groupList) return;
    groupList.innerHTML = '';
    state.groups.forEach((group) => {
      const card = document.createElement('article');
      card.className = 'map-intel-group-card';
      const memberRows = (group.members || []).map((member) => `<li><div><strong>${escapeHtml(member.name)}</strong><small>${escapeHtml(member.role)}</small></div><div class="map-intel-member-actions">${memberActions(group, member)}</div></li>`).join('');
      card.innerHTML = `<div class="map-intel-group-heading"><div><span class="map-intel-swatch" style="--intel-colour:${cleanColour(group.colour)}"></span><div><strong>${escapeHtml(group.name)}</strong><small>${escapeHtml(group.my_role)} · ${Number(group.member_count || 0)} members</small></div></div><div class="map-intel-card-actions">${group.my_role === 'owner' ? `<button class="secondary-action compact-action" data-group-invite="${group.group_id}" type="button">New Invite</button><button class="secondary-action compact-action" data-group-edit="${group.group_id}" type="button">Edit</button><button class="danger-action compact-action" data-group-delete="${group.group_id}" type="button">Delete</button>` : `<button class="danger-action compact-action" data-group-leave="${group.group_id}" type="button">Leave</button>`}</div></div><ul class="map-intel-member-list">${memberRows}</ul>`;
      groupList.append(card);
    });
    if (groupEmpty) groupEmpty.hidden = state.groups.length !== 0;
  };

  const syncAuthUi = () => {
    signedOutNotices.forEach((element) => { element.hidden = state.authenticated; });
    signedInTools.forEach((element) => { element.hidden = !state.authenticated; });
  };

  const renderAll = () => {
    window.WWZDashboardMap.setBaseLayerVisible?.('private', layerVisibility.private);
    window.WWZDashboardMap.setBaseLayerVisible?.('public', layerVisibility.public);
    renderLayers();
    renderSharedMarkers();
    renderKillZones();
    renderLivoniaPvp();
    renderChernarusPve();
    renderMarkerList();
    renderGroups();
    syncAuthUi();
    syncMarkerScopeOptions();
  };

  const fingerprint = (payload) => JSON.stringify({
    authenticated: Boolean(payload.authenticated), map_key: payload.map_key,
    groups: payload.groups || [], faction: payload.faction || null,
    shared_markers: payload.shared_markers || [], kill_zones: payload.kill_zones || [], livonia_pvp: payload.livonia_pvp || null, chernarus_pve: payload.chernarus_pve || null
  });

  const fetchState = async ({ force = false } = {}) => {
    if (!mapVisible() && !force) return;
    if (requestInFlight) return requestInFlight;
    requestInFlight = (async () => {
      const token = sessionToken();
      let payload;
      try {
        payload = await request(READ_URL, { authenticated: Boolean(token) });
      } catch (error) {
        if (token && [401, 403].includes(error.status)) payload = await request(READ_URL);
        else throw error;
      }
      lastFetchAt = Date.now();
      const nextFingerprint = fingerprint(payload);
      state = {
        authenticated: Boolean(payload.authenticated),
        groups: Array.isArray(payload.groups) ? payload.groups : [],
        faction: payload.faction || null,
        shared_markers: Array.isArray(payload.shared_markers) ? payload.shared_markers : [],
        kill_zones: Array.isArray(payload.kill_zones) ? payload.kill_zones : [],
        livonia_pvp: payload.livonia_pvp || null,
        chernarus_pve: payload.chernarus_pve || null
      };
      if (nextFingerprint !== lastFingerprint) {
        lastFingerprint = nextFingerprint;
        renderAll();
      } else syncAuthUi();
      setStatus('');
    })().catch((error) => setStatus(error.message || 'Map intelligence could not be refreshed.', 'error')).finally(() => { requestInFlight = null; });
    return requestInFlight;
  };

  const schedule = () => {
    window.clearTimeout(timer);
    timer = null;
    if (!mapVisible()) return;
    timer = window.setTimeout(async () => { await fetchState(); schedule(); }, ACTIVE_REFRESH_MS);
  };

  const activate = async () => {
    active = true;
    try { instance = await window.WWZDashboardMap.initialise(); } catch (error) { setStatus(error.message, 'error'); return; }
    await fetchState({ force: true });
    schedule();
  };

  const deactivate = () => {
    active = false;
    window.clearTimeout(timer);
    timer = null;
  };

  const syncMarkerScopeOptions = () => {
    if (!markerScope || !markerTarget) return;
    const previous = markerScope.value;
    const options = [];
    if (state.groups.length) options.push('<option value="group">Group</option>');
    if (state.faction) options.push('<option value="faction">Faction</option>');
    markerScope.innerHTML = options.join('');
    if (options.length && [...markerScope.options].some((option) => option.value === previous)) markerScope.value = previous;
    markerScope.disabled = options.length === 0;
    markerTarget.innerHTML = state.groups.map((group) => `<option value="${group.group_id}">${escapeHtml(group.name)}</option>`).join('');
    markerTarget.closest('label').hidden = markerScope.value !== 'group';
    if (markerScopeHelp) markerScopeHelp.textContent = markerScope.value === 'faction' && state.faction ? `Visible only to ${state.faction.name} members.` : 'Visible only to members of the selected map group.';
  };

  const openMarkerEditor = (marker = null, scope = null) => {
    if (!state.authenticated) { setStatus('Sign in with Discord to create shared markers.', 'error'); return; }
    if (!state.groups.length && !state.faction) { setStatus('Join a map group or faction before creating a shared marker.', 'error'); return; }
    markerFormPanel.hidden = false;
    markerId.value = marker?.marker_id || '';
    markerName.value = marker?.name || '';
    markerCategory.value = marker?.category || '';
    markerDescription.value = marker?.description || '';
    markerX.value = marker?.x ?? '';
    markerZ.value = marker?.z ?? '';
    syncMarkerScopeOptions();
    if (marker) {
      markerScope.value = marker.scope;
      if (marker.scope === 'group') markerTarget.value = String(marker.scope_id);
      markerScope.disabled = true;
      markerTarget.disabled = true;
      markerHeading.textContent = 'Edit Shared Marker';
      markerSubmit.textContent = 'Save Changes';
    } else {
      markerScope.disabled = false;
      markerTarget.disabled = false;
      if (scope && [...markerScope.options].some((option) => option.value === scope)) markerScope.value = scope;
      markerHeading.textContent = 'Create Shared Marker';
      markerSubmit.textContent = 'Create Marker';
    }
    syncMarkerScopeOptions();
    if (marker) { markerScope.disabled = true; markerTarget.disabled = true; }
    markerFormPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const closeMarkerEditor = () => {
    markerFormPanel.hidden = true;
    markerForm.reset();
    markerId.value = '';
    markerScope.disabled = false;
    markerTarget.disabled = false;
  };

  const performMarkerAction = async (payload) => {
    setStatus('Saving collaborative marker…');
    const response = await request(MARKER_ACTION_URL, { method: 'POST', authenticated: true, body: payload });
    state.shared_markers = Array.isArray(response.shared_markers) ? response.shared_markers : state.shared_markers;
    lastFingerprint = '';
    renderAll();
    setStatus('Collaborative marker updated.', 'success');
  };

  const performGroupAction = async (payload) => {
    setStatus('Updating map group…');
    const response = await request(GROUP_ACTION_URL, { method: 'POST', authenticated: true, body: payload });
    state.groups = Array.isArray(response.groups) ? response.groups : [];
    state.faction = response.faction || null;
    state.shared_markers = Array.isArray(response.shared_markers) ? response.shared_markers : [];
    lastFingerprint = '';
    renderAll();
    if (response.invite_code && inviteNotice) {
      inviteNotice.hidden = false;
      inviteNotice.innerHTML = `<strong>Invite code</strong><code>${escapeHtml(response.invite_code)}</code><small>Share it only with people you want in this group. This code is shown once and is not stored in plaintext.</small>`;
    }
    setStatus('Map group updated.', 'success');
  };

  layerControls?.addEventListener('change', (event) => {
    const input = event.target.closest('input[type="checkbox"]');
    if (!input) return;
    const visible = input.checked;
    const groupId = input.dataset.intelLayerGroup;
    if (groupId) {
      layerVisibility.groups.set(Number(groupId), visible);
      syncLayerToMap(ensureLayer('group', Number(groupId)), visible);
      return;
    }
    const scope = input.dataset.intelLayer;
    if (scope === 'private' || scope === 'public') {
      layerVisibility[scope] = visible;
      window.WWZDashboardMap.setBaseLayerVisible(scope, visible);
    } else if (scope === 'faction') {
      layerVisibility.faction = visible;
      syncLayerToMap(factionLayer, visible);
    } else if (scope === 'killzones') {
      layerVisibility.killzones = visible;
      syncLayerToMap(killZoneLayer, visible);
      syncLayerToMap(killLabelLayer, visible);
    } else if (scope === 'livoniapvp') {
      layerVisibility.livoniapvp = visible;
      syncLayerToMap(livoniaHotspotLayer, visible);
      syncLayerToMap(livoniaObjectiveLayer, visible);
    } else if (scope === 'livoniaheatmap') {
      layerVisibility.livoniaheatmap = visible;
      syncLayerToMap(livoniaHeatmapLayer, visible);
    }
    else if (scope === 'chernaruspve') {
      layerVisibility.chernaruspve = visible;
      syncLayerToMap(chernarusExpeditionLayer, visible);
    } else if (scope === 'chernarusheatmap') {
      layerVisibility.chernarusheatmap = visible;
      syncLayerToMap(chernarusHeatmapLayer, visible);
    }
  });

  markerScope?.addEventListener('change', syncMarkerScopeOptions);
  root.querySelectorAll('[data-map-intel-open-marker]').forEach((button) => button.addEventListener('click', () => openMarkerEditor(null, button.dataset.mapIntelOpenMarker || null)));
  root.querySelector('[data-map-intel-marker-cancel]')?.addEventListener('click', closeMarkerEditor);
  root.querySelector('[data-map-intel-use-selection]')?.addEventListener('click', () => {
    const selection = window.WWZDashboardMap.getSelection?.();
    if (!selection) { setStatus('Click the map to select coordinates first.', 'error'); return; }
    markerX.value = Number(selection.x).toFixed(1);
    markerZ.value = Number(selection.z).toFixed(1);
  });

  markerForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const editing = Boolean(markerId.value);
      const payload = {
        action: editing ? 'update' : 'create', marker_id: editing ? Number(markerId.value) : undefined,
        scope: markerScope.value, target_id: markerScope.value === 'group' ? Number(markerTarget.value) : state.faction?.faction_id,
        name: markerName.value, category: markerCategory.value, description: markerDescription.value,
        x: Number(markerX.value), z: Number(markerZ.value)
      };
      await performMarkerAction(payload);
      closeMarkerEditor();
    } catch (error) { setStatus(error.message, 'error'); }
  });

  markerList?.addEventListener('click', async (event) => {
    const focus = event.target.closest('[data-intel-focus]');
    const edit = event.target.closest('[data-intel-edit]');
    const remove = event.target.closest('[data-intel-delete]');
    const id = Number((focus || edit || remove)?.dataset.intelFocus || (focus || edit || remove)?.dataset.intelEdit || (focus || edit || remove)?.dataset.intelDelete);
    if (!id) return;
    const marker = state.shared_markers.find((item) => Number(item.marker_id) === id);
    if (!marker) return;
    if (focus) window.WWZDashboardMap.focus?.(marker.x, marker.z, 8);
    if (edit) openMarkerEditor(marker);
    if (remove && window.confirm(`Delete shared marker “${marker.name}”?`)) {
      try { await performMarkerAction({ action: 'delete', marker_id: id }); } catch (error) { setStatus(error.message, 'error'); }
    }
  });

  groupCreateForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(groupCreateForm);
    try { await performGroupAction({ action: 'create', name: data.get('name'), colour: data.get('colour') }); groupCreateForm.reset(); } catch (error) { setStatus(error.message, 'error'); }
  });
  groupJoinForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(groupJoinForm);
    try { await performGroupAction({ action: 'join', invite_code: data.get('invite_code') }); groupJoinForm.reset(); } catch (error) { setStatus(error.message, 'error'); }
  });

  groupList?.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const groupId = Number(button.dataset.groupId || button.dataset.groupInvite || button.dataset.groupEdit || button.dataset.groupDelete || button.dataset.groupLeave);
    const group = state.groups.find((item) => Number(item.group_id) === groupId);
    if (!group) return;
    try {
      if (button.dataset.groupInvite) await performGroupAction({ action: 'regenerate_invite', group_id: groupId });
      else if (button.dataset.groupEdit) {
        const name = window.prompt('Map group name', group.name); if (name === null) return;
        const colour = window.prompt('Group colour (hex)', group.colour); if (colour === null) return;
        await performGroupAction({ action: 'update', group_id: groupId, name, colour });
      } else if (button.dataset.groupDelete && window.confirm(`Delete “${group.name}” and all of its shared map markers?`)) await performGroupAction({ action: 'delete', group_id: groupId });
      else if (button.dataset.groupLeave && window.confirm(`Leave “${group.name}”?`)) await performGroupAction({ action: 'leave', group_id: groupId });
      else if (button.dataset.groupRole) await performGroupAction({ action: 'set_role', group_id: groupId, member_key: button.dataset.groupRole, role: button.dataset.role });
      else if (button.dataset.groupRemove && window.confirm('Remove this member from the map group?')) await performGroupAction({ action: 'remove_member', group_id: groupId, member_key: button.dataset.groupRemove });
      else if (button.dataset.groupTransfer && window.confirm('Transfer ownership of this map group to this member? You will become a moderator.')) await performGroupAction({ action: 'transfer_owner', group_id: groupId, member_key: button.dataset.groupTransfer });
    } catch (error) { setStatus(error.message, 'error'); }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { window.clearTimeout(timer); timer = null; return; }
    if (active && Date.now() - lastFetchAt >= RESUME_REFRESH_AGE_MS) fetchState({ force: true }).finally(schedule);
    else schedule();
  });
  window.addEventListener('wwz:viewchange', (event) => {
    if (event.detail?.view === 'map') activate(); else deactivate();
  });
  window.addEventListener('wwz:serverchange', () => {
    clearLayers(); lastFingerprint = ''; state = { authenticated: false, groups: [], faction: null, shared_markers: [], kill_zones: [] };
    if (active) window.setTimeout(() => activate(), 0);
  });
  window.addEventListener('wwz:accesschange', () => {
    lastFingerprint = '';
    if (active) fetchState({ force: true });
  });

  const mapPanel = document.querySelector('[data-view-panel="map"]');
  if (mapPanel && !mapPanel.hidden) activate();
  window.__wwzMapIntelligenceReady = true;
  window.WWZMapIntelligence = Object.freeze({ activate, refresh: () => fetchState({ force: true }) });
})();
