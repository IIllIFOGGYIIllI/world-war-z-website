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
    'assets/js/data/command-library.js?v=1.22.75',
    () => window.__wwzCommandLibraryReady === true
  );

  const requestedView = () => String(location.hash || '')
    .replace(/^#/, '')
    .split('/', 1)[0];

  const loadCommandsIfNeeded = (view) => {
    if (view !== 'commands') return;
    ensureCommandLibrary().catch(() => {});
  };

  window.addEventListener('wwz:viewchange', (event) => {
    loadCommandsIfNeeded(event.detail?.view);
  });

  document.querySelectorAll('[data-view="commands"]').forEach((button) => {
    button.addEventListener('pointerenter', () => {
      ensureCommandLibrary().catch(() => {});
    }, { passive: true });
    button.addEventListener('focus', () => {
      ensureCommandLibrary().catch(() => {});
    });
  });

  loadCommandsIfNeeded(requestedView());

  window.WWZLazyAssets = Object.freeze({ ensureCommandLibrary });
})();
