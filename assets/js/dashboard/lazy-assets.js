(() => {
  'use strict';

  const pendingScripts = new Map();

  const loadScriptOnce = (key, src, ready) => {
    if (ready?.()) return Promise.resolve();
    if (pendingScripts.has(key)) return pendingScripts.get(key);

    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.dataset.wwzLazyAsset = key;
      script.addEventListener('load', () => {
        if (ready && !ready()) {
          reject(new Error(`${key} loaded without becoming ready.`));
          return;
        }
        resolve();
      }, { once: true });
      script.addEventListener('error', () => {
        reject(new Error(`${key} could not be loaded.`));
      }, { once: true });
      document.head.append(script);
    }).catch((error) => {
      pendingScripts.delete(key);
      throw error;
    });

    pendingScripts.set(key, promise);
    return promise;
  };

  const ensureCommandLibrary = () => loadScriptOnce(
    'command-library',
    'assets/js/data/command-library.js?v=1.22.77',
    () => window.__wwzCommandLibraryReady === true
  );

  const ensureDashboardMap = () => loadScriptOnce(
    'dashboard-map',
    'assets/js/pages/dashboard-map-loader.js?v=1.22.77&rev=3',
    () => Boolean(window.WWZDashboardMap?.initialise)
  );

  const ensureConfigurationStudio = () => loadScriptOnce(
    'configuration-studio',
    'assets/js/dashboard/configuration-studio.js?v=1.22.77',
    () => window.__wwzConfigurationStudioReady === true
  );

  const ensureShopWikiPreviews = () => loadScriptOnce(
    'shop-wiki-previews',
    'assets/js/shop-wiki-previews.js?v=1.22.77',
    () => Boolean(window.WWZShopWikiPreviews?.createImage)
  );

  const requestedLocation = () => {
    const raw = String(location.hash || '').replace(/^#/, '');
    const [view = '', section = ''] = raw.split('/', 2);
    return { view, section };
  };

  const loadViewAssets = ({ view = '', section = '' } = {}) => {
    if (view === 'commands') ensureCommandLibrary().catch(() => {});
    if (view === 'map') ensureDashboardMap().catch(() => {});
    if (view === 'serverconfig' && section === 'structured') ensureConfigurationStudio().catch(() => {});
    if (view === 'shop' || view === 'shopadmin') ensureShopWikiPreviews().catch(() => {});
  };

  window.addEventListener('wwz:viewchange', (event) => {
    loadViewAssets(event.detail || {});
  });

  const preloads = [
    ['commands', ensureCommandLibrary],
    ['map', ensureDashboardMap],
    ['shop', ensureShopWikiPreviews],
    ['shopadmin', ensureShopWikiPreviews],
  ];
  preloads.forEach(([view, load]) => {
    document.querySelectorAll(`[data-view="${view}"]`).forEach((button) => {
      button.addEventListener('pointerenter', () => load().catch(() => {}), { passive: true });
      button.addEventListener('focus', () => load().catch(() => {}));
    });
  });
  document.querySelectorAll('[data-view="serverconfig"][data-section="structured"]').forEach((button) => {
    button.addEventListener('pointerenter', () => ensureConfigurationStudio().catch(() => {}), { passive: true });
    button.addEventListener('focus', () => ensureConfigurationStudio().catch(() => {}));
  });

  loadViewAssets(requestedLocation());

  window.WWZLazyAssets = Object.freeze({
    ensureCommandLibrary,
    ensureConfigurationStudio,
    ensureDashboardMap,
    ensureShopWikiPreviews,
  });
})();
