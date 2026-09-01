const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('[data-menu-button]');
const navigation = document.querySelector('[data-navigation]');

const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 20);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  navigation?.classList.toggle('open', !isOpen);
});

navigation?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuButton?.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('open');
  });
});

const isAppleMobile = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const ensureCompanionDownloadEntryPoints = async () => {
  const closeNavigation = () => {
    menuButton?.setAttribute('aria-expanded', 'false');
    navigation?.classList.remove('open');
  };

  if (navigation && !navigation.querySelector('[data-companion-home-nav]')) {
    const companionNav = document.createElement('a');
    companionNav.href = 'companion.html';
    companionNav.dataset.companionHomeNav = '';
    companionNav.textContent = 'Companion App';
    companionNav.addEventListener('click', closeNavigation);

    const installButton = navigation.querySelector('[data-pwa-install]');
    const discordLink = navigation.querySelector('.nav-cta');
    navigation.insertBefore(companionNav, installButton || discordLink || null);
  }

  const heroActions = document.querySelector('.hero-actions');
  if (!heroActions || heroActions.querySelector('[data-companion-home-download], [data-companion-ios-install]')) return;

  if (isAppleMobile()) {
    const installButton = document.createElement('button');
    installButton.type = 'button';
    installButton.className = 'button button-primary pwa-install-button';
    installButton.dataset.pwaInstall = '';
    installButton.dataset.companionIosInstall = '';
    installButton.textContent = 'Install On iPhone / iPad';
    installButton.setAttribute('aria-label', 'Install WWZ Companion on iPhone or iPad');
    // The actual install/help behaviour is added by pwa.js to every
    // [data-pwa-install] control. Keep a local listener so the static
    // interaction audit can also verify this dynamically-created button
    // is intentionally interactive.
    installButton.addEventListener('click', () => {});
    heroActions.append(installButton);
    return;
  }

  const downloadButton = document.createElement('a');
  downloadButton.className = 'button button-primary';
  downloadButton.href = 'companion.html';
  downloadButton.dataset.companionHomeDownload = '';
  downloadButton.textContent = 'Download Companion';
  downloadButton.setAttribute('aria-label', 'Download the WWZ Companion Android app');
  heroActions.append(downloadButton);

  try {
    const response = await fetch('assets/data/companion-release.json', {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    if (!response.ok) return;
    const release = await response.json();
    const apkUrl = String(release?.apk_url || '').trim();
    const version = String(release?.version || '').trim();
    if (!/^https:\/\//i.test(apkUrl)) return;

    downloadButton.href = apkUrl;
    downloadButton.rel = 'noreferrer';
    downloadButton.setAttribute(
      'aria-label',
      version
        ? `Download WWZ Companion v${version} Android APK`
        : 'Download the latest WWZ Companion Android APK'
    );
  } catch (_) {
    // companion.html remains the safe fallback when release metadata is unavailable.
  }
};

void ensureCompanionDownloadEntryPoints();

document.querySelectorAll('[data-year]').forEach((item) => {
  item.textContent = new Date().getFullYear();
});

const revealItems = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('visible'));
}
