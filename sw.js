'use strict';

const WWZ_PWA_VERSION = '1.39.0';
const CACHE_PREFIX = 'wwz-pwa-';
const WWZ_PWA_CACHE_REVISION = 'community-workflows-1';
// Public release versions can advance without discarding the bounded map caches.
// Keep this cache-generation version until a deliberate cache migration is needed.
const WWZ_PWA_CACHE_RELEASE_VERSION = '1.27.0';
// Bump this token on every deployed website update. Changing sw.js makes installed
// PWAs/TWAs discover the update and surface the existing "Update Now" flow.
const WWZ_PWA_UPDATE_REVISION = '2026-09-05-website-v1-39-0';
const CACHE_RELEASE = `${WWZ_PWA_CACHE_RELEASE_VERSION}-${WWZ_PWA_CACHE_REVISION}`;
const SHELL_CACHE = `${CACHE_PREFIX}shell-${CACHE_RELEASE}`;
const STATIC_CACHE = `${CACHE_PREFIX}static-${CACHE_RELEASE}`;
const MAP_TILE_CACHE = `${CACHE_PREFIX}map-tiles-${CACHE_RELEASE}`;
const MAP_DATA_CACHE = `${CACHE_PREFIX}map-data-${CACHE_RELEASE}`;
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
  './assets/world-war-z-icon.png',
  './assets/world-war-z-logo.webp',
  './assets/css/pages/home.css?v=1.22.93',
  './assets/css/pages/companion.css?v=1.22.93',
  './assets/css/site-polish.css?v=1.22.93',
  './assets/css/pwa.css?v=1.22.93',
  './assets/css/ui-system.css?v=1.24.0&rev=ops-ui-1',
  './assets/js/pages/home.js?v=1.22.93',
  './assets/js/pages/companion.js?v=1.22.93',
  './assets/data/companion-release.json',
  './assets/js/pwa.js?v=1.22.93',
  './assets/js/ui-system.js?v=1.24.0&rev=ops-ui-1'
].map(scopedUrl);

const UPDATE_INVALIDATIONS = [
  // Remove pre-v1.28 request keys without rotating the map-cache generation.
  './assets/js/dashboard/bootstrap.js?v=1.22.93&rev=auth-restore-fix-1',
  './assets/js/dashboard/my-wwz.js?v=1.27.0&rev=my-wwz-m09-1',
  './assets/css/dashboard/my-wwz.css?v=1.27.0&rev=my-wwz-m09-1',
  './assets/js/dashboard/command-centre.js?v=1.22.93',
  './assets/css/dashboard/command-centre-m10.css?v=1.27.0&rev=m10-admin-push-1',
  './assets/js/dashboard/community.js?v=1.33.0&rev=events-overhaul-1',
  './assets/css/dashboard/community.css?v=1.33.0&rev=events-overhaul-1',
  './assets/js/dashboard/lazy-assets.js?v=1.27.0&rev=community-workflows-1',
  // Canonical v1.28 request keys are listed as targeted safety invalidations too.
  './assets/js/dashboard/bootstrap.js?v=1.28.0&rev=website-v1-28-0',
  './assets/js/dashboard/my-wwz.js?v=1.28.0&rev=my-wwz-m09-polish-1',
  './assets/css/dashboard/my-wwz.css?v=1.28.0&rev=my-wwz-m09-polish-1',
  './assets/js/dashboard/command-centre.js?v=1.28.0&rev=m10-admin-push-1',
  './assets/css/dashboard/command-centre-m10.css?v=1.28.0&rev=m10-admin-push-1',
  './assets/js/dashboard/lazy-assets.js?v=1.28.0&rev=website-v1-28-0',
  './flags.html',
  // Clear the original v1.29.0 Flag Claims request keys before serving the polished v1.29.1 UI and v1.29.2 actual DayZ flag artwork.
  './assets/js/pages/flags.js?v=1.29.0&rev=flag-claims-1',
  './assets/css/pages/flags.css?v=1.29.0&rev=flag-claims-1',
  './assets/js/dashboard/flag-claims.js?v=1.29.0&rev=flag-claims-1',
  './assets/css/dashboard/flag-claims.css?v=1.29.0&rev=flag-claims-1',
  './assets/js/dashboard/lazy-assets.js?v=1.29.0&rev=flag-claims-1',
  './assets/js/pages/flags.js?v=1.29.2&rev=real-dayz-flags-1',
  './assets/css/pages/flags.css?v=1.29.2&rev=real-dayz-flags-1',
  './assets/js/dashboard/flag-claims.js?v=1.30.0&rev=flag-phase2-1',
  './assets/css/dashboard/flag-claims.css?v=1.30.0&rev=flag-phase2-1',
  './assets/js/dashboard/lazy-assets.js?v=1.30.0&rev=flag-phase2-1',
  './assets/js/dashboard/administration.js?v=1.22.93&rev=discord-channel-refresh-1',
  './assets/js/dashboard/administration.js?v=1.31.0&rev=player-intelligence-1',
  './assets/js/dashboard/lazy-assets.js?v=1.37.0&rev=quest-commerce-1',
  './assets/js/dashboard/action-centre.js?v=1.38.0&rev=action-centre-1',
  './assets/css/dashboard/action-centre.css?v=1.38.0&rev=action-centre-1',
  './assets/js/dashboard/lazy-assets.js?v=1.38.0&rev=action-centre-1',
  './assets/js/dashboard/objectives.js?v=1.37.0&rev=quest-progression-1',
  './assets/css/dashboard/objectives.css?v=1.37.0&rev=quest-progression-1',
  './assets/js/dashboard/progression.js?v=1.37.0&rev=quest-progression-1',
  './assets/css/dashboard/progression.css?v=1.37.0&rev=quest-progression-1',
  './assets/js/dashboard/donation-orders.js?v=1.37.0&rev=commerce-workflow-1',
  './assets/css/dashboard/donation-orders.css?v=1.37.0&rev=commerce-workflow-1',
  './assets/js/pages/donations.js?v=1.37.0&rev=commerce-workflow-1',
  './assets/css/pages/donations.css?v=1.37.0&rev=commerce-workflow-1',
  './assets/js/pages/shop.js?v=1.37.0&rev=commerce-workflow-1',
  './assets/css/pages/shop.css?v=1.37.0&rev=commerce-workflow-1',
  './assets/js/dashboard/administration.js?v=1.36.0&rev=operations-centre-1',
  './assets/js/dashboard/lazy-assets.js?v=1.36.0&rev=operations-centre-1',
  './assets/js/dashboard/core.js?v=1.36.0&rev=operations-centre-1',
  './assets/js/dashboard/operations-centre.js?v=1.36.0&rev=operations-centre-1',
  './assets/css/dashboard/operations-centre.css?v=1.36.0&rev=operations-centre-1',
  './assets/css/dashboard/player-intelligence.css?v=1.31.0&rev=player-intelligence-1',
  './assets/js/dashboard/lazy-assets.js?v=1.31.0&rev=player-intelligence-1',
  './assets/js/dashboard/deathmatch-rotation.js?v=1.32.0&rev=livonia-dm-1',
  './assets/css/dashboard/deathmatch-rotation.css?v=1.32.0&rev=livonia-dm-1',
  './assets/js/dashboard/lazy-assets.js?v=1.32.0&rev=livonia-dm-1',
  './assets/js/dashboard/factions.js?v=1.22.93&rev=2',
  './assets/css/dashboard/factions.css?v=1.22.93',
  './assets/js/dashboard/lazy-assets.js?v=1.33.0&rev=events-overhaul-1',
  './assets/js/pages/home.js?v=1.22.93',
  './assets/js/pwa.js?v=1.22.93',
  './assets/css/pwa.css?v=1.22.93',
  './assets/data/companion-release.json'
].map(scopedUrl);

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

    const staticCache = await caches.open(STATIC_CACHE);
    await Promise.all(UPDATE_INVALIDATIONS.map((url) => staticCache.delete(url)));

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
  pathname.includes('/assets/maps/chernarus/tiles/') ||
  pathname.includes('/assets/maps/livonia/tiles/') ||
  pathname.includes('/assets/chernarus-map/satellite-corrected/');

const isMapData = (pathname) =>
  pathname.endsWith('/assets/maps/chernarus/roads.geojson') ||
  pathname.endsWith('/assets/maps/chernarus/labels.json') ||
  pathname.endsWith('/assets/maps/livonia/roads.geojson') ||
  pathname.endsWith('/assets/maps/livonia/labels.json') ||
  pathname.includes('/assets/chernarus-map/overlays/');

const isStaticAsset = (pathname) =>
  /[.](?:css|js|png|jpg|jpeg|webp|svg|webmanifest|json)$/i.test(pathname);

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
  if (url.pathname.endsWith('/manifest.webmanifest') || url.pathname.endsWith('/assets/data/companion-release.json')) {
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
