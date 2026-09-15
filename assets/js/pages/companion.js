(() => {
  'use strict';

  const RELEASE_URL = 'assets/data/companion-release.json';
  const RELEASE_REPOSITORY = 'IIllIFOGGYIIllI/world-war-z-website';
  const $ = (selector) => document.querySelector(selector);
  const all = (selector) => [...document.querySelectorAll(selector)];

  const formatBytes = (bytes) => {
    const value = Number(bytes) || 0;
    if (!value) return 'size pending';
    if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (value) => {
    const date = new Date(`${String(value || '')}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return String(value || 'Unknown');
    return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
  };

  const releaseApiUrl = (release) => {
    const configured = String(release?.release_api_url || '').trim();
    if (/^https:\/\/api\.github\.com\//i.test(configured)) return configured;
    const version = encodeURIComponent(String(release?.version || '').trim());
    return version
      ? `https://api.github.com/repos/${RELEASE_REPOSITORY}/releases/tags/companion-v${version}`
      : '';
  };

  const releaseAsset = (payload, names) => {
    const wanted = new Set(names.filter(Boolean));
    return (Array.isArray(payload?.assets) ? payload.assets : []).find((asset) => wanted.has(String(asset?.name || ''))) || null;
  };

  const resolveHostedRelease = async (release) => {
    const apiUrl = releaseApiUrl(release);
    if (!apiUrl) return { available: false, release, reason: 'missing-release-reference' };
    try {
      const response = await fetch(apiUrl, {
        cache: 'no-store',
        headers: { Accept: 'application/vnd.github+json' }
      });
      if (response.status === 404) return { available: false, release, reason: 'release-not-published' };
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const version = String(release.version || '').trim();
      const apk = releaseAsset(payload, ['World-War-Z-Companion.apk', `World-War-Z-Companion-v${version}.apk`]);
      const zip = releaseAsset(payload, ['World-War-Z-Companion.zip', `World-War-Z-Companion-v${version}.zip`]);
      if (!apk?.browser_download_url) return { available: false, release, reason: 'apk-asset-missing' };
      return {
        available: true,
        release: {
          ...release,
          apk_url: apk.browser_download_url,
          apk_size_bytes: Number(apk.size) || Number(release.apk_size_bytes) || 0,
          zip_url: zip?.browser_download_url || release.zip_url,
          zip_size_bytes: Number(zip?.size) || Number(release.zip_size_bytes) || 0,
          release_page_url: payload.html_url || release.release_page_url,
        }
      };
    } catch (error) {
      console.warn('WWZ Companion GitHub release availability could not be verified.', error);
      return { available: null, release, reason: 'release-check-unavailable' };
    }
  };

  const setDownloadLink = (link, url, fallbackName) => {
    const value = String(url || '');
    link.href = value;
    link.removeAttribute('aria-disabled');
    link.classList.remove('is-disabled');
    try {
      const target = new URL(value, location.href);
      if (target.origin === location.origin) {
        link.download = target.pathname.split('/').pop() || fallbackName;
      } else {
        link.removeAttribute('download');
      }
    } catch {
      link.removeAttribute('download');
    }
  };

  const disableDownloadLink = (link, label) => {
    link.removeAttribute('href');
    link.removeAttribute('download');
    link.setAttribute('aria-disabled', 'true');
    link.classList.add('is-disabled');
    link.textContent = label;
  };

  const applyRelease = (release) => {
    all('[data-release-version]').forEach((element) => { element.textContent = `v${release.version}`; });
    all('[data-release-size]').forEach((element) => { element.textContent = `${formatBytes(release.apk_size_bytes)} APK · ${formatBytes(release.zip_size_bytes)} ZIP`; });
    all('[data-package-name]').forEach((element) => { element.textContent = release.package_name; });
    all('[data-version-code]').forEach((element) => { element.textContent = String(release.version_code); });
    all('[data-release-date]').forEach((element) => { element.textContent = formatDate(release.released_at); });
    all('[data-minimum-android]').forEach((element) => { element.textContent = `Android 6.0+ (API ${release.minimum_android_api})`; });
    all('[data-apk-sha]').forEach((element) => { element.textContent = release.apk_sha256 || 'Published with the signed release'; });
    all('[data-signing-fingerprint]').forEach((element) => { element.textContent = release.signing_cert_sha256; });
    all('[data-apk-download]').forEach((link) => {
      setDownloadLink(link, release.apk_url, 'World-War-Z-Companion.apk');
      link.textContent = `Download APK · ${formatBytes(release.apk_size_bytes)}`;
    });
    all('[data-zip-download]').forEach((link) => {
      if (release.zip_url) {
        setDownloadLink(link, release.zip_url, 'World-War-Z-Companion.zip');
        link.textContent = `ZIP fallback · ${formatBytes(release.zip_size_bytes)}`;
        link.hidden = false;
      } else {
        link.hidden = true;
      }
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

  const applyUnavailableRelease = (release, reason) => {
    all('[data-release-version]').forEach((element) => { element.textContent = `v${release?.version || '—'}`; });
    all('[data-release-size]').forEach((element) => { element.textContent = 'Signed package is being republished'; });
    all('[data-apk-download]').forEach((link) => disableDownloadLink(link, 'APK temporarily unavailable'));
    all('[data-zip-download]').forEach((link) => disableDownloadLink(link, 'ZIP temporarily unavailable'));
    const state = $('[data-release-state]');
    const label = $('[data-release-state-label]');
    if (state) state.dataset.releaseState = 'error';
    if (label) label.textContent = 'Android release is being republished';
    const note = $('[data-download-note]');
    if (note) note.textContent = 'The signed Android package is temporarily unavailable. The browser/PWA dashboard remains available while the GitHub release is republished.';
    const status = $('[data-installed-status]');
    if (status) status.textContent = reason === 'apk-asset-missing' ? 'Release found · APK asset missing' : 'Android release awaiting publication';
  };

  const loadRelease = async () => {
    try {
      const response = await fetch(RELEASE_URL, { cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const release = await response.json();
      if (!release?.version) throw new Error('Invalid release metadata');
      const hosted = await resolveHostedRelease(release);
      if (hosted.available === false) {
        applyUnavailableRelease(release, hosted.reason);
        return null;
      }
      const hasPublishedIntegrity = /^[a-f0-9]{64}$/i.test(String(release.apk_sha256 || '').trim());
      if (hosted.available === null && !hasPublishedIntegrity) {
        applyUnavailableRelease(release, hosted.reason);
        return null;
      }
      // Once exact signed metadata has been published, a temporary GitHub API
      // availability failure must not remove a known-good direct download.
      applyRelease(hosted.release || release);
      return hosted.release || release;
    } catch (error) {
      const state = $('[data-release-state]');
      const label = $('[data-release-state-label]');
      if (state) state.dataset.releaseState = 'error';
      if (label) label.textContent = 'Companion release metadata is temporarily unavailable';
      console.warn('WWZ Companion release metadata could not be loaded.', error);
      return null;
    }
  };

  $('[data-copy-apk-sha]')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    const value = $('[data-apk-sha]')?.textContent?.trim() || '';
    if (!value || !/^[a-f0-9]{64}$/i.test(value)) return;
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
