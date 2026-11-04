(() => {
  'use strict';
  if (window.__wwzGpsTrackerReady) return;

  const formatDistance = (value) => {
    const metres = Math.max(0, Number(value) || 0);
    return metres >= 1000
      ? (metres / 1000).toLocaleString('en-AU', { maximumFractionDigits: 2 }) + ' km'
      : Math.round(metres).toLocaleString('en-AU') + ' m';
  };
  const formatTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' });
  };
  const projectSamples = (samples, mapKey) => samples
    .map((point) => window.WWZMap?.worldToLeaflet?.([Number(point.x), Number(point.z)], mapKey))
    .filter((point) => Array.isArray(point) && point.every(Number.isFinite));

  const splitSamples = (samples) => {
    const output = [];
    let current = [];
    let session = null;
    (Array.isArray(samples) ? samples : []).forEach((point) => {
      const nextSession = String(point?.session_key || '');
      const reason = String(point?.rejection_reason || '');
      if (current.length && (nextSession !== session || Boolean(reason))) {
        output.push(current);
        current = [];
      }
      current.push(point);
      session = nextSession;
    });
    if (current.length) output.push(current);
    return output;
  };

  const mount = async ({ container, payload, mapKey, timeline = null, timeLabel = null, status = null }) => {
    if (!container) return null;
    const samples = Array.isArray(payload?.samples) ? payload.samples : [];
    const routeSegments = splitSamples(samples);
    if (!samples.length) {
      if (status) status.textContent = 'No recorded positions in this period yet.';
      return null;
    }
    if (!window.WWZMap?.create || !window.L?.map) {
      await window.WWZLazyAssets?.ensureMapRuntime?.();
    }
    if (!window.WWZMap?.create || !window.L?.map) throw new Error('The WWZ map runtime is unavailable.');

    const old = container._wwzGpsMap;
    if (old?.destroy) old.destroy();
    container.replaceChildren();
    const loading = document.createElement('div');
    loading.className = 'wwz-gps-map-loading';
    loading.textContent = 'Loading Nasdara terrain…';
    container.append(loading);

    const instance = window.WWZMap.create(container, {
      mapKey, mode: 'full', selectable: false, copyOnSelect: false,
      roadsVisible: true, trailsVisible: true, gridVisible: false,
      structuresVisible: false, satelliteOpacity: 1,
    });
    container._wwzGpsMap = instance;
    loading.remove();

    const L = window.L;
    const fullLayer = L.layerGroup().addTo(instance.map);
    const progressLayer = L.layerGroup().addTo(instance.map);
    const allLatLngs = [];
    const projectedSegments = routeSegments.map((segment) => {
      const positions = projectSamples(segment, mapKey);
      if (positions.length >= 2) {
        // Draw a dark casing first so the route remains legible over roads,
        // trails and terrain labels, then lay a bright cyan centre stroke over it.
        L.polyline(positions, {
          color: '#06131b', weight: 8, opacity: 0.98,
          lineCap: 'round', lineJoin: 'round', interactive: false,
        }).addTo(fullLayer);
        L.polyline(positions, {
          color: '#35e6ff', weight: 4.5, opacity: 1,
          lineCap: 'round', lineJoin: 'round', interactive: false,
        }).addTo(fullLayer);
        allLatLngs.push(...positions);
      } else if (positions.length === 1) {
        allLatLngs.push(positions[0]);
      }
      return positions;
    });
    const first = projectedSegments.find((segment) => segment.length)?.[0] || null;
    const last = [...projectedSegments].reverse().find((segment) => segment.length)?.at(-1) || null;
    if (first) L.circleMarker(first, { radius: 6, color: '#85d7a2', weight: 2, fillColor: '#193d2b', fillOpacity: 0.95 }).bindTooltip('First recorded position').addTo(fullLayer);
    if (last) L.circleMarker(last, { radius: 6, color: '#ed8279', weight: 2, fillColor: '#54211d', fillOpacity: 0.95 }).bindTooltip('Latest recorded position').addTo(fullLayer);

    if (allLatLngs.length > 1) instance.map.fitBounds(L.latLngBounds(allLatLngs), { padding: [28, 28], maxZoom: 5.2 });
    else if (allLatLngs.length === 1) instance.map.setView(allLatLngs[0], 5);

    const samplePositions = samples.map((point) => {
      const projected = window.WWZMap.worldToLeaflet([Number(point.x), Number(point.z)], mapKey);
      return Array.isArray(projected) && projected.every(Number.isFinite) ? projected : null;
    });
    const drawProgress = (index) => {
      progressLayer.clearLayers();
      splitSamples(samples.slice(0, index + 1)).forEach((segment) => {
        const points = projectSamples(segment, mapKey);
        if (points.length >= 2) {
          // The replayed portion uses a separate magenta highlight with the
          // same dark casing so it is distinct from the cyan full route.
          L.polyline(points, {
            color: '#06131b', weight: 10, opacity: 0.98,
            lineCap: 'round', lineJoin: 'round', interactive: false,
          }).addTo(progressLayer);
          L.polyline(points, {
            color: '#FF4FD8', weight: 5.5, opacity: 1,
            lineCap: 'round', lineJoin: 'round', interactive: false,
          }).addTo(progressLayer);
        }
      });
      const selected = samplePositions[index] || last || first;
      if (selected) L.circleMarker(selected, {
        radius: 7, color: '#FF9DEA', weight: 2.5, fillColor: '#8A245F', fillOpacity: 1,
      }).bindTooltip('Selected route position').addTo(progressLayer);
      if (timeLabel) timeLabel.textContent = formatTime(samples[index]?.observed_at);
    };

    if (timeline) {
      timeline.min = '0';
      timeline.max = String(Math.max(0, samples.length - 1));
      timeline.step = '1';
      timeline.value = String(samples.length - 1);
      timeline.disabled = samples.length < 2;
      timeline.oninput = () => drawProgress(Math.max(0, Math.min(samples.length - 1, Number(timeline.value) || 0)));
    }
    drawProgress(samples.length - 1);
    if (status) {
      status.textContent = samples.length.toLocaleString('en-AU') + ' position snapshots · ' +
        (payload.truncated ? 'showing the latest retained samples' : 'selected retention window');
    }
    return {
      destroy: () => {
        if (container._wwzGpsMap === instance) delete container._wwzGpsMap;
        instance.destroy?.();
      },
      map: instance,
      sampleCount: samples.length,
      formatDistance,
    };
  };

  window.WWZGpsTracker = Object.freeze({ mount, formatDistance, formatTime });
  window.__wwzGpsTrackerReady = true;
})();
