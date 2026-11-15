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
  const COMPANION_RELEASE_URL = 'assets/data/companion-release.json';
  const NATIVE_VERSION_KEY = 'wwz_android_native_version';
  const NATIVE_VERSION_CODE_KEY = 'wwz_android_native_version_code';
  const LEGACY_NATIVE_VERSION = '1.0.0';
  const LEGACY_NATIVE_VERSION_CODE = 10000;

  const installButtons = () => [...document.querySelectorAll('[data-pwa-install]')];

  const setStandaloneState = () => {
    const standalone = isStandalone();
    document.documentElement.classList.toggle('pwa-standalone', standalone);
    document.documentElement.dataset.pwaMode = standalone ? 'standalone' : 'browser';
    return standalone;
  };

  const syncInstallButtons = () => {
    const standalone = setStandaloneState();
    const available = !standalone;
    installButtons().forEach((button) => {
      button.hidden = !available;
      button.disabled = !available;
      button.textContent = isIOS() && !deferredInstallPrompt ? 'Add To Home Screen' : 'Install App';
    });
  };

  const readLocalValue = (key) => {
    try { return localStorage.getItem(key); } catch { return null; }
  };

  const writeLocalValue = (key, value) => {
    try { localStorage.setItem(key, String(value)); } catch {}
  };

  const captureNativeRelease = () => {
    const params = new URLSearchParams(location.search);
    if (params.get('source') === 'android-app') {
      const explicitVersion = String(params.get('app_version') || '').trim();
      const explicitCode = Number(params.get('app_code'));
      const version = explicitVersion || readLocalValue(NATIVE_VERSION_KEY) || LEGACY_NATIVE_VERSION;
      const code = Number.isInteger(explicitCode) && explicitCode > 0
        ? explicitCode
        : Number(readLocalValue(NATIVE_VERSION_CODE_KEY)) || LEGACY_NATIVE_VERSION_CODE;
      writeLocalValue(NATIVE_VERSION_KEY, version);
      writeLocalValue(NATIVE_VERSION_CODE_KEY, code);
      document.documentElement.dataset.wwzNativeApp = 'android';
      return { version, version_code: code, platform: 'android' };
    }

    const storedVersion = String(readLocalValue(NATIVE_VERSION_KEY) || '').trim();
    const storedCode = Number(readLocalValue(NATIVE_VERSION_CODE_KEY));
    return storedVersion ? {
      version: storedVersion,
      version_code: Number.isInteger(storedCode) && storedCode > 0 ? storedCode : 0,
      platform: 'android'
    } : null;
  };

  const versionParts = (value) => String(value || '')
    .split('.')
    .slice(0, 4)
    .map((part) => Number.parseInt(part, 10) || 0);

  const compareVersions = (left, right) => {
    const a = versionParts(left);
    const b = versionParts(right);
    const length = Math.max(a.length, b.length, 3);
    for (let index = 0; index < length; index += 1) {
      const delta = (a[index] || 0) - (b[index] || 0);
      if (delta !== 0) return delta;
    }
    return 0;
  };

  const isReleaseNewer = (release, installed) => {
    const latestCode = Number(release?.version_code);
    const installedCode = Number(installed?.version_code);
    if (Number.isInteger(latestCode) && latestCode > 0 && Number.isInteger(installedCode) && installedCode > 0) {
      return latestCode > installedCode;
    }
    return compareVersions(release?.version, installed?.version) > 0;
  };

  const ensureCompanionNavigation = () => {
    document.querySelectorAll('.site-navigation').forEach((navigation) => {
      if ([...navigation.querySelectorAll('a[href]')].some(link => {
        const href = (link.getAttribute('href') || '').split(/[?#]/, 1)[0].replace('./', '');
        return href === 'companion.html';
      })) return;
      const link = document.createElement('a');
      link.href = 'companion.html';
      link.textContent = 'Companion';
      link.dataset.companionLink = '';
      link.className = 'pwa-companion-nav-link';
      const dashboard = [...navigation.querySelectorAll('a')].find((item) => item.getAttribute('href') === 'dashboard.html');
      navigation.insertBefore(link, dashboard || navigation.querySelector('[data-pwa-install]') || navigation.lastChild);
    });

    document.querySelectorAll('.footer-links').forEach((footer) => {
      if ([...footer.querySelectorAll('a[href]')].some(link => (link.getAttribute('href') || '').split(/[?#]/, 1)[0].replace('./', '') === 'companion.html')) return;
      const link = document.createElement('a');
      link.href = 'companion.html';
      link.textContent = 'Companion';
      link.dataset.companionLink = '';
      const dashboard = [...footer.querySelectorAll('a')].find((item) => item.getAttribute('href') === 'dashboard.html');
      if (dashboard?.nextSibling) footer.insertBefore(link, dashboard.nextSibling);
      else footer.append(link);
    });

    const heroActions = document.querySelector('.hero-actions');
    if (heroActions && !heroActions.querySelector('[data-companion-hero-link], [data-companion-home-download], [data-companion-ios-install]')) {
      const link = document.createElement('a');
      link.href = 'companion.html';
      link.className = 'button button-secondary';
      link.dataset.companionHeroLink = '';
      link.textContent = 'Android Companion';
      heroActions.append(link);
    }

    const sidebar = document.querySelector('.dashboard-sidebar');
    if (sidebar && !sidebar.querySelector('[data-companion-sidebar-link]')) {
      const link = document.createElement('a');
      link.href = 'companion.html';
      link.className = 'pwa-companion-sidebar';
      link.dataset.companionSidebarLink = '';
      link.textContent = 'Companion App';
      const install = sidebar.querySelector('.pwa-install-sidebar');
      if (install?.nextSibling) sidebar.insertBefore(link, install.nextSibling);
      else sidebar.prepend(link);
    }
  };

  const ensureNativeReleaseBanner = (release, installed) => {
    if (!installed || !isReleaseNewer(release, installed)) return;
    let banner = document.querySelector('[data-native-app-update-banner]');
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'pwa-update-banner';
      banner.dataset.nativeAppUpdateBanner = '';
      const copy = document.createElement('span');
      copy.dataset.nativeAppUpdateCopy = '';
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Download APK';
      button.addEventListener('click', () => {
        window.location.assign('companion.html?from=app-update');
      });
      banner.append(copy, button);
      document.body.append(banner);
    }
    const copy = banner.querySelector('[data-native-app-update-copy]');
    if (copy) copy.textContent = `WWZ Companion v${release.version} is available. You have v${installed.version}.`;
    banner.hidden = false;
  };

  const checkNativeRelease = async (installed = captureNativeRelease()) => {
    if (!installed) return null;
    try {
      const response = await fetch(COMPANION_RELEASE_URL, {
        cache: 'no-store',
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) return null;
      const release = await response.json();
      if (!release?.version) return null;
      ensureNativeReleaseBanner(release, installed);
      return release;
    } catch {
      return null;
    }
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
    const mobileApple = isIOS();
    const mobileAndroid = /android/i.test(navigator.userAgent);
    const heading = mobileApple ? 'Install On iPhone Or iPad' : (mobileAndroid ? 'Install On Android' : 'Install WWZ App');
    const steps = mobileApple
      ? '<li>Open this page in Safari.</li><li>Tap the Share button.</li><li>Choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</li>'
      : mobileAndroid
        ? '<li>Open this page in Chrome, Edge, Samsung Internet or another PWA-capable browser.</li><li>Open the browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li><li>If the option is missing, reload the page once and check the browser menu again.</li>'
        : '<li>Use the install icon in your browser address bar when available.</li><li>Otherwise open the browser menu and choose <strong>Install World War Z</strong>, <strong>Install app</strong> or <strong>Apps → Install this site as an app</strong>.</li><li>If your browser does not support web-app installation, use the normal dashboard in the browser.</li>';
    dialog.innerHTML = `
      <form method="dialog">
        <button aria-label="Close install instructions" class="pwa-dialog-close" value="close">×</button>
        <img alt="" aria-hidden="true" class="pwa-dialog-icon" src="assets/icons/pwa/icon-192.png" />
        <p class="pwa-dialog-kicker">WWZ Server Companion</p>
        <h2>${heading}</h2>
        <ol>${steps}</ol>
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
      showInstallHelp();
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

  let activeServiceWorkerRegistration = null;
  let lastForegroundCheckAt = 0;
  let updateCheckPromise = null;
  const FOREGROUND_UPDATE_CHECK_MS = 15 * 60_000;

  const updateButtons = () => [...document.querySelectorAll('[data-pwa-check-updates]')];
  const updateStatus = (message, tone = '') => {
    document.querySelectorAll('[data-pwa-update-status]').forEach((label) => {
      label.textContent = message;
      label.dataset.tone = tone;
    });
  };

  const ensureUpdateControls = () => {
    // The dashboard has a dedicated Settings card and sidebar shortcut.
    // For other pages, expose an unobtrusive manual check in site navigation.
    if (!updateButtons().length) {
      const navigation = document.querySelector('.site-navigation');
      if (navigation) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.pwaCheckUpdates = '';
        button.className = 'pwa-check-updates';
        button.textContent = 'Check for Updates';
        navigation.append(button);
      }
    }
    updateButtons().forEach(button => {
      if (button.dataset.pwaUpdateBound === '1') return;
      button.dataset.pwaUpdateBound = '1';
      button.addEventListener('click', () => { void checkForPwaUpdates({ manual: true }); });
    });
  };

  const ensureUpdateConfirmation = () => {
    let dialog = document.querySelector('[data-pwa-update-confirm]');
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.className = 'pwa-dialog pwa-update-dialog';
    dialog.dataset.pwaUpdateConfirm = '';
    dialog.innerHTML = `
      <form method="dialog">
        <p class="pwa-dialog-kicker">WWZ Companion Update</p>
        <h2>Install the New Version?</h2>
        <p>The update has downloaded. The app will reload once to activate it. Save unfinished forms or edits before continuing.</p>
        <div class="pwa-update-dialog-actions">
          <button type="submit" value="later" class="pwa-update-cancel">Not Now</button>
          <button type="submit" value="install" class="pwa-dialog-action">Update &amp; Reload</button>
        </div>
      </form>`;
    document.body.append(dialog);
    return dialog;
  };

  const confirmUpdate = async () => {
    const dialog = ensureUpdateConfirmation();
    if (typeof dialog.showModal !== 'function') {
      return window.confirm('Install the new WWZ app update and reload now? Save unfinished changes first.');
    }
    if (dialog.open) return false;
    return new Promise(resolve => {
      dialog.addEventListener('close', () => resolve(dialog.returnValue === 'install'), { once: true });
      dialog.showModal();
    });
  };

  const applyWaitingUpdate = async () => {
    const registration = activeServiceWorkerRegistration ||
      await navigator.serviceWorker?.getRegistration?.();
    if (!registration?.waiting || !navigator.serviceWorker?.controller) {
      updateStatus('No downloaded update is waiting. Check again.', 'neutral');
      return;
    }
    if (!await confirmUpdate()) return;
    if (!registration.waiting) {
      updateStatus('The update is no longer waiting. Check again.', 'neutral');
      return;
    }
    try { sessionStorage.setItem(UPDATE_RELOAD_KEY, '1'); } catch {}
    updateStatus('Activating update and reloading…', 'checking');
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  };

  const ensureUpdateBanner = () => {
    let banner = document.querySelector('[data-pwa-update-banner]');
    if (banner) return banner;
    banner = document.createElement('div');
    banner.className = 'pwa-update-banner';
    banner.dataset.pwaUpdateBanner = '';
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');
    banner.hidden = true;
    const copy = document.createElement('span');
    copy.textContent = 'A WWZ Companion update has downloaded and is ready.';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Review Update';
    button.addEventListener('click', () => { void applyWaitingUpdate(); });
    const later = document.createElement('button');
    later.type = 'button';
    later.className = 'pwa-update-later';
    later.textContent = 'Later';
    later.addEventListener('click', () => { banner.hidden = true; });
    banner.append(copy, button, later);
    document.body.append(banner);
    return banner;
  };

  const showUpdateReady = () => {
    ensureUpdateBanner().hidden = false;
    updateStatus('New version ready — choose Review Update to install.', 'ready');
  };

  const watchRegistration = (registration) => {
    if (registration.waiting && navigator.serviceWorker.controller) showUpdateReady();
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      if (!worker) return;
      updateStatus('Downloading an app update…', 'checking');
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdateReady();
        if (worker.state === 'redundant' && !registration.waiting) {
          updateStatus('Update installation was interrupted. Check again.', 'error');
        }
      });
    });
  };

  const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) {
      updateStatus('Automatic updates are not supported in this browser.', 'error');
      return null;
    }
    try {
      const serviceWorkerUrl = new URL('sw.js', document.baseURI);
      const scopeUrl = new URL('./', document.baseURI);
      const registration = await navigator.serviceWorker.register(serviceWorkerUrl, {
        scope: scopeUrl.pathname,
        updateViaCache: 'none'
      });
      activeServiceWorkerRegistration = registration;
      watchRegistration(registration);
      return registration;
    } catch (error) {
      updateStatus('Unable to register app updates. Try again online.', 'error');
      console.warn('WWZ PWA service worker registration failed.', error);
      return null;
    }
  };

  const checkForPwaUpdates = async ({ manual = false } = {}) => {
    if (updateCheckPromise) return updateCheckPromise;
    if (!('serviceWorker' in navigator) || !window.isSecureContext) {
      updateStatus('This browser cannot check installed-app updates.', 'error');
      return false;
    }
    if (navigator.onLine === false) {
      updateStatus('You are offline. Connect to the internet to check for updates.', 'error');
      return false;
    }
    updateButtons().forEach(button => { button.disabled = true; });
    if (manual) updateStatus('Checking for the latest WWZ Companion version…', 'checking');
    updateCheckPromise = (async () => {
      try {
        const registration = activeServiceWorkerRegistration || await registerServiceWorker();
        if (!registration) return false;
        // An already installed worker needs no network request before offering it.
        if (registration.waiting && navigator.serviceWorker.controller) {
          showUpdateReady();
          return true;
        }
        lastForegroundCheckAt = Date.now();
        await registration.update();
        // A new worker may still be installing when update() resolves. Do not
        // report "up to date" before its state has settled.
        if (registration.installing && registration.installing.state !== 'installed') {
          await new Promise(resolve => {
            const worker = registration.installing;
            const finish = () => {
              if (['installed', 'activated', 'redundant'].includes(worker.state)) resolve();
            };
            worker.addEventListener('statechange', finish);
            setTimeout(resolve, 6000);
            finish();
          });
        }
        if (registration.waiting && navigator.serviceWorker.controller) {
          showUpdateReady();
          return true;
        }
        const installed = captureNativeRelease();
        if (installed) await checkNativeRelease(installed);
        if (manual) updateStatus(
          registration.installing ? 'Update is still downloading. You will be notified when ready.' :
          'You are up to date. Automatic checks are enabled.', 'ready'
        );
        return false;
      } catch (error) {
        if (manual) updateStatus('Update check failed. Check your connection and try again.', 'error');
        console.warn('WWZ PWA update check failed.', error);
        return false;
      } finally {
        updateCheckPromise = null;
        updateButtons().forEach(button => { button.disabled = false; });
      }
    })();
    return updateCheckPromise;
  };

  const checkForegroundUpdates = () => {
    if (document.hidden || navigator.onLine === false || !activeServiceWorkerRegistration) return;
    if (Date.now() - lastForegroundCheckAt < FOREGROUND_UPDATE_CHECK_MS) return;
    void checkForPwaUpdates();
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

  window.addEventListener('online', () => {
    syncNetworkState();
    checkForegroundUpdates();
  });
  window.addEventListener('offline', syncNetworkState);
  window.addEventListener('pageshow', checkForegroundUpdates);
  document.addEventListener('visibilitychange', checkForegroundUpdates);
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
    const installedRelease = captureNativeRelease();
    ensureCompanionNavigation();
    wireInstallButtons();
    ensureUpdateControls();
    syncNetworkState();
    void registerServiceWorker().then((registration) => {
      if (registration) void checkForPwaUpdates();
    });
    setInterval(checkForegroundUpdates, FOREGROUND_UPDATE_CHECK_MS);
    void checkNativeRelease(installedRelease);
  }, { once: true });

  window.WWZCompanion = Object.freeze({
    checkForNativeUpdate: checkNativeRelease,
    checkForPwaUpdates: () => checkForPwaUpdates({ manual: true }),
    getInstalledRelease: captureNativeRelease,
    isReleaseNewer
  });
})();
