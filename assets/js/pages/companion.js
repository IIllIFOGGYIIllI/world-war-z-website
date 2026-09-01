(() => {
  'use strict';

  const RELEASE_URL = 'assets/data/companion-release.json';
  const $ = (selector) => document.querySelector(selector);
  const all = (selector) => [...document.querySelectorAll(selector)];

  const formatBytes = (bytes) => {
    const value = Number(bytes) || 0;
    if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (value) => {
    const date = new Date(`${String(value || '')}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return String(value || 'Unknown');
    return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
  };

  const applyRelease = (release) => {
    all('[data-release-version]').forEach((element) => { element.textContent = `v${release.version}`; });
    all('[data-release-size]').forEach((element) => { element.textContent = `${formatBytes(release.apk_size_bytes)} APK · ${formatBytes(release.zip_size_bytes)} ZIP`; });
    all('[data-package-name]').forEach((element) => { element.textContent = release.package_name; });
    all('[data-version-code]').forEach((element) => { element.textContent = String(release.version_code); });
    all('[data-release-date]').forEach((element) => { element.textContent = formatDate(release.released_at); });
    all('[data-minimum-android]').forEach((element) => { element.textContent = `Android 6.0+ (API ${release.minimum_android_api})`; });
    all('[data-apk-sha]').forEach((element) => { element.textContent = release.apk_sha256; });
    all('[data-signing-fingerprint]').forEach((element) => { element.textContent = release.signing_cert_sha256; });
    all('[data-apk-download]').forEach((link) => {
      link.href = release.apk_url;
      link.download = release.apk_url.split('/').pop() || 'World-War-Z-Companion.apk';
      link.textContent = `Download APK · ${formatBytes(release.apk_size_bytes)}`;
    });
    all('[data-zip-download]').forEach((link) => {
      link.href = release.zip_url;
      link.download = release.zip_url.split('/').pop() || 'World-War-Z-Companion.zip';
      link.textContent = `ZIP fallback · ${formatBytes(release.zip_size_bytes)}`;
    });

    const installed = window.WWZCompanion?.getInstalledRelease?.() || null;
    const status = $('[data-installed-status]');
    const releaseState = $('[data-release-state]');
    const releaseStateLabel = $('[data-release-state-label]');
    if (installed?.version) {
      const updateAvailable = window.WWZCompanion?.isReleaseNewer?.(release, installed) === true;
      status.textContent = updateAvailable
        ? `Installed v${installed.version} · update available`
        : `Installed v${installed.version} · current`;
      status.classList.toggle('update', updateAvailable);
      status.classList.toggle('current', !updateAvailable);
      releaseState.dataset.releaseState = updateAvailable ? 'update' : 'ready';
      releaseStateLabel.textContent = updateAvailable
        ? `Signed v${release.version} update available`
        : `Signed v${release.version} is current`;
    } else {
      status.textContent = 'Website visitor · Android download available';
      releaseState.dataset.releaseState = 'ready';
      releaseStateLabel.textContent = `Signed v${release.version} ready for Android`;
    }
  };

  const loadRelease = async () => {
    try {
      const response = await fetch(RELEASE_URL, { cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const release = await response.json();
      if (!release?.version || !release?.apk_url || !release?.apk_sha256) throw new Error('Invalid release metadata');
      applyRelease(release);
      return release;
    } catch (error) {
      const state = $('[data-release-state]');
      const label = $('[data-release-state-label]');
      if (state) state.dataset.releaseState = 'error';
      if (label) label.textContent = 'Current packaged release shown · live metadata unavailable';
      console.warn('WWZ Companion release metadata could not be loaded.', error);
      return null;
    }
  };

  $('[data-copy-apk-sha]')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    const value = $('[data-apk-sha]')?.textContent?.trim() || '';
    if (!value) return;
    const original = button.textContent;
    try {
      await navigator.clipboard.writeText(value);
      button.textContent = 'SHA-256 copied';
    } catch {
      button.textContent = 'Copy unavailable';
    }
    window.setTimeout(() => { button.textContent = original; }, 1800);
  });

  document.addEventListener('DOMContentLoaded', () => { void loadRelease(); }, { once: true });
})();
