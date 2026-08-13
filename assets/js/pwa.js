(() => {
  'use strict';

  const isStandalone = () =>
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  const isIOS = () =>
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  let deferredInstallPrompt = null;
  let reloadingForUpdate = false;
  const UPDATE_RELOAD_KEY = 'wwz_pwa_update_pending';

  const installButtons = () => [...document.querySelectorAll('[data-pwa-install]')];

  const setStandaloneState = () => {
    const standalone = isStandalone();
    document.documentElement.classList.toggle('pwa-standalone', standalone);
    document.documentElement.dataset.pwaMode = standalone ? 'standalone' : 'browser';
    return standalone;
  };

  const syncInstallButtons = () => {
    const standalone = setStandaloneState();
    const available = !standalone && (Boolean(deferredInstallPrompt) || isIOS());
    installButtons().forEach((button) => {
      button.hidden = !available;
      button.disabled = !available;
      button.textContent = isIOS() && !deferredInstallPrompt ? 'Add To Home Screen' : 'Install App';
    });
  };

  const ensureNetworkBanner = () => {
    let banner = document.querySelector('[data-pwa-network-banner]');
    if (banner) return banner;
    banner = document.createElement('div');
    banner.className = 'pwa-network-banner';
    banner.dataset.pwaNetworkBanner = '';
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');
    banner.hidden = true;
    document.body.append(banner);
    return banner;
  };

  const syncNetworkState = () => {
    const online = navigator.onLine !== false;
    document.documentElement.classList.toggle('wwz-offline', !online);
    document.documentElement.dataset.networkState = online ? 'online' : 'offline';
    const banner = ensureNetworkBanner();
    banner.textContent = online
      ? 'Connection restored — live World War Z data is available again.'
      : 'Offline — live WWZ data, purchases and server/admin actions are unavailable.';
    banner.hidden = online;
    window.dispatchEvent(new CustomEvent('wwz:networkchange', { detail: { online } }));
  };

  const ensureInstallHelp = () => {
    let dialog = document.querySelector('[data-pwa-install-help]');
    if (dialog) return dialog;

    dialog = document.createElement('dialog');
    dialog.className = 'pwa-dialog';
    dialog.dataset.pwaInstallHelp = '';
    dialog.innerHTML = `
      <form method="dialog">
        <button aria-label="Close install instructions" class="pwa-dialog-close" value="close">×</button>
        <img alt="" aria-hidden="true" class="pwa-dialog-icon" src="assets/icons/pwa/icon-192.png" />
        <p class="pwa-dialog-kicker">WWZ Server Companion</p>
        <h2>Install On iPhone Or iPad</h2>
        <ol>
          <li>Open this page in Safari.</li>
          <li>Tap the Share button.</li>
          <li>Choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</li>
        </ol>
        <p>The installed app uses this same website, Discord sign-in and Railway backend.</p>
        <button class="pwa-dialog-action" value="close">Got It</button>
      </form>`;
    document.body.append(dialog);
    return dialog;
  };

  const showInstallHelp = () => {
    const dialog = ensureInstallHelp();
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  };

  const promptInstall = async () => {
    if (isStandalone()) return;
    if (!deferredInstallPrompt) {
      if (isIOS()) showInstallHelp();
      return;
    }
    const prompt = deferredInstallPrompt;
    deferredInstallPrompt = null;
    await prompt.prompt();
    await prompt.userChoice.catch(() => null);
    syncInstallButtons();
  };

  const wireInstallButtons = () => {
    installButtons().forEach((button) => {
      if (button.dataset.pwaInstallBound === 'true') return;
      button.dataset.pwaInstallBound = 'true';
      button.addEventListener('click', promptInstall);
    });
    syncInstallButtons();
  };

  const ensureUpdateBanner = () => {
    let banner = document.querySelector('[data-pwa-update-banner]');
    if (banner) return banner;

    banner = document.createElement('div');
    banner.className = 'pwa-update-banner';
    banner.dataset.pwaUpdateBanner = '';
    banner.hidden = true;

    const copy = document.createElement('span');
    copy.textContent = 'A new WWZ app version is ready.';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Update Now';
    button.addEventListener('click', () => {
      try { sessionStorage.setItem(UPDATE_RELOAD_KEY, '1'); } catch {}
      navigator.serviceWorker?.getRegistration()?.then((registration) => {
        registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
      });
    });
    banner.append(copy, button);
    document.body.append(banner);
    return banner;
  };

  const showUpdateReady = () => {
    const banner = ensureUpdateBanner();
    banner.hidden = false;
  };

  const watchRegistration = (registration) => {
    if (registration.waiting && navigator.serviceWorker.controller) showUpdateReady();
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdateReady();
      });
    });
  };

  const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
    try {
      const serviceWorkerUrl = new URL('sw.js', document.baseURI);
      const scopeUrl = new URL('./', document.baseURI);
      const registration = await navigator.serviceWorker.register(serviceWorkerUrl, {
        scope: scopeUrl.pathname,
        updateViaCache: 'none'
      });
      watchRegistration(registration);
      registration.update().catch(() => null);
    } catch (error) {
      console.warn('WWZ PWA service worker registration failed.', error);
    }
  };

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    wireInstallButtons();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    syncInstallButtons();
  });

  window.addEventListener('online', syncNetworkState);
  window.addEventListener('offline', syncNetworkState);
  window.matchMedia?.('(display-mode: standalone)')?.addEventListener?.('change', syncInstallButtons);

  navigator.serviceWorker?.addEventListener('controllerchange', () => {
    let updatePending = false;
    try { updatePending = sessionStorage.getItem(UPDATE_RELOAD_KEY) === '1'; } catch {}
    if (!updatePending || reloadingForUpdate) return;
    reloadingForUpdate = true;
    try { sessionStorage.removeItem(UPDATE_RELOAD_KEY); } catch {}
    window.location.reload();
  });

  document.addEventListener('DOMContentLoaded', () => {
    wireInstallButtons();
    syncNetworkState();
    registerServiceWorker();
  }, { once: true });
})();
