'use strict';

const WWZ_PWA_VERSION = '2.21.12';
const CACHE_PREFIX = 'wwz-pwa-';
const WWZ_PWA_CACHE_REVISION = 'community-workflows-1';
// Public release versions can advance without discarding the bounded map caches.
// Keep this cache-generation version until a deliberate cache migration is needed.
const WWZ_PWA_CACHE_RELEASE_VERSION = '1.27.0';
// Bump this token on every deployed website update. Changing sw.js makes installed
// PWAs/TWAs discover the update and surface the existing "Update Now" flow.
const WWZ_PWA_UPDATE_REVISION = '2026-11-15-linked-psn-travel-v324-1';
const APP_CACHE_RELEASE = `${WWZ_PWA_VERSION}-ios-safari-tab-bridge-2`;
const MAP_CACHE_RELEASE = `${WWZ_PWA_CACHE_RELEASE_VERSION}-${WWZ_PWA_CACHE_REVISION}`;
const SHELL_CACHE = `${CACHE_PREFIX}shell-${APP_CACHE_RELEASE}`;
const STATIC_CACHE = `${CACHE_PREFIX}static-${APP_CACHE_RELEASE}`;
const MAP_TILE_CACHE = `${CACHE_PREFIX}map-tiles-${MAP_CACHE_RELEASE}`;
const MAP_DATA_CACHE = `${CACHE_PREFIX}map-data-${MAP_CACHE_RELEASE}`;
const MAP_TILE_CACHE_LIMIT = 180;
const MAP_DATA_CACHE_LIMIT = 8;
const STATIC_CACHE_LIMIT = 160;
const APP_SCOPE = new URL('./', self.registration.scope);

const scopedUrl = (path) => new URL(path, APP_SCOPE).href;

const APP_SHELL = [
  './index.html',
  './companion.html',
  './offline.html',
  './manifest.webmanifest',
  './assets/icons/pwa/icon-192.png',
  './assets/icons/pwa/icon-512.png',
  './assets/icons/pwa/icon-maskable-192.png',
  './assets/icons/pwa/icon-maskable-512.png',
  './assets/icons/pwa/apple-touch-icon-180.png',
  './assets/favicon.png',
  './assets/branding/nasdara-community.webp',
  './assets/branding/nasdara-pve.webp',
  './assets/branding/nasdara-pvp.webp',
  './assets/css/pages/home.css?v=1.22.94&rev=pvp-availability-1',
  './assets/css/pages/companion.css?v=1.53.0&rev=companion-download-repair-1',
  './assets/css/site-polish.css?v=1.22.93',
  './assets/css/pwa.css?v=1.22.93',
  './assets/css/ui-system.css?v=1.24.0&rev=ops-ui-1',
  './assets/js/pages/home.js?v=1.53.1&rev=companion-nav-1',
  './assets/js/pages/companion.js?v=1.53.2&rev=android7-compat-1&copy=plain-1',
  './assets/data/companion-release.json',
  './assets/js/pwa.js?v=1.61.1&rev=companion-nav-1',
  './assets/css/modern-foundation.css?v=1.62.0&rev=modern-ui-1',
  './assets/css/survivor-experience.css?v=1.63.0&rev=survivor-ux-1',
  './assets/css/community-experience.css?v=1.64.0&rev=community-ux-1',
  './assets/css/sitewide-experience.css?v=2.0.1&rev=site-qol-1',
  './assets/js/dashboard/community-experience.js?v=1.64.0&rev=community-ux-1',
  './assets/js/pages/shop-experience.js?v=1.63.0&rev=survivor-ux-1',
  './assets/js/ui-system.js?v=2.0.1&rev=nav-dedupe-1',
  './assets/css/site-refinement.css?v=2.1.0&rev=sitewide-ui-1',
  './assets/css/sitewide-v313-controls.css?v=3.13.0&rev=forms-navigation-1',
  './assets/css/dashboard/command-palette-v314.css?v=3.14.0&rev=touch-search-1',
  './assets/css/dashboard/mobile-v315.css?v=3.15.0&rev=mobile-usability-1',
  './assets/css/dashboard/topbar-v316.css?v=3.16.0&rev=mobile-header-1',
  './assets/css/dashboard/workspace-v317.css?v=3.17.0&rev=workspace-polish-1',
  './assets/css/dashboard/policy-account-v318.css?v=3.19.2&rev=audit-isolation-1',
  './assets/css/dashboard/linked-psn-v320.css?v=3.20.0&rev=psn-alts-1',
  './assets/js/dashboard/linked-psn-v320.js?v=3.20.3&rev=psn-alts-4',
  './assets/css/dashboard/psn-alt-admin-v321.css?v=3.21.0&rev=psn-admin-1',
  './assets/js/dashboard/psn-alt-admin-v321.js?v=3.21.0&rev=psn-admin-1',
  './assets/js/dashboard/getting-started-v323.js?v=3.23.0&rev=player-guide-1',
  './assets/css/dashboard/getting-started-v323.css?v=3.23.0&rev=player-guide-1',
  './assets/js/dashboard/policy-account-v318.js?v=3.19.1&rev=audit-route-1',
  './assets/js/dashboard/server-context.js?v=3.0.3&rev=topbar-mode-1',
  './assets/js/dashboard/shell.js?v=1.25.2&rev=palette-touch-1',
  './assets/js/site-refinement.js?v=2.1.1&rev=breadcrumb-fix-1',
  './assets/js/core/cart-deliveries.js?v=2.1.0',
  './assets/css/components/cart-deliveries.css?v=2.1.0',
  './assets/js/dashboard/modern-navigation.js?v=1.62.0&rev=modern-ui-1',
  './assets/css/workspace-phase2.css?v=2.2.0&rev=dashboard-phase2-1',
  './assets/js/dashboard/workspace-phase2.js?v=2.2.0&rev=dashboard-phase2-1',
  './assets/css/command-centre-v3.css?v=3.0.0&rev=command-centre-redesign-1',
  './assets/js/command-centre-v3.js?v=3.0.0&rev=command-centre-redesign-1',
  './assets/css/command-centre-v3-layout-recovery.css?v=3.0.1&rev=v3-layout-recovery-1',
  './assets/css/map-hub-v35.css?v=3.5.0&rev=all-pages-1',
  './assets/css/pages/public-v36.css?v=3.6.0&rev=release-layout-1',
  './assets/css/dashboard/navigation-v31.css?v=3.1.0&rev=nav-overhaul-1',
  './assets/js/dashboard/navigation-v31.js?v=3.1.1&rev=sidebar-density-1',
  './assets/css/dashboard/sidebar-v310.css?v=3.10.0&rev=category-jump-1',
  './assets/css/dashboard/workspace-v311-final.css?v=3.11.0&rev=workspace-complete-1',
  './tools/armband-calibration.html',
  './tools/signboard-studio.html',
  './assets/css/tools/signboard-studio.css?v=0.5.0&rev=portable-billboard-1',
  './assets/js/tools/signboard-studio.js?v=0.5.0&rev=portable-billboard-1',
  './assets/js/tools/portable-billboard.js?v=0.5.0&rev=portable-billboard-1',
  './assets/js/tools/armband-calibration.js?v=0.1.0&rev=nasdara-lab-1',
  './assets/js/dashboard/sidebar-v310.js?v=3.10.0&rev=category-jump-1',
  './assets/css/dashboard/workspace-directory-v312.css?v=3.12.0&rev=overview-directory-1',
  './assets/js/dashboard/workspace-directory-v312.js?v=3.12.0&rev=overview-directory-1',
  './assets/css/site-policy-acceptance.css?v=1.0.0&rev=policy-20261112-1',
  './assets/js/site-policy-acceptance.js?v=1.1.1&rev=single-account-prompt-1',
  './assets/css/dashboard/workspace-v32-profile-gps.css?v=3.2.0&rev=profile-gps-v32-1',
  './assets/js/dashboard/workspace-v32-profile-gps.js?v=3.2.0&rev=profile-gps-v32-1',
  './assets/css/dashboard/workspace-v32-economy.css?v=3.2.1&rev=v3-2-finance-1',
  './assets/js/dashboard/workspace-v32-economy.js?v=3.2.1&rev=v3-2-finance-1',
  './assets/css/dashboard/workspace-v32-community.css?v=3.2.2&rev=v3-2-community-2',
  './assets/js/dashboard/workspace-v32-community.js?v=3.2.2&rev=v3-2-community-2',
  './assets/css/dashboard/workspace-v33-administration.css?v=3.3.0&rev=v33-admin-owner-1',
  './assets/css/dashboard/overview-v38.css?v=3.8.0&rev=overview-compact-1',
  './assets/css/dashboard/shell-v37.css?v=3.7.1&rev=top-offset-1',
  './assets/js/dashboard/workspace-v33-administration.js?v=3.3.0&rev=v33-admin-owner-1'
].map(scopedUrl);

const UPDATE_INVALIDATIONS = [];


const trimCache = async (cacheName, limit) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= limit) return;
  await Promise.all(keys.slice(0, keys.length - limit).map((request) => cache.delete(request)));
};

const cacheResponse = async (cacheName, request, response, limit = 0) => {
  if (!response || !response.ok || response.type === 'opaque') return;
  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
  if (limit > 0) await trimCache(cacheName, limit);
};

const precacheShell = async () => {
  const cache = await caches.open(SHELL_CACHE);
  await Promise.all(APP_SHELL.map(async (url) => {
    const request = new Request(url, { cache: 'reload' });
    const response = await fetch(request);
    if (!response.ok) throw new Error(`Unable to precache ${url}`);
    await cache.put(request, response);
  }));
};

self.addEventListener('install', (event) => {
  event.waitUntil(precacheShell());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL_CACHE, STATIC_CACHE, MAP_TILE_CACHE, MAP_DATA_CACHE]);
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith(CACHE_PREFIX) && !keep.has(name))
      .map((name) => caches.delete(name)));


    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

const navigationCacheKey = (request) => {
  const url = new URL(request.url);
  url.search = '';
  url.hash = '';
  return new Request(url.href, { method: 'GET' });
};

const networkFirstNavigation = async (request) => {
  const key = navigationCacheKey(request);
  try {
    const response = await fetch(request);
    if (response.ok) await cacheResponse(SHELL_CACHE, key, response);
    return response;
  } catch {
    const cached = await caches.match(key);
    if (cached) return cached;
    return (await caches.match(scopedUrl('./offline.html'))) || Response.error();
  }
};

const staleWhileRevalidate = async (request) => {
  const cached = await caches.match(request);
  const refresh = fetch(request)
    .then(async (response) => {
      await cacheResponse(STATIC_CACHE, request, response, STATIC_CACHE_LIMIT);
      return response;
    })
    .catch(() => null);
  if (cached) {
    refresh.catch(() => null);
    return cached;
  }
  return (await refresh) || Response.error();
};

const networkFirstStatic = async (request) => {
  try {
    const response = await fetch(request);
    await cacheResponse(STATIC_CACHE, request, response, STATIC_CACHE_LIMIT);
    return response;
  } catch {
    return (await caches.match(request)) || Response.error();
  }
};

const cacheFirstMapTile = async (request) => {
  const cache = await caches.open(MAP_TILE_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    await cacheResponse(MAP_TILE_CACHE, request, response, MAP_TILE_CACHE_LIMIT);
    return response;
  } catch {
    return Response.error();
  }
};

const networkFirstMapData = async (request) => {
  const cache = await caches.open(MAP_DATA_CACHE);
  try {
    const response = await fetch(request);
    await cacheResponse(MAP_DATA_CACHE, request, response, MAP_DATA_CACHE_LIMIT);
    return response;
  } catch {
    return (await cache.match(request)) || Response.error();
  }
};

const isMapTile = (pathname) =>
  pathname.endsWith('/assets/maps/nasdara/satellite.webp');

const isMapData = (pathname) =>
  pathname.includes('/assets/maps/nasdara/');

const isStaticAsset = (pathname) =>
  /[.](?:css|js|gif|png|jpg|jpeg|webp|svg|webmanifest|json)$/i.test(pathname);

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(APP_SCOPE.pathname)) return;

  const relativePath = `/${url.pathname.slice(APP_SCOPE.pathname.length)}`;
  if (relativePath.startsWith('/api/') || url.pathname.endsWith('/sw.js')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }
  if (isMapTile(url.pathname)) {
    event.respondWith(cacheFirstMapTile(request));
    return;
  }
  if (isMapData(url.pathname)) {
    event.respondWith(networkFirstMapData(request));
    return;
  }
  if (url.pathname.endsWith('/manifest.webmanifest')
      || url.pathname.endsWith('/assets/data/companion-release.json')
      // Keep sign-in and guild-scoped access handling current in installed PWAs.
      // A stale script could incorrectly clear the shared Discord session.
      || url.pathname.endsWith('/assets/js/dashboard/account.js')
      || url.pathname.endsWith('/assets/js/dashboard/ios-auth-handoff.js')
      || url.pathname.endsWith('/assets/js/dashboard/core.js')
      || url.pathname.endsWith('/assets/js/dashboard/administration.js')
      || url.pathname.endsWith('/assets/js/dashboard/operations-centre.js')
      || url.pathname.endsWith('/assets/js/dashboard/shop.js')
      || url.pathname.endsWith('/assets/js/dashboard/delivery.js')) {
    event.respondWith(networkFirstStatic(request));
    return;
  }
  if (isStaticAsset(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

const notificationTarget = (rawUrl = '') => {
  const value = String(rawUrl || '').trim();
  if (!value) return scopedUrl('./dashboard.html');
  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      return parsed.origin === self.location.origin ? parsed.href : scopedUrl('./dashboard.html');
    } catch {
      return scopedUrl('./dashboard.html');
    }
  }
  const normalized = value.replace(/^\/+/, '');
  return scopedUrl(`./${normalized}`);
};

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : '' };
  }
  const title = String(payload.title || 'World War Z');
  const body = String(payload.body || 'There is a new World War Z update.');
  const topic = String(payload.topic || 'community');
  const url = notificationTarget(payload.url || './dashboard.html');
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: scopedUrl('./assets/icons/pwa/icon-192.png'),
    badge: scopedUrl('./assets/icons/pwa/icon-192.png'),
    tag: `wwz-${topic}`,
    renotify: false,
    data: { url, topic },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = notificationTarget(event.notification?.data?.url || './dashboard.html');
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      try {
        const current = new URL(client.url);
        const wanted = new URL(target);
        if (current.origin === wanted.origin && current.pathname === wanted.pathname) {
          await client.navigate(target);
          return client.focus();
        }
      } catch {
        // Ignore malformed historical client URLs and fall through to openWindow.
      }
    }
    return self.clients.openWindow(target);
  })());
});
