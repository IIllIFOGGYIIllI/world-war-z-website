(() => {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const mapKey = String(params.get('map') || '').trim().toLowerCase();
  const markerName = String(params.get('marker') || 'Zone detection').trim().slice(0, 80) || 'Zone detection';
  const x = Number(params.get('x'));
  const z = Number(params.get('z'));
  const container = document.getElementById('wwz-detection-map');
  const loading = document.querySelector('[data-marker-loading]');
  const title = document.querySelector('[data-marker-title]');
  const mapLabel = document.querySelector('[data-marker-map]');
  const nameLabel = document.querySelector('[data-marker-name]');
  const coordinateLabel = document.querySelector('[data-marker-coordinates]');
  const copyButton = document.querySelector('[data-copy-coordinates]');

  const fail = (message) => {
    if (loading) {
      loading.hidden = false;
      loading.classList.add('error');
      const strong = loading.querySelector('strong');
      if (strong) strong.textContent = message;
    }
  };

  if (!container || !window.L || !window.WWZMap) {
    fail('The WWZ map runtime could not be loaded.');
    return;
  }
  if (!['chernarus', 'livonia'].includes(mapKey)) {
    fail('This Discord link does not contain a valid WWZ map.');
    return;
  }

  const config = window.WWZMap.getConfig(mapKey);
  if (!Number.isFinite(x) || !Number.isFinite(z) || x < 0 || z < 0 || x > config.mapMetres || z > config.mapMetres) {
    fail(`This detection position is outside the ${config.name} map bounds.`);
    return;
  }

  document.title = `${markerName} · WWZ ${config.name} Map`;
  if (title) title.textContent = markerName;
  if (mapLabel) mapLabel.textContent = `${config.name} · Zone Radar detection`;
  if (nameLabel) nameLabel.textContent = markerName;
  if (coordinateLabel) coordinateLabel.textContent = `X ${x.toFixed(1)} · Z ${z.toFixed(1)}`;

  const map = window.WWZMap.create(container, {
    mapKey,
    mode: 'full',
    selectable: false,
    copyOnSelect: false,
    roadsVisible: true,
    trailsVisible: true,
    gridVisible: false,
    loadingElement: loading,
    zoomInButton: document.querySelector('[data-marker-zoom-in]'),
    zoomOutButton: document.querySelector('[data-marker-zoom-out]'),
    resetButton: document.querySelector('[data-marker-reset]'),
    fullscreenButton: document.querySelector('[data-marker-fullscreen]'),
    fullscreenTarget: container
  });

  map.addPoi({
    name: markerName,
    x,
    z,
    scope: 'selection'
  }, {
    colour: '#d52b1e',
    selected: true,
    showLabel: true,
    onClick: () => map.focus(x, z, 7)
  });
  map.setSelection(x, z, { notify: false, marker: false, center: true, zoom: 7, animate: false });
  window.setTimeout(() => map.invalidateSize(), 80);

  copyButton?.addEventListener('click', async () => {
    const text = `${x.toFixed(1)}, ${z.toFixed(1)}`;
    let copied = false;
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch {
      const input = document.createElement('textarea');
      input.value = text;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.append(input);
      input.select();
      copied = document.execCommand('copy');
      input.remove();
    }
    const original = 'Copy X/Z';
    copyButton.textContent = copied ? 'Copied' : 'Copy failed';
    window.setTimeout(() => { copyButton.textContent = original; }, 1400);
  });
})();
