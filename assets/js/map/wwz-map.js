(() => {
  'use strict';

  const MIN_ZOOM = 0;
  const MAX_NATIVE_ZOOM = 6;
  // Satellite imagery is native through zoom 6. Allow two additional levels
  // for precise coordinate placement without excessively enlarging the tiles.
  const MAX_ZOOM = 8;
  const PRODUCTION_WIDTH_MULTIPLIER = 1.80;
  const MAP_CONFIGS = Object.freeze({
    chernarus: Object.freeze({
      key: 'chernarus',
      name: 'Chernarus',
      mapMetres: 15360,
      mapUnits: 240,
      satelliteUrl: 'assets/maps/chernarus/tiles/z{z}/{y}/{x}.webp?v=1.22.90',
      roadUrl: 'assets/maps/chernarus/roads.geojson?v=1.22.90',
      labelUrl: 'assets/maps/chernarus/labels.json?v=1.22.90',
      roadOrder: ['paved_primary', 'paved_secondary', 'bridge', 'paved_local', 'city', 'gravel', 'paved_other', 'mud', 'trail'],
      roadGroups: Object.freeze({
        paved: ['paved_primary', 'paved_secondary', 'bridge', 'paved_local', 'city', 'paved_other'],
        gravel: ['gravel'],
        mud: ['mud'],
        trail: ['trail']
      }),
      trailGroups: ['trail'],
      roadStyles: Object.freeze({
        paved_primary:   { label: 'Primary paved',   minZoom: 0, width: 3.40, colour: '#f2ead8', casing: '#393224', opacity: 0.98 },
        paved_secondary: { label: 'Secondary paved', minZoom: 0, width: 3.00, colour: '#ddc386', casing: '#393224', opacity: 0.96 },
        paved_local:     { label: 'Local paved',     minZoom: 0, width: 2.50, colour: '#d79a62', casing: '#34312a', opacity: 0.94 },
        city:            { label: 'Town / city',     minZoom: 0, width: 2.40, colour: '#c7b59a', casing: '#34312a', opacity: 0.92 },
        bridge:          { label: 'Bridge',          minZoom: 0, width: 3.60, colour: '#f1e5b8', casing: '#2d2921', opacity: 1.00 },
        paved_other:     { label: 'Other paved',     minZoom: 0, width: 2.20, colour: '#aaa9a1', casing: '#33312b', opacity: 0.90 },
        gravel:          { label: 'Gravel',          minZoom: 0, width: 2.10, colour: '#b99a72', casing: '#40392c', opacity: 0.88 },
        mud:             { label: 'Dirt / mud',      minZoom: 0, width: 1.80, colour: '#936d4c', casing: '#3b3024', opacity: 0.84 },
        trail:           { label: 'Trails / paths',  minZoom: 0, width: 1.50, colour: '#8d9661', casing: '#353128', opacity: 0.72 }
      })
    }),
    badlands: Object.freeze({
      key: 'badlands',
      name: 'Badlands / Nasdara',
      mapMetres: 16384,
      mapUnits: 240,
      // Exact north-up image transform: pixel X=x/4, pixel Y=(16384-z)/4.
      satelliteImageUrl: 'assets/maps/nasdara/satellite.webp?v=wwz-nasdara-1',
      roadBinaryUrl: 'assets/maps/nasdara/roads.bin?v=wwz-nasdara-1',
      structureUrl: 'assets/maps/nasdara/objects.bin?v=wwz-nasdara-1',
      structureClassUrl: 'assets/maps/nasdara/object-classes.json?v=wwz-nasdara-1',
      structureAtlasUrl: 'assets/maps/nasdara/building-atlas.json?v=wwz-roof-art-2',
      labelUrl: 'assets/maps/nasdara/labels.json?v=wwz-nasdara-1',
      roadOrder: ['nasdara_paved','nasdara_dirt'],
      roadGroups: Object.freeze({paved:['nasdara_paved'],mud:['nasdara_dirt']}),
      trailGroups:['nasdara_dirt'],
      roadStyles:Object.freeze({
        nasdara_paved:{label:'Paved roads',minZoom:0,width:3.9,colour:'#f2d35b',casing:'#59451f',opacity:.98},
        nasdara_dirt:{label:'Dirt roads',minZoom:0,width:2.2,colour:'#c7ad86',casing:'#4a3a29',opacity:.88}
      })
    }),
    livonia: Object.freeze({
      key: 'livonia',
      name: 'Livonia',
      mapMetres: 12800,
      mapUnits: 240,
      satelliteUrl: 'assets/maps/livonia/tiles/{z}/{x}/{y}.webp?v=1.22.90',
      roadUrl: 'assets/maps/livonia/roads.geojson?v=1.22.90',
      labelUrl: 'assets/maps/livonia/labels.json?v=1.22.90',
      roadOrder: ['asf1enoch', 'asf2enoch', 'bridge', 'taxiway', 'mudenoch', 'quarryenoch', 'path_dirt', 'path_rock', 'centerline'],
      roadGroups: Object.freeze({
        paved: ['asf1enoch', 'asf2enoch', 'bridge', 'taxiway', 'centerline'],
        gravel: ['quarryenoch'],
        mud: ['mudenoch'],
        trail: ['path_dirt', 'path_rock']
      }),
      trailGroups: ['path_dirt', 'path_rock'],
      roadStyles: Object.freeze({
        asf1enoch:  { label: 'Primary paved',   minZoom: 0, width: 3.70, colour: '#fff5cf', casing: '#483d2d', opacity: 0.98 },
        asf2enoch:  { label: 'Secondary paved', minZoom: 0, width: 3.00, colour: '#eadcae', casing: '#514735', opacity: 0.96 },
        mudenoch:   { label: 'Mud road',        minZoom: 1, width: 2.30, colour: '#b89b73', casing: '#514638', opacity: 0.90 },
        quarryenoch:{ label: 'Quarry road',     minZoom: 1, width: 2.20, colour: '#c8b58b', casing: '#51483c', opacity: 0.90 },
        path_dirt:  { label: 'Dirt paths',      minZoom: 2, width: 1.70, colour: '#997c58', casing: '#483d32', opacity: 0.82, dashArray: '6 4' },
        path_rock:  { label: 'Rock paths',      minZoom: 2, width: 1.60, colour: '#827768', casing: '#403b34', opacity: 0.78, dashArray: '4 4' },
        bridge:     { label: 'Bridge',          minZoom: 0, width: 4.30, colour: '#fff9dc', casing: '#302b23', opacity: 1.00 },
        taxiway:    { label: 'Taxiway',         minZoom: 1, width: 3.70, colour: '#d9d9d9', casing: '#454545', opacity: 0.92 },
        centerline: { label: 'Centerline',      minZoom: 0, width: 1.80, colour: '#ff40ff', casing: '#40223f', opacity: 0.86, dashArray: '5 4' }
      })
    })
  });

  // WWZ map icon IDs are shared by editor, public API and renderer.
  // Never derive an asset path from unvalidated marker input.
  const MARKER_ICON_OPTIONS = Object.freeze([
    Object.freeze({ id: 'default', label: 'Standard pin' }),
    Object.freeze({ id: 'vehicle-repair', label: 'Vehicle repair centre' }),
    Object.freeze({ id: 'mechanic-garage', label: 'Mechanic garage' }),
    Object.freeze({ id: 'vehicle-rental', label: 'Vehicle rental' }),
    Object.freeze({ id: 'tow-service', label: 'Tow service' }),
    Object.freeze({ id: 'fuel-station', label: 'Fuel station' }),
    Object.freeze({ id: 'vehicle-parts', label: 'Vehicle parts' }),
    Object.freeze({ id: 'trader', label: 'Trader' }),
    Object.freeze({ id: 'builder-shed', label: 'Builder shed' }),
    Object.freeze({ id: 'medical', label: 'Medical' }),
    Object.freeze({ id: 'police', label: 'Police' }),
    Object.freeze({ id: 'fire-station', label: 'Fire station' }),
    Object.freeze({ id: 'water-tower', label: 'Water tower' }),
    Object.freeze({ id: 'radio-building', label: 'Radio building' })
  ]);
  const MARKER_ICON_IDS = new Set(MARKER_ICON_OPTIONS.map(option=>option.id));
  const normaliseMarkerIcon = value => MARKER_ICON_IDS.has(String(value||'default').toLowerCase())
    ? String(value||'default').toLowerCase() : 'default';
  const markerIconUrl = value => {
    const id=normaliseMarkerIcon(value);
    return id==='default'?null:`assets/map-icons/${id}.svg`;
  };

  const roadGeometryPromises = new Map();
  const instances = new Set();

  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const formatCoordinate = (value, decimals = 1) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return '—';
    return number.toFixed(decimals);
  };

  const getConfig = (mapKey = 'chernarus') => MAP_CONFIGS[String(mapKey || '').toLowerCase()] || null;

  const worldToLeaflet = (coordinate, mapKey = 'chernarus') => {
    const config = getConfig(mapKey);
    if (!config) return null;
    const scale = config.mapUnits / config.mapMetres;
    const x = Number(coordinate?.[0]);
    const z = Number(coordinate?.[1]);
    if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
    return [(z - config.mapMetres) * scale, x * scale];
  };

  const leafletToWorld = (latlng, mapKey = 'chernarus') => {
    const config = getConfig(mapKey);
    if (!config) return null;
    const scale = config.mapUnits / config.mapMetres;
    const lat = Number(latlng?.lat);
    const lng = Number(latlng?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return {
      x: clamp(lng / scale, 0, config.mapMetres),
      z: clamp((lat / scale) + config.mapMetres, 0, config.mapMetres)
    };
  };

  const normaliseRoadGroup = (rawValue, roadStyles) => {
    const value = String(rawValue || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    if (roadStyles[value]) return value;
    if (value.includes('primary')) return 'paved_primary';
    if (value.includes('secondary')) return 'paved_secondary';
    if (value.includes('local')) return 'paved_local';
    if (value.includes('city') || value.includes('town')) return 'city';
    if (value.includes('bridge')) return 'bridge';
    if (value.includes('gravel') || value.includes('grav')) return 'gravel';
    if (value.includes('mud') || value.includes('dirt')) return 'mud';
    if (value.includes('trail') || value.includes('path')) return 'trail';
    if (value.includes('paved') || value.includes('asphalt') || value.includes('taxiway')) return 'paved_other';
    return null;
  };

  const featureGroup = (feature, roadStyles) => {
    const properties = feature?.properties || {};
    const candidates = [
      properties.roadClass,
      properties.group,
      properties.road_group,
      properties.production_group,
      properties.category,
      properties.class,
      properties.style,
      properties.surface,
      properties.type,
      feature?.id
    ];
    for (const candidate of candidates) {
      const group = normaliseRoadGroup(candidate, roadStyles);
      if (group) return group;
    }
    return null;
  };

  const appendGeometry = (geometry, target, project) => {
    if (!geometry) return;
    if (Array.isArray(geometry)) {
      if (!geometry.length) return;
      const first = geometry[0];
      if (Array.isArray(first) && typeof first[0] === 'number') {
        appendGeometry({ type: 'LineString', coordinates: geometry }, target, project);
      } else {
        geometry.forEach((item) => appendGeometry(item, target, project));
      }
      return;
    }
    if (geometry.type === 'LineString') {
      const line = geometry.coordinates
        .map(project)
        .filter(Boolean);
      if (line.length >= 2) target.push(line);
      return;
    }
    if (geometry.type === 'MultiLineString') {
      geometry.coordinates.forEach((coordinates) => appendGeometry({ type: 'LineString', coordinates }, target, project));
      return;
    }
    if (geometry.type === 'GeometryCollection') {
      (geometry.geometries || []).forEach((item) => appendGeometry(item, target, project));
    }
  };

  const normaliseRoadDataset = (data, config) => {
    const groups = Object.fromEntries(config.roadOrder.map((name) => [name, []]));
    const project = (coordinate) => worldToLeaflet(coordinate, config.key);

    if (data?.groups && typeof data.groups === 'object' && !Array.isArray(data.groups)) {
      Object.entries(data.groups).forEach(([rawGroup, geometry]) => {
        const group = normaliseRoadGroup(rawGroup, config.roadStyles);
        if (!group) return;
        if (geometry?.type === 'Feature') appendGeometry(geometry.geometry, groups[group], project);
        else appendGeometry(geometry?.geometry || geometry, groups[group], project);
      });
      return groups;
    }

    const features = data?.type === 'FeatureCollection'
      ? data.features || []
      : (data?.type === 'Feature' ? [data] : []);

    features.forEach((feature) => {
      const group = featureGroup(feature, config.roadStyles);
      if (!group) return;
      appendGeometry(feature.geometry, groups[group], project);
    });

    return groups;
  };

  const parseNasdaraRoadBinary = (buffer,config) => {
    const view=new DataView(buffer);
    if(view.byteLength<16||String.fromCharCode(...new Uint8Array(buffer,0,8))!=='DVMROAD1')
      throw Error('Invalid Nasdara road header');
    const count=view.getUint32(8,true),world=view.getFloat32(12,true);
    if(count!==47236||world!==16384||view.byteLength!==16+count*20)
      throw Error('Unexpected Nasdara road source or calibration');
    const groups={nasdara_paved:[],nasdara_dirt:[]};
    for(let i=0;i<count;i++){
      const at=16+i*20,x=view.getFloat32(at,true),z=view.getFloat32(at+4,true),
        ex=view.getFloat32(at+8,true),ez=view.getFloat32(at+12,true),kind=view.getUint8(at+16);
      if([x,z,ex,ez].some(v=>!Number.isFinite(v)||v< -2||v>16386)||kind>1)
        throw Error('Invalid Nasdara road coordinate');
      const first=worldToLeaflet([x,z],config.key),last=worldToLeaflet([ex,ez],config.key);
      groups[kind===0?'nasdara_paved':'nasdara_dirt'].push([first,last]);
    }
    return groups;
  };

  const loadRoadGeometry = (config) => {
    if (roadGeometryPromises.has(config.key)) return roadGeometryPromises.get(config.key);
    const binary=Boolean(config.roadBinaryUrl);
    const promise = fetch(binary?config.roadBinaryUrl:config.roadUrl, {
      method: 'GET',
      headers: { Accept: binary?'application/octet-stream':'application/geo+json, application/json' },
      cache: 'force-cache'
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Road data returned HTTP ${response.status}.`);
        return binary?response.arrayBuffer():response.json();
      })
      .then((data) => binary?parseNasdaraRoadBinary(data,config):normaliseRoadDataset(data,config))
      .catch((error) => {
        roadGeometryPromises.delete(config.key);
        throw error;
      });
    roadGeometryPromises.set(config.key, promise);
    return promise;
  };

  const zoomWidthProfile = (zoom) => {
    const z = Number(zoom);
    if (!Number.isFinite(z) || z <= 0) return 0.38;
    if (z <= 1) return 0.45;
    if (z <= 2) return 0.55;
    if (z <= 3) return 0.68;
    if (z <= 4) return 0.82;
    if (z <= 5) return 0.96;
    if (z <= 6) return 1.10;
    return Math.min(2.45, 1.10 + ((z - 6) * 0.18));
  };

  const roadClassOpacity = (config, group, zoom) => {
    if (config.key !== 'chernarus') return 1;
    if (zoom <= 1) {
      if (group === 'trail') return 0.30;
      if (group === 'mud') return 0.42;
      if (group === 'gravel') return 0.58;
      if (group === 'paved_local') return 0.72;
      return 1;
    }
    if (zoom <= 3) {
      if (group === 'trail') return 0.55;
      if (group === 'mud') return 0.68;
      if (group === 'gravel') return 0.82;
    }
    return 1;
  };

  const fallbackCopy = (text) => {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.append(field);
    field.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch { copied = false; }
    field.remove();
    return copied;
  };

  const copyText = async (text) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}
    return fallbackCopy(text);
  };

  const create = (container, options = {}) => {
    if (!container) throw new Error('A DayZ map container is required.');
    const config = getConfig(options.mapKey || window.WWZServerContext?.getMapKey?.());
    if (!config) throw new Error('The selected DayZ world is not configured. No other world imagery will be substituted.');
    if (!window.L?.map) throw new Error('Leaflet is not available.');
    if (container._wwzMapInstance) return container._wwzMapInstance;

    const L = window.L;
    const MAP_METRES = config.mapMetres;
    const MAP_UNITS = config.mapUnits;
    const ROAD_ORDER = config.roadOrder;
    const ROAD_STYLES = config.roadStyles;
    const trailGroups = new Set(config.trailGroups);
    const projectWorld = (coordinate) => worldToLeaflet(coordinate, config.key);
    const projectLeaflet = (latlng) => leafletToWorld(latlng, config.key);
    const bounds = L.latLngBounds([-MAP_UNITS, 0], [0, MAP_UNITS]);
    const map = L.map(container, {
      crs: L.CRS.Simple,
      minZoom: options.minZoom ?? MIN_ZOOM,
      maxZoom: options.maxZoom ?? MAX_ZOOM,
      zoomSnap: options.zoomSnap ?? 0.25,
      zoomDelta: options.zoomDelta ?? 0.5,
      attributionControl: false,
      zoomControl: false,
      preferCanvas: true,
      maxBounds: options.maxBounds === false ? null : bounds.pad(0.04),
      maxBoundsViscosity: 0.85,
      boxZoom: true,
      keyboard: true,
      tap: true
    });

    container.classList.add(
      'wwz-chernarus-map',
      'wwz-dayz-map',
      `wwz-${config.key}-map`,
      `wwz-chernarus-map--${options.mode || 'picker'}`
    );
    container.dataset.mapKey = config.key;
    // For Nasdara, the obsolete Gravel/Mud/Trails controls do not match the
    // native road dataset (only paved/dirt exist). Move all layer switches
    // into the same collapsible menu, leaving only navigation over the image.
    const navControls=container.querySelector('.map-controls');
    const layerPanel=container.querySelector('.map-visual-controls');
    if(config.key==='badlands'&&navControls&&layerPanel){
      const section=document.createElement('div');
      section.className='wwz-nasdara-layer-options';
      const caption=document.createElement('div');
      caption.className='wwz-nasdara-layer-heading';
      caption.textContent='Map layers';
      section.appendChild(caption);
      navControls.querySelectorAll('.map-road-toggle, .map-layer-button, [data-map-grid-toggle]').forEach(button=>{
        if(button.matches('[data-map-road-group="gravel"], [data-map-trail-toggle]')){
          button.hidden=true;
          button.classList.add('wwz-nasdara-not-supported');
          return;
        }
        if(button.matches('[data-map-road-group="mud"]')){
          button.textContent='Dirt roads';
          button.setAttribute('aria-label','Toggle dirt roads');
        }
        if(button.matches('[data-map-road-group="paved"]'))button.textContent='Paved roads';
        section.appendChild(button);
      });
      if(section.querySelector('button')){
        const buildings=document.createElement('button');
        buildings.type='button';buildings.className='map-layer-button active';
        buildings.textContent='Buildings';buildings.dataset.wwzBuildings='true';
        buildings.setAttribute('aria-pressed','true');
        buildings.setAttribute('aria-label','Toggle native building pictures and outlines');
        buildings.title='Zoom in for true Nasdara footprints (3.8+) and roof artwork (5.5+)';
        buildings.addEventListener('click',()=>{
          const enabled=buildings.getAttribute('aria-pressed')!=='true';
          buildings.setAttribute('aria-pressed',String(enabled));
          buildings.classList.toggle('active',enabled);
          container._wwzMapInstance?.setStructuresVisible(enabled);
        });
        section.appendChild(buildings);
        const detailState=document.createElement('span');
        detailState.className='wwz-nasdara-building-status';
        detailState.dataset.wwzBuildingStats='true';
        detailState.textContent='Buildings load from zoom 3.8 · roofs from 5.5';
        detailState.setAttribute('role','status');
        section.appendChild(detailState);
        layerPanel.appendChild(section);
        layerPanel.classList.add('wwz-nasdara-layers-panel');
      }
    }
    // Collapsible map controls keep terrain visible on both desktop and phone.
    const visualPanel=container.querySelector('.map-visual-controls');
    if(visualPanel&&!visualPanel.querySelector('.wwz-map-layer-disclosure')){
      const title=document.createElement('button');
      title.type='button';title.className='wwz-map-layer-disclosure';
      title.setAttribute('aria-expanded','false');
      title.setAttribute('aria-label','Show map appearance controls');
      title.textContent='Layers & opacity';
      visualPanel.prepend(title);
      visualPanel.classList.add('wwz-layers-collapsed');
      title.addEventListener('click',()=>{
        const closed=visualPanel.classList.toggle('wwz-layers-collapsed');
        title.setAttribute('aria-expanded',String(!closed));
        title.setAttribute('aria-label',closed?'Show map appearance controls':'Hide map appearance controls');
      });
    }
    // Leaflet treats CRS.Simple units as metres, but our map projects 16,384
    // actual DayZ metres onto 240 Leaflet units. Its default scale is wrong.
    if(config.key==='badlands'&&L.control){
      const groundScale=L.control({position:'bottomleft'});
      let ruler=null;
      groundScale.onAdd=()=>{
        ruler=L.DomUtil.create('div','wwz-map-ground-scale');
        ruler.setAttribute('aria-label','DayZ world-distance scale');
        return ruler;
      };
      groundScale.addTo(map);
      const updateGroundScale=()=>{
        if(!ruler)return;
        const metersPerPixel=MAP_METRES/(MAP_UNITS*Math.pow(2,map.getZoom()));
        const target=metersPerPixel*120;
        const power=Math.pow(10,Math.floor(Math.log10(Math.max(1,target))));
        const increments=[1,2,5,10].map(v=>v*power);
        const meters=increments.filter(v=>v<=target).pop()||power;
        const width=Math.round(meters/metersPerPixel);
        ruler.style.width=width+'px';
        ruler.textContent=meters>=1000?(meters/1000).toLocaleString('en-AU')+' km':meters+' m';
      };
      map.on('zoomend resize',updateGroundScale);
      window.setTimeout(updateGroundScale,0);
    }else if(L.control?.scale){
      L.control.scale({imperial:false,metric:true,maxWidth:128,position:'bottomleft'}).addTo(map);
    }

    const casingPane = map.createPane('wwzRoadCasingPane');
    const surfacePane = map.createPane('wwzRoadSurfacePane');
    casingPane.style.zIndex = '350';
    surfacePane.style.zIndex = '360';
    casingPane.style.pointerEvents = 'none';
    surfacePane.style.pointerEvents = 'none';
    const roadCasingRenderer = L.canvas({ padding: 0.55, pane: 'wwzRoadCasingPane' });
    const roadSurfaceRenderer = L.canvas({ padding: 0.55, pane: 'wwzRoadSurfacePane' });

    container.querySelectorAll('.map-controls, .map-visual-controls, .coordinate-picker-controls, .member-map-controls, .saved-location-map-controls, .map-coordinate-readout, .coordinate-picker-hint, .member-map-readout, .saved-location-map-readout').forEach((element) => {
      L.DomEvent.disableClickPropagation(element);
      L.DomEvent.disableScrollPropagation(element);
    });

    // Nasdara's calibrated satellite covers the full world extent exactly.
    const satellite = config.satelliteImageUrl
      ? L.imageOverlay(config.satelliteImageUrl, bounds, {
          opacity: 1, interactive: false, pane:'tilePane',
          className: 'wwz-nasdara-satellite'
        }).addTo(map)
      : L.tileLayer(config.satelliteUrl, {
          tileSize: 256,
          minZoom: MIN_ZOOM,
          maxNativeZoom: MAX_NATIVE_ZOOM,
          maxZoom: MAX_ZOOM,
          noWrap: true,
          bounds,
          keepBuffer: options.keepBuffer ?? 3,
          updateWhenIdle: true,
          className: 'wwz-chernarus-satellite'
        }).addTo(map);

    const roadLayers = new Map();
    const roadGroupForClass = (roadClass) => Object.entries(config.roadGroups)
      .find(([, classes]) => classes.includes(roadClass))?.[0] || 'paved';
    const state = {
      selection: null,
      selectionEnabled: options.selectable !== false,
      selectionMarkerVisible: true,
      roadsVisible: options.roadsVisible !== false,
      trailsVisible: options.trailsVisible !== false,
      roadOpacity: clamp(Number(options.roadOpacity ?? 1), 0, 1),
      satelliteOpacity: clamp(Number(options.satelliteOpacity ?? 1), 0, 1),
      gridVisible: options.gridVisible === true,
      roadGroupVisibility: new Map(Object.keys(config.roadGroups).map((key) => [key, true])),
      structuresVisible:options.structuresVisible!==false,
      destroyed: false
    };
    satellite.setOpacity(state.satelliteOpacity);

    let selectionMarker = null;
    let roadsReady = false;
    let roadError = null;

    const loadingElement = options.loadingElement || null;
    const pointerElement = options.pointerElement || null;
    const selectedElement = options.selectedElement || null;
    const copyButton = options.copyButton || null;
    const roadToggle = options.roadToggle || null;
    const trailToggle = options.trailToggle || null;
    const gridToggle = options.gridToggle || null;
    const fullscreenTarget = options.fullscreenTarget || container;

    const gridPane = map.createPane('wwzCoordinateGridPane');
    gridPane.style.zIndex = '325';
    gridPane.style.pointerEvents = 'none';
    const gridLayer = L.layerGroup();
    const gridStyle = { pane: 'wwzCoordinateGridPane', color: '#f0dfb6', weight: 0.8, opacity: 0.38, interactive: false };
    for (let coordinate = 1000; coordinate < MAP_METRES; coordinate += 1000) {
      L.polyline([
        projectWorld([coordinate, 0]),
        projectWorld([coordinate, MAP_METRES])
      ], gridStyle).addTo(gridLayer);
      L.polyline([
        projectWorld([0, coordinate]),
        projectWorld([MAP_METRES, coordinate])
      ], gridStyle).addTo(gridLayer);
      if (coordinate % 2000 === 0) {
        const makeGridIcon = (label) => L.divIcon({
          className: 'wwz-map-grid-label',
          html: `<span>${label}</span>`,
          iconSize: [58, 18],
          iconAnchor: [29, 9]
        });
        L.marker(projectWorld([coordinate, 180]), {
          pane: 'wwzCoordinateGridPane', icon: makeGridIcon(`X ${coordinate}`), interactive: false, keyboard: false
        }).addTo(gridLayer);
        L.marker(projectWorld([180, coordinate]), {
          pane: 'wwzCoordinateGridPane', icon: makeGridIcon(`Z ${coordinate}`), interactive: false, keyboard: false
        }).addTo(gridLayer);
      }
    }

    const makeLocationIcon = ({ name = '', colour = '#d52b1e', icon = 'default', selected = false, custom = false, showLabel = true, selection = false } = {}) => {
      const safeColour = /^#[0-9a-f]{6}$/i.test(String(colour)) ? String(colour) : '#d52b1e';
      const imageUrl = markerIconUrl(icon);
      const classes = [
        'wwz-map-location-pin-wrap',
        imageUrl ? 'has-marker-artwork' : '',
        custom ? 'is-custom' : 'is-public',
        selected ? 'is-selected' : '',
        selection ? 'is-selection' : ''
      ].filter(Boolean).join(' ');
      const label = showLabel && name
        ? `<span class=\"wwz-map-location-pin-label\">${escapeHtml(name)}</span>`
        : '';
      return L.divIcon({
        className: 'wwz-map-location-div-icon',
        html: imageUrl
          ? `<span class="${classes}" style="--wwz-pin-colour:${safeColour}"><img class="wwz-map-marker-artwork" src="${imageUrl}" width="32" height="40" alt="" aria-hidden="true">${label}</span>`
          : `<span class="${classes}" style="--wwz-pin-colour:${safeColour}"><span class="wwz-map-location-pin"><span class="wwz-map-location-pin-core"></span></span>${label}</span>`,
        iconSize: imageUrl ? [32, 40] : [24, 32],
        iconAnchor: imageUrl ? [16, 38] : [12, 30]
      });
    };

    const setLoading = (message, status = 'loading') => {
      if (!loadingElement) return;
      if (!message) {
        loadingElement.hidden = true;
        loadingElement.classList.remove('error', 'ready');
        return;
      }
      loadingElement.hidden = false;
      loadingElement.classList.toggle('error', status === 'error');
      loadingElement.classList.toggle('ready', status === 'ready');
      const label = loadingElement.querySelector('strong') || loadingElement;
      label.textContent = message;
    };

    const updateToggleButton = (button, active, label) => {
      if (!button) return;
      button.hidden = false;
      button.disabled = false;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
      button.title = `${active ? 'Hide' : 'Show'} ${label}`;
    };

    const updateToggleState = () => {
      updateToggleButton(roadToggle, state.roadsVisible, 'roads');
      updateToggleButton(trailToggle, state.trailsVisible, 'trails and paths');
      updateToggleButton(gridToggle, state.gridVisible, 'coordinate grid');
    };

    const roadEnabledForGroup = (group) => {
      const roadGroup = roadGroupForClass(group);
      // Native dirt tracks belong to the Roads master on Nasdara even though
      // older map configurations group trails separately.
      const masterVisible = config.key==='badlands'
        ? state.roadsVisible
        : (trailGroups.has(group)?state.trailsVisible:state.roadsVisible);
      return masterVisible && state.roadGroupVisibility.get(roadGroup) !== false;
    };

    const updateGridLayer = () => {
      if (state.gridVisible) {
        if (!map.hasLayer(gridLayer)) gridLayer.addTo(map);
      } else if (map.hasLayer(gridLayer)) {
        map.removeLayer(gridLayer);
      }
      updateToggleState();
    };

    const updateRoadLayers = () => {
      if (!roadsReady || state.destroyed) return;
      const zoom = map.getZoom();
      const globalWidth = zoomWidthProfile(zoom) * PRODUCTION_WIDTH_MULTIPLIER;

      ROAD_ORDER.forEach((group) => {
        const bundle = roadLayers.get(group);
        if (!bundle) return;
        const style = ROAD_STYLES[group];
        const shouldShow = roadEnabledForGroup(group) && zoom >= style.minZoom;

        if (shouldShow) {
          if (!map.hasLayer(bundle.casing)) bundle.casing.addTo(map);
          if (!map.hasLayer(bundle.surface)) bundle.surface.addTo(map);
          const surfaceWidth = Math.max(0.8, style.width * globalWidth);
          const casingWidth = surfaceWidth + Math.max(1.1, 1.55 * globalWidth);
          const classOpacity = roadClassOpacity(config, group, zoom);
          bundle.casing.setStyle({ weight: casingWidth, opacity: Math.min(0.92, style.opacity) * classOpacity * state.roadOpacity });
          bundle.surface.setStyle({ weight: surfaceWidth, opacity: style.opacity * classOpacity * state.roadOpacity });
        } else {
          if (map.hasLayer(bundle.surface)) map.removeLayer(bundle.surface);
          if (map.hasLayer(bundle.casing)) map.removeLayer(bundle.casing);
        }
      });
      updateToggleState();
    };

    const buildRoadLayers = (groups) => {
      ROAD_ORDER.forEach((group) => {
        const latlngs = groups[group];
        if (!latlngs?.length) return;
        const style = ROAD_STYLES[group];
        const base = {
          interactive: false,
          lineCap: 'butt',
          lineJoin: 'round',
          smoothFactor: 0,
          noClip: false
        };
        const casing = L.polyline(latlngs, {
          ...base,
          renderer: roadCasingRenderer,
          color: style.casing,
          weight: style.width + 2,
          opacity: Math.min(0.92, style.opacity)
        });
        const surface = L.polyline(latlngs, {
          ...base,
          renderer: roadSurfaceRenderer,
          color: style.colour,
          weight: style.width,
          opacity: style.opacity,
          dashArray: style.dashArray || null
        });
        roadLayers.set(group, { casing, surface });
      });
      roadsReady = true;
      roadError = null;
      updateRoadLayers();
      if (loadingElement) setLoading('', 'ready');
      options.onRoadReady?.({ groups: roadLayers.size });
    };

    const loadRoads = () => {
      if (options.loadRoads === false || roadsReady) return Promise.resolve();
      setLoading('Loading production road network…');
      return loadRoadGeometry(config)
        .then(buildRoadLayers)
        .catch((error) => {
          roadError = error;
          setLoading('Road overlay unavailable — check production map assets.', 'error');
          options.onRoadError?.(error);
        });
    };

    const updateSelectedDisplay = () => {
      if (selectedElement) {
        selectedElement.textContent = state.selection
          ? `X ${formatCoordinate(state.selection.x)} · Z ${formatCoordinate(state.selection.z)}`
          : (options.emptySelectionText || 'Click or tap the map');
      }
      if (copyButton) copyButton.disabled = !state.selection;
    };

    const renderSelectionMarker = () => {
      if (!state.selection || !state.selectionMarkerVisible) {
        if (selectionMarker) {
          map.removeLayer(selectionMarker);
          selectionMarker = null;
        }
        return;
      }
      const latlng = projectWorld([state.selection.x, state.selection.z]);
      if (!latlng) return;
      if (!selectionMarker) {
        selectionMarker = L.marker(latlng, {
          icon: makeLocationIcon({ colour: '#d52b1e', selected: true, showLabel: false, selection: true }),
          interactive: false,
          keyboard: false,
          zIndexOffset: 800
        }).addTo(map);
      } else {
        selectionMarker.setLatLng(latlng);
      }
    };

    const setSelection = (x, z, settings = {}) => {
      const nextX = Number(x);
      const nextZ = Number(z);
      if (!Number.isFinite(nextX) || !Number.isFinite(nextZ)) return false;
      if (nextX < 0 || nextX > MAP_METRES || nextZ < 0 || nextZ > MAP_METRES) return false;
      state.selection = { x: nextX, z: nextZ };
      state.selectionMarkerVisible = settings.marker !== false;
      renderSelectionMarker();
      updateSelectedDisplay();
      if (settings.center) {
        const latlng = projectWorld([nextX, nextZ]);
        map.setView(latlng, settings.zoom ?? Math.max(5, map.getZoom()), { animate: settings.animate !== false });
      }
      if (settings.notify !== false) options.onSelect?.({ ...state.selection }, { source: settings.source || 'api' });
      return true;
    };

    const clearSelection = (settings = {}) => {
      state.selection = null;
      state.selectionMarkerVisible = true;
      renderSelectionMarker();
      updateSelectedDisplay();
      if (settings.notify !== false) options.onClearSelection?.();
    };

    const setSelectionEnabled = (enabled) => {
      state.selectionEnabled = Boolean(enabled);
      container.classList.toggle('wwz-map-selection-disabled', !state.selectionEnabled);
    };

    const copySelection = async () => {
      if (!state.selection) return false;
      const text = `${state.selection.x.toFixed(1)}, ${state.selection.z.toFixed(1)}`;
      const copied = await copyText(text);
      if (copyButton) {
        const original = copyButton.dataset.originalLabel || copyButton.textContent || 'Copy';
        copyButton.dataset.originalLabel = original;
        copyButton.textContent = copied ? 'Copied' : 'Copy failed';
        window.setTimeout(() => { copyButton.textContent = original; }, 1400);
      }
      options.onCopy?.({ ...state.selection, text, copied });
      return copied;
    };

    const reset = () => {
      map.fitBounds(bounds, { padding: options.fitPadding || [8, 8], animate: false });
    };

    const toggleFullscreen = async () => {
      try {
        if (document.fullscreenElement === fullscreenTarget) {
          await document.exitFullscreen?.();
        } else if (fullscreenTarget?.requestFullscreen) {
          await fullscreenTarget.requestFullscreen();
        }
      } catch {}
    };

    const focus = (x, z, zoom = Math.max(6, map.getZoom())) => {
      const latlng = projectWorld([x, z]);
      if (!latlng) return;
      map.setView(latlng, clamp(zoom, MIN_ZOOM, MAX_ZOOM), { animate: true });
    };

    const addPoi = (poi, handlers = {}) => {
      const latlng = projectWorld([poi?.x, poi?.z]);
      if (!latlng) return null;
      const isCustom = handlers.custom === true || poi?.scope === 'custom';
      const colour = handlers.colour || (isCustom ? '#ffbd36' : '#d52b1e');
      const makeIcon = (selected = false) => makeLocationIcon({
        name: poi?.name || 'Location',
        colour,
        icon: poi?.icon,
        selected,
        custom: isCustom,
        showLabel: handlers.showLabel !== false
      });
      const marker = L.marker(latlng, {
        icon: makeIcon(Boolean(handlers.selected)),
        interactive: true,
        keyboard: true,
        title: String(poi?.name || 'Map location'),
        riseOnHover: true,
        zIndexOffset: isCustom ? 500 : 350
      });
      marker._wwzSetSelected = (selected) => marker.setIcon(makeIcon(Boolean(selected)));
      marker.on('click', (event) => {
        L.DomEvent.stopPropagation(event);
        handlers.onClick?.(poi, marker);
      });
      handlers.layer?.addLayer(marker);
      if (!handlers.layer) marker.addTo(map);
      return marker;
    };

    map.on('mousemove', (event) => {
      if (!pointerElement) return;
      const world = projectLeaflet(event.latlng);
      pointerElement.textContent = world
        ? `X ${formatCoordinate(world.x)} · Z ${formatCoordinate(world.z)}`
        : 'X — · Z —';
    });

    map.on('mouseout', () => {
      if (pointerElement) pointerElement.textContent = 'X — · Z —';
    });

    map.on('click', async (event) => {
      if (!state.selectionEnabled) return;
      const world = projectLeaflet(event.latlng);
      if (!world) return;
      setSelection(world.x, world.z, { notify: true, source: 'map' });
      if (options.copyOnSelect) await copySelection();
    });

    map.on('zoomend', updateRoadLayers);
    map.on('resize', updateRoadLayers);

    options.zoomInButton?.addEventListener('click', () => map.zoomIn());
    options.zoomOutButton?.addEventListener('click', () => map.zoomOut());
    options.resetButton?.addEventListener('click', reset);
    options.fullscreenButton?.addEventListener('click', toggleFullscreen);
    roadToggle?.addEventListener('click', () => {
      state.roadsVisible = !state.roadsVisible;
      updateRoadLayers();
    });
    trailToggle?.addEventListener('click', () => {
      state.trailsVisible = !state.trailsVisible;
      updateRoadLayers();
    });
    gridToggle?.addEventListener('click', () => {
      state.gridVisible = !state.gridVisible;
      updateGridLayer();
    });
    copyButton?.addEventListener('click', copySelection);

    const fullscreenChange = () => {
      window.setTimeout(() => map.invalidateSize({ pan: false }), 60);
    };
    document.addEventListener('fullscreenchange', fullscreenChange);

    satellite.on('loading', () => {
      if (!roadsReady && !roadError) setLoading(`Loading corrected ${config.name} satellite…`);
    });
    satellite.on('load', () => {
      if (!roadsReady && options.loadRoads === false) setLoading('');
    });
    satellite.on(config.satelliteImageUrl ? 'error' : 'tileerror', () => {
      options.onTileError?.();
      if (config.satelliteImageUrl) setLoading('Nasdara satellite unavailable — deployment assets did not load.', 'error');
    });

    // Load structure rendering on demand; no heavy Nasdara parser on other worlds.
    let structureController=null,structureLoading=null;
    const loadStructures=()=>{
      if(!config.structureUrl||state.destroyed||map.getZoom()<3.8||structureController||structureLoading)return;
      const start=()=>{if(!state.destroyed&&window.WWZNasdaraStructures){
        structureController=window.WWZNasdaraStructures.attach(map,{
          ...config,
          onStructureStatus:(status,details)=>{
            const button=container.querySelector('[data-wwz-buildings]');
            const readout=container.querySelector('[data-wwz-building-stats]');
            if(button)button.dataset.loadState=status;
            if(status==='error'){
              if(button)button.title='Building artwork unavailable — check deployment assets';
              if(readout)readout.textContent='Buildings could not load. Reload the map.';
            }else if(status==='loading'){
              if(readout)readout.textContent='Loading native Nasdara buildings…';
            }else if(status==='ready'){
              if(readout)readout.textContent='Buildings ready · zoom in for detailed roofs';
            }else if(status==='drawn'&&readout){
              const count=details?.drawn||0,roofs=details?.detailed||0,zoom=details?.zoom||0;
              readout.textContent=zoom<3.8?'Zoom in to see buildings':
                count.toLocaleString('en-AU')+' buildings · '+roofs.toLocaleString('en-AU')+' detailed roofs';
            }
          }
        });
        structureController.setVisible(state.structuresVisible);
      }};
      if(window.WWZNasdaraStructures){start();return;}
      structureLoading=new Promise((resolve,reject)=>{
        const script=document.createElement('script');
        script.src='assets/js/map/nasdara-structures.js?v=wwz-zoom-smooth-1';
        script.async=true;
        script.onload=resolve;script.onerror=()=>reject(Error('Nasdara building renderer unavailable'));
        document.head.appendChild(script);
      }).then(start).catch(error=>console.warn(error)).finally(()=>{structureLoading=null;});
    };
    map.on('zoomend',loadStructures);
    window.setTimeout(loadStructures,0);

    const api = {
      map,
      config,
      mapKey: config.key,
      worldSize: config.mapMetres,
      bounds,
      satellite,
      loadRoads,
      reset,
      focus,
      setSelection,
      clearSelection,
      setSelectionEnabled,
      copySelection,
      addPoi,
      invalidateSize: () => map.invalidateSize({ pan: false }),
      getSelection: () => state.selection ? { ...state.selection } : null,
      setRoadsVisible: (visible) => { state.roadsVisible = Boolean(visible); updateRoadLayers(); },
      setTrailsVisible: (visible) => { state.trailsVisible = Boolean(visible); updateRoadLayers(); },
      setRoadGroupVisible: (group, visible) => {
        if (!state.roadGroupVisibility.has(group)) return false;
        state.roadGroupVisibility.set(group, Boolean(visible));
        updateRoadLayers();
        return true;
      },
      setGridVisible: (visible) => { state.gridVisible = Boolean(visible); updateGridLayer(); },
      setRoadOpacity: (opacity) => { state.roadOpacity = clamp(Number(opacity), 0, 1); updateRoadLayers(); },
      setStructuresVisible: visible => {
        state.structuresVisible=Boolean(visible);
        if(state.structuresVisible)loadStructures();
        structureController?.setVisible(state.structuresVisible);
      },
      getStructureStatus:()=>structureController?.getStatus()||{
        visible:state.structuresVisible,loaded:false,minimumZoom:3.8,pictureZoom:5.5
      },
      setSatelliteOpacity: (opacity) => { state.satelliteOpacity = clamp(Number(opacity), 0, 1); satellite.setOpacity(state.satelliteOpacity); },
      destroy: () => {
        state.destroyed = true;
        document.removeEventListener('fullscreenchange', fullscreenChange);
        map.off('zoomend',loadStructures);
        structureController?.destroy();
        instances.delete(api);
        map.remove();
        delete container._wwzMapInstance;
      }
    };

    container._wwzMapInstance = api;
    instances.add(api);
    updateSelectedDisplay();
    updateToggleState();
    updateGridLayer();
    reset();
    window.setTimeout(() => api.invalidateSize(), 0);
    loadRoads();
    return api;
  };

  window.WWZMap = Object.freeze({
    markerIconOptions: MARKER_ICON_OPTIONS,
    normaliseMarkerIcon,
    markerIconUrl,
    MIN_ZOOM,
    MAX_NATIVE_ZOOM,
    MAX_ZOOM,
    PRODUCTION_WIDTH_MULTIPLIER,
    MAP_CONFIGS,
    getConfig,
    worldToLeaflet,
    leafletToWorld,
    formatCoordinate,
    create
  });
})();
