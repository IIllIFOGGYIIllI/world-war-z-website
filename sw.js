'use strict';

const WWZ_PWA_VERSION = '1.25.5';
const CACHE_PREFIX = 'wwz-pwa-';
const WWZ_PWA_CACHE_REVISION = 'console-pve-travel-1';
const CACHE_RELEASE = `${WWZ_PWA_VERSION}-${WWZ_PWA_CACHE_REVISION}`;
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
  './assets/css/site-polish.css?v=1.22.93',
  './assets/css/pwa.css?v=1.22.93',
  './assets/css/ui-system.css?v=1.24.0&rev=ops-ui-1',
  './assets/js/pages/home.js?v=1.22.93',
  './assets/js/pwa.js?v=1.22.93',
  './assets/js/ui-system.js?v=1.24.0&rev=ops-ui-1'
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
  /\/assets\/maps\/(?:chernarus|livonia)\/tiles\//.test(pathname) ||
  /\/assets\/chernarus-map\/satellite-corrected\//.test(pathname);

const isMapData = (pathname) =>
  /\/assets\/maps\/(?:chernarus|livonia)\/(?:roads\.geojson|labels\.json)$/.test(pathname) ||
  /\/assets\/chernarus-map\/overlays\//.test(pathname);

const isStaticAsset = (pathname) =>
  /\.(?:css|js|png|jpg|jpeg|webp|svg|webmanifest|json)$/i.test(pathname);

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
  if (url.pathname.endsWith('/manifest.webmanifest')) {
    event.respondWith(networkFirstStatic(request));
    return;
  }
  if (isStaticAsset(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
