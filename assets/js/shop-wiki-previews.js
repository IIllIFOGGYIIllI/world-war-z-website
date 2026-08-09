(() => {
  'use strict';

  const WIKI_BASE = 'https://dayz.fandom.com';
  const API_URL = `${WIKI_BASE}/api.php`;
  const CACHE_KEY = 'wwz_dayz_wiki_previews_v1';
  const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
  const NEGATIVE_TTL_MS = 24 * 60 * 60 * 1000;
  const MAX_CACHE_ENTRIES = 2500;
  const MAX_CONCURRENT = 4;
  const REQUEST_TIMEOUT_MS = 8000;

  const CLASS_ALIASES = new Map(Object.entries({
    offroadhatchback: 'Ada 4x4',
    civiliansedan: 'Olga 24',
    hatchback02: 'Gunter 2',
    sedan02: 'Sarka 120',
    offroad02: 'M1025',
    truck01covered: 'M3S',
    truck01chassis: 'M3S',
    m4a1: 'M4-A1',
    akm: 'KA-M',
    ak101: 'KA-101',
    ak74: 'KA-74',
    aks74u: 'KAS-74U',
    fal: 'LAR',
    svd: 'VSD',
    asval: 'SVAL',
    aug: 'AUR A1',
    augshort: 'AUR AX',
    cz527: 'CR-527',
    cz550: 'CR-550 Savanna',
    winchester70: 'M70 Tundra',
    mp5k: 'SG5-K',
    ump45: 'USG-45',
    cz61: 'CR-61 Skorpion',
    glock19: 'Mlock-91',
    fnx45: 'FX-45',
    makarovij70: 'IJ-70',
    colt1911: 'Kolt 1911',
    izh18: 'BK-18',
    izh43shotgun: 'BK-43',
    mp133shotgun: 'BK-133',
    b95: 'Blaze',
    sks: 'SK 59/66',
    ruger1022: 'Sporter 22',
    magnum: 'Revolver',
    bandagedressing: 'Bandage',
    salinebagiv: 'Saline Bag IV',
    bloodbagiv: 'Blood Bag IV',
    epinephrine: 'Epinephrine Auto-Injector',
    morphine: 'Morphine Auto-Injector',
    charcoaltablets: 'Charcoal Tablets',
    tetracyclineantibiotics: 'Tetracycline Pills',
    vitaminbottle: 'Multivitamin Pills',
    painkillertablets: 'Codeine Pills',
    nvgoggles: 'Night Vision Goggles',
    nvgheadstrap: 'NVG Headstrap',
    battery9v: '9V Battery',
    carpattery: 'Car Battery',
    carbattery: 'Car Battery',
    carradiator: 'Car Radiator',
    sparkplug: 'Spark Plug',
    glowplug: 'Glow Plug',
    hatchbackwheel: 'Ada 4x4 Wheel',
    offroadwheel: 'Ada 4x4 Wheel',
    civiliansedawnheel: 'Olga 24 Wheel',
    civiliansedanwheel: 'Olga 24 Wheel',
    hatchback02wheel: 'Gunter 2 Wheel',
    sedan02wheel: 'Sarka 120 Wheel',
    offroad02wheel: 'M1025 Wheel',
    truck01wheel: 'M3S Wheel',
    truck01wheeldouble: 'M3S Double Wheel'
  }));

  const FILE_ALIASES = new Map(Object.entries({
    akm: 'AKM.png',
    ak101: 'AK101.png',
    ak74: 'AK74.png',
    aks74u: 'AKS74U.png',
    m4a1: 'M4A1.png',
    m67grenade: 'M67Grenade.png',
    landmine: 'LandMine.png',
    hatchbackwheel: 'OffroadWheel.png',
    offroadwheel: 'OffroadWheel.png',
    sparkplug: 'SparkPlug 1.png',
    carradiator: 'RadiatorCar.png',
    truckbattery: 'TruckBattery.png',
    bandagedressing: 'Bandage new.png',
    salinebag: 'SalineBag.png',
    rope: 'Rope.png',
    screwdriver: 'Screwdriver.png',
    sewingkit: 'Sewing Kit.png',
    sharpeningstone: 'Sharpening Stone.png',
    beartrap: 'BearTrap.png',
    binoculars: 'Binoculars.png',
    rangefinder: 'Rangefinder.png'
  }));

  let cache = null;
  const inflight = new Map();
  const queue = [];
  let activeRequests = 0;

  const normalize = (value) => String(value || '')
    .toLowerCase()
    .replace(/^file:/, '')
    .replace(/\.(png|jpe?g|webp|gif)$/i, '')
    .replace(/[^a-z0-9]+/g, '');

  const humanise = (value) => String(value || '')
    .replace(/_/g, ' ')
    .replace(/(?<=[a-z0-9])(?=[A-Z])/g, ' ')
    .replace(/(?<=[A-Z])(?=[A-Z][a-z])/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const stripVariant = (value) => String(value || '')
    .replace(/_(Black|Green|Blue|White|Red|Orange|Yellow|Grey|Gray|Camo|Pink|Brown|Olive|Tan)$/i, '')
    .trim();

  const itemClassname = (item) => {
    const type = Array.isArray(item?.types) ? item.types.find(Boolean) : '';
    return String(type || '').trim();
  };

  const itemKey = (item) => {
    const cls = itemClassname(item);
    return normalize(cls || item?.sku || item?.name || item?.item_id || 'unknown');
  };

  const loadCache = () => {
    if (cache) return cache;
    try {
      const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      cache = parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      cache = {};
    }
    return cache;
  };

  const trimCache = () => {
    const entries = Object.entries(loadCache());
    if (entries.length <= MAX_CACHE_ENTRIES) return;
    entries.sort((a, b) => Number(b[1]?.ts || 0) - Number(a[1]?.ts || 0));
    cache = Object.fromEntries(entries.slice(0, MAX_CACHE_ENTRIES));
  };

  const saveCache = () => {
    try {
      trimCache();
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
      // Preview caching is optional; a full/blocked localStorage must never break the shop.
    }
  };

  const cachedResult = (key) => {
    const entry = loadCache()[key];
    if (!entry) return undefined;
    const ttl = entry.url ? CACHE_TTL_MS : NEGATIVE_TTL_MS;
    if (Date.now() - Number(entry.ts || 0) > ttl) {
      delete cache[key];
      return undefined;
    }
    return entry;
  };

  const setCachedResult = (key, result) => {
    loadCache()[key] = {
      url: String(result?.url || ''),
      page: String(result?.page || ''),
      title: String(result?.title || ''),
      ts: Date.now()
    };
    saveCache();
  };

  const candidateTitles = (item) => {
    const cls = itemClassname(item);
    const stripped = stripVariant(cls);
    const values = [
      CLASS_ALIASES.get(normalize(cls)),
      CLASS_ALIASES.get(normalize(stripped)),
      item?.name,
      humanise(stripped),
      humanise(cls),
      stripped,
      cls
    ];
    const seen = new Set();
    return values.map((value) => String(value || '').trim()).filter((value) => {
      const key = normalize(value);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 6);
  };

  const candidateFileUrls = (item) => {
    const cls = itemClassname(item);
    const stripped = stripVariant(cls);
    const files = [
      FILE_ALIASES.get(normalize(cls)),
      FILE_ALIASES.get(normalize(stripped)),
      cls ? `${cls}.png` : '',
      stripped && stripped !== cls ? `${stripped}.png` : '',
      item?.name ? `${item.name}.png` : ''
    ];
    const seen = new Set();
    return files.map((name) => String(name || '').trim()).filter((name) => {
      const key = name.toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 2).map((name) => `${WIKI_BASE}/wiki/Special:Redirect/file/${encodeURIComponent(name)}`);
  };

  const scoreTitle = (title, candidates, item) => {
    const raw = String(title || '').replace(/^File:/i, '').replace(/\.(png|jpe?g|webp|gif)$/i, '');
    const norm = normalize(raw);
    if (!norm) return -1000;
    let score = 0;
    candidates.forEach((candidate, index) => {
      const c = normalize(candidate);
      if (!c) return;
      if (norm === c) score = Math.max(score, 1000 - index * 20);
      else if (norm.startsWith(c) || c.startsWith(norm)) score = Math.max(score, 760 - index * 15);
      else if (norm.includes(c) || c.includes(norm)) score = Math.max(score, 620 - index * 12);
      else {
        const tokens = humanise(candidate).toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 1);
        const matched = tokens.filter((token) => raw.toLowerCase().includes(token)).length;
        if (tokens.length) score = Math.max(score, Math.round((matched / tokens.length) * 500) - index * 10);
      }
    });
    const lower = raw.toLowerCase();
    const itemText = `${item?.name || ''} ${itemClassname(item)}`.toLowerCase();
    if (/\bmod\b/.test(lower) && !/\bmod\b/.test(itemText)) score -= 350;
    if (/(legacy|old version|wip|interior|rear|front|broken|damaged|used)/.test(lower) && !/(legacy|old|interior|rear|front|broken|damaged|used)/.test(itemText)) score -= 120;
    return score;
  };

  const wikiFetch = async (params) => {
    const url = new URL(API_URL);
    Object.entries({ action: 'query', format: 'json', formatversion: '2', origin: '*', ...params })
      .forEach(([key, value]) => url.searchParams.set(key, String(value)));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url.toString(), { headers: { Accept: 'application/json' }, signal: controller.signal });
      if (!response.ok) throw new Error(`DayZ Wiki returned ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  };

  const articleSearch = async (item, candidates) => {
    for (const query of candidates.slice(0, 1)) {
      try {
        const payload = await wikiFetch({
          generator: 'search',
          gsrsearch: query,
          gsrnamespace: '0',
          gsrlimit: '6',
          prop: 'pageimages|info',
          pithumbsize: '720',
          inprop: 'url'
        });
        const pages = Array.isArray(payload?.query?.pages) ? payload.query.pages : [];
        const ranked = pages
          .filter((page) => page?.thumbnail?.source)
          .map((page) => ({
            url: String(page.thumbnail.source),
            page: String(page.fullurl || `${WIKI_BASE}/wiki/${encodeURIComponent(String(page.title || '').replace(/ /g, '_'))}`),
            title: String(page.title || ''),
            score: scoreTitle(page.title, candidates, item)
          }))
          .sort((a, b) => b.score - a.score);
        if (ranked[0] && ranked[0].score >= 200) return ranked[0];
      } catch {
        // Try the next title and ultimately the static fallback.
      }
    }
    return null;
  };

  const fileSearch = async (item, candidates) => {
    for (const query of candidates.slice(0, 2)) {
      try {
        const payload = await wikiFetch({
          generator: 'search',
          gsrsearch: query,
          gsrnamespace: '6',
          gsrlimit: '8',
          prop: 'imageinfo',
          iiprop: 'url',
          iiurlwidth: '720'
        });
        const pages = Array.isArray(payload?.query?.pages) ? payload.query.pages : [];
        const ranked = pages.map((page) => {
          const info = Array.isArray(page?.imageinfo) ? page.imageinfo[0] : null;
          return {
            url: String(info?.thumburl || info?.url || ''),
            page: `${WIKI_BASE}/wiki/${encodeURIComponent(String(page?.title || '').replace(/ /g, '_'))}`,
            title: String(page?.title || ''),
            score: scoreTitle(page?.title, candidates, item)
          };
        }).filter((entry) => entry.url).sort((a, b) => b.score - a.score);
        if (ranked[0] && ranked[0].score >= 180) return ranked[0];
      } catch {
        // A failed third-party preview lookup must never affect shop functionality.
      }
    }
    return null;
  };

  const resolveFromWiki = async (item) => {
    const key = itemKey(item);
    if (!key) return null;
    const cached = cachedResult(key);
    if (cached !== undefined) return cached?.url ? cached : null;
    if (inflight.has(key)) return inflight.get(key);

    const promise = (async () => {
      const candidates = candidateTitles(item);
      let result = await articleSearch(item, candidates);
      if (!result) result = await fileSearch(item, candidates);
      setCachedResult(key, result || {});
      return result;
    })().finally(() => inflight.delete(key));

    inflight.set(key, promise);
    return promise;
  };

  const pumpQueue = () => {
    while (activeRequests < MAX_CONCURRENT && queue.length) {
      const task = queue.shift();
      activeRequests += 1;
      Promise.resolve().then(task.run).finally(() => {
        activeRequests -= 1;
        pumpQueue();
      });
    }
  };

  const enqueue = (run) => new Promise((resolve) => {
    queue.push({ run: () => Promise.resolve(run()).then(resolve, () => resolve(null)) });
    pumpQueue();
  });

  const tryDirectCandidates = (image, item, fallback) => new Promise((resolve) => {
    const candidates = candidateFileUrls(item);
    let index = 0;
    const cleanup = () => {
      image.removeEventListener('load', loaded);
      image.removeEventListener('error', failed);
    };
    const loaded = () => {
      cleanup();
      resolve({ url: image.currentSrc || image.src, page: '', title: '' });
    };
    const failed = () => {
      if (index < candidates.length) {
        image.src = candidates[index++];
        return;
      }
      cleanup();
      image.src = fallback;
      resolve(null);
    };
    image.addEventListener('load', loaded);
    image.addEventListener('error', failed);
    failed();
  });

  const applyResolved = (image, result, fallback) => {
    if (!result?.url) {
      image.src = fallback;
      image.dataset.previewSource = 'fallback';
      return;
    }
    image.src = result.url;
    image.dataset.previewSource = 'dayz-wiki';
    image.title = 'Preview sourced from DayZ Wiki';
    if (result.page) image.dataset.previewPage = result.page;
    image.addEventListener('error', () => {
      image.src = fallback;
      image.dataset.previewSource = 'fallback';
      delete image.dataset.previewPage;
    }, { once: true });
  };

  const resolveImage = async (image) => {
    if (!image || image.dataset.previewResolved === 'true') return;
    image.dataset.previewResolved = 'true';
    const item = image.__wwzPreviewItem;
    const fallback = image.__wwzPreviewFallback;
    if (!item || !fallback) return;

    const manual = String(item?.preview_image_url || '').trim();
    if (manual.startsWith('https://')) {
      image.src = manual;
      image.dataset.previewSource = 'manual';
      image.title = 'Custom catalogue preview';
      image.addEventListener('error', () => {
        image.src = fallback;
        image.dataset.previewSource = 'fallback';
      }, { once: true });
      return;
    }

    const key = itemKey(item);
    const cached = key ? cachedResult(key) : undefined;
    if (cached?.url) {
      applyResolved(image, cached, fallback);
      return;
    }
    if (cached !== undefined && !cached?.url) {
      image.src = fallback;
      return;
    }

    const direct = await tryDirectCandidates(image, item, fallback);
    if (direct?.url) {
      setCachedResult(key, direct);
      image.dataset.previewSource = 'dayz-wiki';
      image.title = 'Preview sourced from DayZ Wiki';
      return;
    }

    const result = await enqueue(() => resolveFromWiki(item));
    applyResolved(image, result, fallback);
  };

  const observer = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      resolveImage(entry.target);
    });
  }, { rootMargin: '700px 0px' }) : null;

  const createImage = (item, fallback, className) => {
    const image = document.createElement('img');
    image.className = className || 'shop-item-preview-image';
    image.loading = 'lazy';
    image.decoding = 'async';
    image.referrerPolicy = 'no-referrer';
    image.alt = `${item?.name || 'DayZ item'} preview`;
    image.src = fallback;
    image.__wwzPreviewItem = item;
    image.__wwzPreviewFallback = fallback;
    if (observer) observer.observe(image);
    else resolveImage(image);
    return image;
  };

  window.WWZShopWikiPreviews = Object.freeze({
    createImage,
    resolveImage,
    wikiBase: WIKI_BASE,
    clearCache() {
      cache = {};
      try { localStorage.removeItem(CACHE_KEY); } catch {}
    }
  });
})();
