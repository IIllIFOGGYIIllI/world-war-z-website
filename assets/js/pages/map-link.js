(() => {
  'use strict';

  const API_BASE = 'https://world-war-z.up.railway.app';
  const params = new URLSearchParams(window.location.search);
  const mapKey = String(params.get('map') || 'chernarus').trim().toLowerCase();
  const serverKey = String(params.get('server') || (mapKey === 'livonia' ? 'livonia' : 'world-war-z')).trim().toLowerCase();
  const viewMode = String(params.get('view') || '').trim().toLowerCase();
  const requestedMarker = String(params.get('marker') || '').trim().slice(0, 80);
  const requestedPoi = String(params.get('poi') || '').trim().slice(0, 100);
  const requestedX = Number(params.get('x'));
  const requestedZ = Number(params.get('z'));
  const hasRequestedCoordinates = Number.isFinite(requestedX) && Number.isFinite(requestedZ);

  const STATIC_CHERNARUS_POIS = Object.freeze([
    { id:'public-radio-zenit-fallback', name:'Radio Zenit Trader', category:'Trader', description:'World War Z public trader.', colour:'amber', x:8143, z:9156, fallback:true },
    { id:'public-cherno-builder-shed', name:'Chernogorsk Builder Shed', category:'Builder Shed', description:'Public Chernarus builder shed.', colour:'green', x:5726, z:3136 },
    { id:'public-pustoshka-builder-shed', name:'Pustoshka Builder Shed', category:'Builder Shed', description:'Public Chernarus builder shed.', colour:'green', x:3022, z:7496 },
    { id:'public-stary-sobor-builder-shed', name:'Stary Sobor Builder Shed', category:'Builder Shed', description:'Public Chernarus builder shed.', colour:'green', x:5949, z:7565 },
    { id:'public-black-lake-builder-shed', name:'Black Lake Builder Shed', category:'Builder Shed', description:'Public Chernarus builder shed.', colour:'green', x:13518, z:11867 },
    { id:'public-tisy-bunker', name:'Tisy Bunker', category:'Bunker', description:'Public Chernarus bunker.', colour:'red', x:1329, z:14482 },
    { id:'public-nwaf-bunker', name:'NWAF Bunker', category:'Bunker', description:'Public Chernarus bunker.', colour:'red', x:4483, z:10377 },
    { id:'public-rify-bunker', name:'Rify Bunker', category:'Bunker', description:'Public Chernarus bunker.', colour:'red', x:13847, z:11196 }
  ]);
  const COLOURS = { red:'#d52b1e', green:'#3ba55d', blue:'#3498db', amber:'#f0a500', white:'#ededed' };

  const container = document.getElementById('wwz-detection-map');
  const loading = document.querySelector('[data-marker-loading]');
  const title = document.querySelector('[data-marker-title]');
  const mapLabel = document.querySelector('[data-marker-map]');
  const nameLabel = document.querySelector('[data-marker-name]');
  const coordinateLabel = document.querySelector('[data-marker-coordinates]');
  const copyButton = document.querySelector('[data-copy-coordinates]');
  const poiList = document.querySelector('[data-public-poi-list]');
  const status = document.querySelector('[data-map-hub-status]');
  const poisToggle = document.querySelector('[data-layer-pois]');
  const zonesToggle = document.querySelector('[data-layer-zones]');
  const roadsToggle = document.querySelector('[data-layer-roads]');
  const dashboardLink = document.querySelector('[data-dashboard-map-link]');
  let selected = null;

  const fail = (message) => {
    if (!loading) return;
    loading.hidden = false;
    loading.classList.add('error');
    const strong = loading.querySelector('strong');
    if (strong) strong.textContent = message;
  };
  const clean = (value) => ' '.concat(String(value || '').trim()).trim().replace(/\s+/g, ' ');
  const keyFor = (poi) => `${clean(poi.name).toLowerCase()}|${Math.round(Number(poi.x))}|${Math.round(Number(poi.z))}`;
  const validPoi = (raw) => {
    const x = Number(raw?.x), z = Number(raw?.z);
    if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
    return {
      id: clean(raw?.id || `poi-${x}-${z}`).slice(0,100), name:clean(raw?.name || 'Public marker').slice(0,80),
      category:clean(raw?.category || 'Landmark').slice(0,40), description:clean(raw?.description || 'Public server map marker.').slice(0,240),
      colour:String(raw?.colour || 'red').toLowerCase(), x, z, fallback:Boolean(raw?.fallback)
    };
  };

  if (!container || !window.L || !window.WWZMap) { fail('The WWZ map runtime could not be loaded.'); return; }
  if (!['chernarus','livonia'].includes(mapKey)) { fail('This link does not contain a valid WWZ map.'); return; }
  const config = window.WWZMap.getConfig(mapKey);
  if (hasRequestedCoordinates && (requestedX < 0 || requestedZ < 0 || requestedX > config.mapMetres || requestedZ > config.mapMetres)) {
    fail(`This position is outside the ${config.name} map bounds.`); return;
  }

  document.title = `WWZ ${config.name} Interactive Map`;
  if (title) title.textContent = hasRequestedCoordinates && requestedMarker ? requestedMarker : `${config.name} Interactive Map`;
  if (mapLabel) mapLabel.textContent = `${config.name} · WWZ public map hub`;
  if (dashboardLink) {
    const centre = mapKey === 'livonia' ? 6400 : 7680;
    dashboardLink.href = `dashboard.html?server=${encodeURIComponent(serverKey)}&map=${encodeURIComponent(mapKey)}&x=${centre.toFixed(1)}&z=${centre.toFixed(1)}&marker=${encodeURIComponent('WWZ Map Hub')}&source=map-hub#map`;
  }

  const map = window.WWZMap.create(container, {
    mapKey, mode:'full', selectable:false, copyOnSelect:false, roadsVisible:true, trailsVisible:true, gridVisible:false,
    loadingElement:loading,
    zoomInButton:document.querySelector('[data-marker-zoom-in]'), zoomOutButton:document.querySelector('[data-marker-zoom-out]'),
    resetButton:document.querySelector('[data-marker-reset]'), fullscreenButton:document.querySelector('[data-marker-fullscreen]'), fullscreenTarget:container
  });
  const poiLayer = window.L.layerGroup().addTo(map.map);
  const zoneLayer = window.L.layerGroup().addTo(map.map);
  const selectionLayer = window.L.layerGroup().addTo(map.map);
  const markerById = new Map();

  const selectPoi = (poi, { focus=true } = {}) => {
    selected = poi;
    if (nameLabel) nameLabel.textContent = poi.name;
    if (coordinateLabel) coordinateLabel.textContent = `${poi.category} · X ${poi.x.toFixed(1)} · Z ${poi.z.toFixed(1)}`;
    if (copyButton) copyButton.disabled = false;
    document.querySelectorAll('[data-poi-id]').forEach((button) => button.classList.toggle('active', button.dataset.poiId === poi.id));
    markerById.forEach((marker,id) => marker?._wwzSetSelected?.(id === poi.id));
    if (focus) map.focus(poi.x, poi.z, Math.max(7, map.map.getZoom()));
  };

  const mergePois = (dynamic) => {
    const source = [...(Array.isArray(dynamic) ? dynamic : []), ...(mapKey === 'chernarus' ? STATIC_CHERNARUS_POIS : [])];
    const merged = [], seen = new Set();
    for (const raw of source) {
      const poi = validPoi(raw); if (!poi) continue;
      const key = keyFor(poi); if (seen.has(key)) continue;
      // A database-backed marker takes precedence over a same-location fallback.
      seen.add(key); merged.push(poi);
    }
    return merged.sort((a,b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  };

  const renderPois = (pois) => {
    poiLayer.clearLayers(); markerById.clear();
    const fragment = document.createDocumentFragment(); let lastCategory = '';
    for (const poi of pois) {
      if (poi.category !== lastCategory) {
        const heading = document.createElement('div'); heading.className='hub-category'; heading.textContent=poi.category; fragment.append(heading); lastCategory=poi.category;
      }
      const button = document.createElement('button'); button.type='button'; button.className='hub-poi'; button.dataset.poiId=poi.id;
      const strong=document.createElement('strong'); strong.textContent=poi.name; const small=document.createElement('small'); small.textContent=`X ${poi.x.toFixed(0)} · Z ${poi.z.toFixed(0)}`;
      button.append(strong,small); button.addEventListener('click',()=>selectPoi(poi)); fragment.append(button);
      const marker = map.addPoi(poi,{layer:poiLayer,colour:COLOURS[poi.colour]||COLOURS.red,showLabel:true,onClick:()=>selectPoi(poi)});
      if (marker) markerById.set(poi.id,marker);
    }
    poiList?.replaceChildren(fragment);
    if (!pois.length && poiList) poiList.textContent='No public POIs are currently published for this map.';
    return pois;
  };

  const renderZones = (zones) => {
    zoneLayer.clearLayers(); let count=0;
    for (const zone of Array.isArray(zones) ? zones : []) {
      const colour = String(zone?.colour || '#d52b1e'); const shape=String(zone?.shape || '').toLowerCase(); let layer=null;
      if (shape === 'polygon') {
        const points=(Array.isArray(zone.points)?zone.points:[]).map(p=>window.WWZMap.worldToLeaflet([Number(p.x),Number(p.z)],mapKey)).filter(Boolean);
        if (points.length>=3) layer=window.L.polygon(points,{color:colour,weight:2,fillColor:colour,fillOpacity:.13});
      } else if (shape === 'circle') {
        const center=window.WWZMap.worldToLeaflet([Number(zone.center_x),Number(zone.center_z)],mapKey);
        if (center && Number.isFinite(Number(zone.radius))) {
          const scale=config.mapUnits/config.mapMetres; layer=window.L.circle(center,{radius:Number(zone.radius)*scale,color:colour,weight:2,fillColor:colour,fillOpacity:.13});
        }
      }
      if (layer) { layer.bindTooltip(clean(zone.name || 'PvP / Kill Zone'),{sticky:true}); zoneLayer.addLayer(layer); count+=1; }
    }
    return count;
  };

  const fetchJson = async (path) => {
    const response=await fetch(`${API_BASE}${path}`,{headers:{Accept:'application/json','X-WWZ-Server':serverKey},cache:'no-store',referrerPolicy:'no-referrer'});
    const payload=await response.json().catch(()=>({})); if(!response.ok||payload.status!=='ok') throw new Error(payload.message||'Live map data unavailable.'); return payload;
  };

  Promise.allSettled([fetchJson('/api/map/markers'),fetchJson('/api/map/intelligence')]).then((results)=>{
    const markerPayload=results[0].status==='fulfilled'?results[0].value:null;
    const intelPayload=results[1].status==='fulfilled'?results[1].value:null;
    const pois=renderPois(mergePois(markerPayload?.markers)); const zoneCount=renderZones(intelPayload?.kill_zones);
    if (status) status.textContent=`${pois.length} public POI${pois.length===1?'':'s'} · ${zoneCount} public PvP/kill-zone overlay${zoneCount===1?'':'s'} · live map`;
    const target = requestedPoi ? pois.find(p=>p.id===requestedPoi || p.name.toLowerCase()===requestedPoi.toLowerCase()) : null;
    if (target) selectPoi(target,{focus:true});
    else if (hasRequestedCoordinates) {
      const poi={id:'discord-location',name:requestedMarker||'Discord Location',category:String(params.get('source')||'Discord location').startsWith('zone-')?'Zone detection':'Discord location',description:'Opened directly from a World War Z Discord coordinate link.',x:requestedX,z:requestedZ,colour:'red'};
      selectionLayer.clearLayers(); map.addPoi(poi,{layer:selectionLayer,colour:COLOURS.red,selected:true,showLabel:true,onClick:()=>selectPoi(poi)}); selectPoi(poi,{focus:true});
    } else if (viewMode !== 'hub' && pois.length) selectPoi(pois[0],{focus:false});
    window.setTimeout(()=>map.invalidateSize(),80);
  });

  poisToggle?.addEventListener('change',()=>{ if(poisToggle.checked) poiLayer.addTo(map.map); else poiLayer.remove(); });
  zonesToggle?.addEventListener('change',()=>{ if(zonesToggle.checked) zoneLayer.addTo(map.map); else zoneLayer.remove(); });
  roadsToggle?.addEventListener('change',()=>{ map.setRoadsVisible(roadsToggle.checked); map.setTrailsVisible(roadsToggle.checked); });

  copyButton?.addEventListener('click', async()=>{
    if(!selected) return; const text=`${selected.x.toFixed(1)}, ${selected.z.toFixed(1)}`; let copied=false;
    try { await navigator.clipboard.writeText(text); copied=true; } catch { const input=document.createElement('textarea'); input.value=text; input.setAttribute('readonly',''); input.style.position='fixed'; input.style.opacity='0'; document.body.append(input); input.select(); copied=document.execCommand('copy'); input.remove(); }
    const original='Copy X/Z'; copyButton.textContent=copied?'Copied':'Copy failed'; window.setTimeout(()=>{copyButton.textContent=original;},1400);
  });
})();
