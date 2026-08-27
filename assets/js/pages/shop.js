const API_BASE = 'https://world-war-z.up.railway.app';
const URLS = {
  authConfig: `${API_BASE}/api/auth/config`,
  authLogin: `${API_BASE}/api/auth/discord/login`,
  authComplete: `${API_BASE}/api/auth/discord/complete`,
  authMe: `${API_BASE}/api/auth/me`,
  authLogout: `${API_BASE}/api/auth/logout`,
  servers: `${API_BASE}/api/donations/servers`,
  catalogue: `${API_BASE}/api/shop/catalogue`,
  account: `${API_BASE}/api/account/shop`,
  purchase: `${API_BASE}/api/account/shop/purchase`,
  locations: `${API_BASE}/api/account/delivery/locations`,
  serverStatus: `${API_BASE}/api/server/status`
};
const SESSION_KEY = 'wwz_dashboard_session';
const SERVER_KEY = 'wwz_dashboard_server';
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const state = {
  token: sessionStorage.getItem(SESSION_KEY) || '',
  authEnabled: false,
  user: null,
  servers: [],
  server: null,
  settings: {},
  access: {},
  items: [],
  orders: [],
  locations: [],
  mode: 'manual',
  selectedItem: null,
  loading: false,
  purchasing: false,
  restart: null,
  cataloguePage: 1,
  cataloguePageSize: 24,
  catalogueSort: 'recommended',
  detailItem: null,
  orderScope: 'all'
};

const readSelectedServer = () => {
  try { return JSON.parse(sessionStorage.getItem(SERVER_KEY) || 'null'); } catch { return null; }
};
const saveSelectedServer = (server) => {
  state.server = server || null;
  try {
    if (server) sessionStorage.setItem(SERVER_KEY, JSON.stringify(server));
    else sessionStorage.removeItem(SERVER_KEY);
  } catch {}
};
const acceptServerContext = (payload) => {
  const servers = Array.isArray(payload?.servers) ? payload.servers : [];
  const stored = readSelectedServer();
  const server = servers.find((entry) => entry?.key === stored?.key) || null;
  if (!server || !['chernarus', 'livonia'].includes(String(server.map_key || '').toLowerCase())) return;
  saveSelectedServer(server);
  const mapName = String(server.map_name || (server.map_key === 'livonia' ? 'Livonia' : 'Chernarus'));
  const heroMap = document.querySelector('.shop-hero-image strong');
  if (heroMap) heroMap.textContent = mapName.toUpperCase();
  const mapFooter = document.querySelector('[data-shop-map-footer]');
  if (mapFooter) mapFooter.textContent = `World War Z · PlayStation DayZ · ${mapName}`;
  const coordinateMap = document.querySelector('[data-member-coordinate-map]');
  if (coordinateMap) {
    coordinateMap.setAttribute('aria-label', `${mapName} delivery coordinate selector. Click or tap to fill X and Z.`);
  }
  const worldSize = server.map_key === 'livonia' ? 12800 : 15360;
  [document.querySelector('[data-member-delivery-x]'), document.querySelector('[data-member-delivery-z]')].forEach((input) => {
    if (input) input.max = String(worldSize);
  });
};
const activeMapKey = () => String(state.server?.map_key || '').toLowerCase();
const activeWorldSize = () => state.server?.map_key === 'livonia' ? 12800 : state.server?.map_key === 'chernarus' ? 15360 : null;

const elements = {
  apiState: $('[data-shop-api-state]'), apiLabel: $('[data-shop-api-label]'),
  authButton: $('[data-shop-auth-button]'), authLabel: $('[data-shop-auth-label]'),
  authAvatar: $('[data-shop-auth-avatar]'), signout: $('[data-shop-signout]'),
  loginDialog: $('[data-member-login-dialog]'), startLogin: $('[data-member-start-login]'),
  title: $('[data-member-shop-title]'), description: $('[data-member-shop-description]'),
  instructions: $('[data-member-shop-instructions]'), wallet: $('[data-member-shop-wallet]'),
  count: $('[data-member-shop-count]'), openOrders: $('[data-member-shop-open-orders]'),
  nextRestart: $('[data-member-shop-next-restart]'), restartCountdown: $('[data-member-shop-restart-countdown]'),
  access: $('[data-member-shop-access]'), accessNote: $('[data-member-shop-access-note]'),
  notice: $('[data-member-shop-notice]'), noticeTitle: $('[data-member-shop-notice-title]'),
  noticeCopy: $('[data-member-shop-notice-copy]'), heroImage: $('[data-shop-hero-image]'),
  search: $('[data-member-shop-search]'), category: $('[data-member-shop-category]'), sort: $('[data-member-shop-sort]'),
  pageSize: $('[data-member-shop-page-size]'), resetFilters: $('[data-member-shop-reset-filters]'),
  categoryList: $('[data-member-shop-category-list]'), categorySummary: $('[data-member-category-summary]'),
  resultsCount: $('[data-member-shop-results-count]'), resultsSummary: $('[data-member-shop-results-summary]'), pagination: $('[data-member-shop-pagination]'),
  catalogue: $('[data-member-shop-catalogue]'), empty: $('[data-member-shop-empty]'),
  error: $('[data-member-shop-error]'), refresh: $('[data-member-shop-refresh]'),
  modeLabel: $('[data-member-shop-mode-label]'), manualCount: $('[data-member-manual-count]'),
  eventCount: $('[data-member-event-count]'), ordersRefresh: $('[data-member-orders-refresh]'),
  ordersGuest: $('[data-member-orders-guest]'), ordersUnlinked: $('[data-member-orders-unlinked]'),
  orderList: $('[data-member-order-list]'), ordersEmpty: $('[data-member-orders-empty]'),
  ordersOverview: $('[data-member-orders-overview]'), ordersScope: $('[data-member-orders-scope]'),
  ordersOpen: $('[data-member-orders-open]'), ordersWaiting: $('[data-member-orders-waiting]'),
  ordersActiveRentals: $('[data-member-orders-active-rentals]'), ordersCompleted: $('[data-member-orders-completed]'),
  ordersResultSummary: $('[data-member-orders-result-summary]'),
  purchaseDialog: $('[data-member-purchase-dialog]'), purchaseForm: $('[data-member-purchase-form]'),
  purchaseTitle: $('[data-member-purchase-title]'), purchaseItem: $('[data-member-purchase-item]'),
  purchasePrice: $('[data-member-purchase-price]'), quantity: $('[data-member-purchase-quantity]'),
  quantityLabel: $('[data-member-quantity-label]'), quantityHelp: $('[data-member-quantity-help]'),
  eventFields: $('[data-member-event-fields]'), location: $('[data-member-delivery-location]'),
  coordinateInputs: $('[data-member-coordinate-inputs]'), x: $('[data-member-delivery-x]'),
  y: $('[data-member-delivery-y]'), z: $('[data-member-delivery-z]'), rotation: $('[data-member-delivery-rotation]'),
  coordinateMap: $('[data-member-coordinate-map]'),
  mapZoomIn: $('[data-member-map-zoom-in]'), mapZoomOut: $('[data-member-map-zoom-out]'), mapReset: $('[data-member-map-reset]'), mapFullscreen: $('[data-member-map-fullscreen]'),
  mapReadout: $('[data-member-map-readout]'),
  coordinateConfirm: $('[data-member-coordinate-confirm]'), note: $('[data-member-purchase-note]'),
  total: $('[data-member-purchase-total]'), purchaseMessage: $('[data-member-purchase-message]'),
  purchaseConfirm: $('[data-member-purchase-confirm]'),
  detailDialog: $('[data-member-item-detail-dialog]'), detailPreview: $('[data-member-item-detail-preview]'),
  detailCategory: $('[data-member-item-detail-category]'), detailTitle: $('[data-member-item-detail-title]'),
  detailPrice: $('[data-member-item-detail-price]'), detailSku: $('[data-member-item-detail-sku]'),
  detailDescription: $('[data-member-item-detail-description]'), detailMeta: $('[data-member-item-detail-meta]'),
  detailTypes: $('[data-member-item-detail-types]'), detailClassname: $('[data-member-item-detail-classname]'),
  detailBuy: $('[data-member-item-detail-buy]'),
  serverButtons: $('[data-shop-server-buttons]')
};
let checkoutMapInstance = null;

const money = (value) => `$${new Intl.NumberFormat('en-AU').format(Math.max(0, Number(value) || 0))}`;
const dateText = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Recently' : new Intl.DateTimeFormat('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit'
  }).format(date);
};
const titleCase = (value) => String(value || 'unknown').replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const durationText = (seconds) => {
  const totalMinutes = Math.max(0, Math.trunc((Number(seconds) || 0) / 60));
  const hours = Math.trunc(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};
const fetchJson = (url, options = {}, timeoutMs = 15_000) =>
  window.WWZHttp.json(url, options, timeoutMs);
const authHeaders = (extra = {}) => ({ Accept: 'application/json', ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}), ...extra });
const renderServerChoices = () => {
  if (!elements.serverButtons) return;
  elements.serverButtons.replaceChildren();
  state.servers.forEach((server) => {
    const control = document.createElement('button');
    control.type = 'button';
    control.className = 'shop-server-button';
    const name = document.createElement('strong');
    name.textContent = server.map_name || server.name || titleCase(server.map_key) || server.key;
    const detail = document.createElement('small');
    detail.textContent = `${server.paused ? 'Paused' : 'Live'} · isolated shop`;
    control.append(name, detail);
    const active = server.key === state.server?.key;
    control.classList.toggle('active', active);
    control.setAttribute('aria-pressed', String(active));
    control.disabled = state.loading || Boolean(server.paused);
    control.addEventListener('click', async () => {
      if (state.loading || server.paused || server.key === state.server?.key) return;
      if (checkoutMapInstance) {
        checkoutMapInstance.destroy?.();
        checkoutMapInstance = null;
      }
      saveSelectedServer(server);
      state.locations = [];
      state.orders = [];
      acceptServerContext({ servers: state.servers });
      renderServerChoices();
      renderOrders();
      await loadRestartStatus();
      await loadShop();
    });
    elements.serverButtons.append(control);
  });
};
const loadServerChoices = async () => {
  const { response, payload } = await fetchJson(URLS.servers, { headers: { Accept: 'application/json' } });
  if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'World War Z server choices could not be loaded.');
  state.servers = Array.isArray(payload.servers) ? payload.servers : [];
  const stored = readSelectedServer();
  const requested = String(new URLSearchParams(location.search).get('server') || '').trim().toLowerCase();
  const selected = state.servers.find((entry) => String(entry.key).toLowerCase() === requested || String(entry.map_key).toLowerCase() === requested)
    || state.servers.find((entry) => entry.key === stored?.key)
    || state.servers.find((entry) => !entry.paused)
    || state.servers[0]
    || null;
  if (!selected) throw new Error('No World War Z shop server is currently available.');
  saveSelectedServer(selected);
  acceptServerContext({ servers: state.servers });
  renderServerChoices();
};
const setConnection = (kind, label) => {
  if (elements.apiState) elements.apiState.dataset.state = kind;
  if (elements.apiLabel) elements.apiLabel.textContent = label;
};
const showMessage = (message = '', type = 'error') => {
  if (!elements.purchaseMessage) return;
  elements.purchaseMessage.textContent = message;
  elements.purchaseMessage.hidden = !message;
  elements.purchaseMessage.dataset.type = type;
};
const avatar = (url, fallback = 'WZ') => {
  if (!elements.authAvatar) return;
  elements.authAvatar.replaceChildren();
  if (!url) { elements.authAvatar.textContent = fallback; return; }
  const image = document.createElement('img');
  image.src = url; image.alt = 'Discord avatar'; image.referrerPolicy = 'no-referrer';
  image.addEventListener('error', () => { elements.authAvatar.replaceChildren(); elements.authAvatar.textContent = fallback; }, { once: true });
  elements.authAvatar.append(image);
};
const openLogin = () => elements.loginDialog?.showModal?.();
const startLogin = () => {
  if (!state.authEnabled) return;
  const returnTo = `${location.origin}${location.pathname}`;
  location.assign(`${URLS.authLogin}?return_to=${encodeURIComponent(returnTo)}`);
};

const setSignedOut = () => {
  state.user = null;
  elements.authLabel.textContent = 'Sign in with Discord';
  avatar('', 'DISCORD');
  elements.signout.hidden = true;
  elements.wallet.textContent = 'Sign in required';
  elements.openOrders.textContent = '—';
  elements.access.textContent = 'Guest';
  elements.accessNote.textContent = 'Discord verification required';
  elements.ordersGuest.hidden = false;
  elements.ordersUnlinked.hidden = true;
  elements.orderList.hidden = true;
  elements.ordersEmpty.hidden = true;
  if (elements.ordersOverview) elements.ordersOverview.hidden = true;
};
const setSignedIn = (payload) => {
  state.user = payload;
  acceptServerContext(payload);
  renderServerChoices();
  const displayName = payload?.user?.display_name || payload?.user?.username || 'Survivor';
  elements.authLabel.textContent = displayName;
  avatar(payload?.user?.avatar_url, displayName.slice(0, 2).toUpperCase());
  elements.signout.hidden = false;
  elements.ordersGuest.hidden = true;
  elements.access.textContent = titleCase(payload?.membership?.access_level || 'member');
  elements.accessNote.textContent = 'Discord access verified';
};

const callback = () => {
  const params = new URLSearchParams(location.hash.slice(1));
  return { ticket: params.get('login_ticket'), error: params.get('auth_error') };
};
const clearCallback = () => history.replaceState({}, '', `${location.pathname}${location.search}`);
const completeLogin = async (ticket) => {
  const { response, payload } = await fetchJson(URLS.authComplete, {
    method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticket })
  });
  if (!response.ok || !payload.session_token) throw new Error(payload.message || 'Discord sign-in could not be completed.');
  state.token = payload.session_token;
  sessionStorage.setItem(SESSION_KEY, state.token);
  clearCallback();
  setSignedIn(payload);
};
const loadIdentity = async () => {
  if (!state.token) { setSignedOut(); return false; }
  const { response, payload } = await fetchJson(URLS.authMe, { headers: authHeaders() });
  if (response.status === 401 || response.status === 403) {
    state.token = ''; sessionStorage.removeItem(SESSION_KEY); setSignedOut(); return false;
  }
  if (!response.ok) throw new Error('Your Discord session could not be verified.');
  setSignedIn(payload);
  return true;
};

const stockText = (item) => item.stock_quantity == null ? 'Unlimited stock' : `${Number(item.stock_quantity).toLocaleString()} in stock`;
const limitText = (item) => item.max_per_player == null
  ? 'No lifetime limit'
  : item.remaining_member_limit == null ? `${item.max_per_player} per player` : `${Math.max(0, item.remaining_member_limit)} remaining for you`;
const canPurchase = (item) => Boolean(
  state.user && state.settings.enabled && state.settings.website_enabled !== false && state.access.can_purchase && item.available
);

const previewFallback = (item) => {
  if (item?.delivery_type === 'event') return 'assets/shop-previews/vehicles.svg';
  const key = String(item?.category || 'default').trim().toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const supported = new Set(['weapons','ammunition','magazines','medical','food-drink','clothing','tools','base-building-storage','vehicle-parts','containers','explosives','vehicles']);
  return `assets/shop-previews/${supported.has(key) ? key : 'default'}.svg`;
};
const previewImage = (item) => {
  const fallback = previewFallback(item);
  if (window.WWZShopWikiPreviews?.createImage) {
    return window.WWZShopWikiPreviews.createImage(item, fallback, 'member-shop-preview-image');
  }
  const image = document.createElement('img'); image.className = 'member-shop-preview-image'; image.loading = 'lazy'; image.decoding = 'async'; image.alt = `${item?.name || 'DayZ item'} preview`;
  image.src = String(item?.preview_image_url || '').startsWith('https://') ? item.preview_image_url : fallback;
  image.addEventListener('error', () => { image.src = fallback; }, { once: true });
  return image;
};

const itemMode = (item) => item?.delivery_type === 'event' ? 'event' : 'manual';
const itemHaystack = (item) => `${item?.name || ''} ${item?.category || ''} ${item?.sku || ''} ${item?.description || ''} ${(item?.types || []).join(' ')} ${(item?.required_roles || []).map((role) => role.name).join(' ')}`.toLowerCase();
const catalogueModeItems = () => state.items.filter((item) => itemMode(item) === state.mode);
const purchaseButtonLabel = (item) => {
  if (!state.user) return 'Sign in to buy';
  if (!state.access.website_enabled) return 'Member shop disabled';
  if (!state.access.has_required_role) return 'Required role missing';
  if (!state.access.can_purchase && !state.access.linked) return 'Link PSN to buy';
  if (!state.settings.enabled) return 'Purchases paused';
  if (item?.has_required_roles === false) return 'Required item role missing';
  if (!item?.available) return 'Unavailable';
  return item.delivery_type === 'event' ? 'Order rental' : 'Buy item';
};
const resetCataloguePage = () => { state.cataloguePage = 1; };
const filteredModeItems = ({ ignoreCategory = false } = {}) => {
  const query = String(elements.search?.value || '').trim().toLowerCase();
  const category = elements.category?.value || 'all';
  return catalogueModeItems().filter((item) => {
    if (!ignoreCategory && category !== 'all' && item.category !== category) return false;
    return !query || itemHaystack(item).includes(query);
  });
};
const sortCatalogueItems = (items) => {
  const sort = state.catalogueSort || 'recommended';
  return items.map((item, index) => ({ item, index })).sort((left, right) => {
    const a = left.item, b = right.item;
    if (sort === 'name-asc') return String(a.name).localeCompare(String(b.name));
    if (sort === 'name-desc') return String(b.name).localeCompare(String(a.name));
    if (sort === 'price-asc') return Number(a.price || 0) - Number(b.price || 0) || String(a.name).localeCompare(String(b.name));
    if (sort === 'price-desc') return Number(b.price || 0) - Number(a.price || 0) || String(a.name).localeCompare(String(b.name));
    if (sort === 'category') return String(a.category).localeCompare(String(b.category)) || String(a.name).localeCompare(String(b.name));
    if (Boolean(a.available) !== Boolean(b.available)) return a.available ? -1 : 1;
    return left.index - right.index;
  }).map((entry) => entry.item);
};

const renderCategoryList = () => {
  if (!elements.categoryList) return;
  const selected = elements.category?.value || 'all';
  const matching = filteredModeItems({ ignoreCategory: true });
  const counts = new Map();
  matching.forEach((item) => counts.set(item.category || 'Uncategorised', (counts.get(item.category || 'Uncategorised') || 0) + 1));
  const totalMode = catalogueModeItems().length;
  const queryActive = Boolean(String(elements.search?.value || '').trim());
  elements.categoryList.replaceChildren();
  const makeButton = (value, label, count) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = `member-category-button${selected === value ? ' active' : ''}`;
    const name = document.createElement('span'); name.textContent = label;
    const badge = document.createElement('b'); badge.textContent = Number(count || 0).toLocaleString();
    button.append(name, badge);
    button.addEventListener('click', () => {
      if (elements.category) elements.category.value = value;
      resetCataloguePage(); renderCatalogue();
    });
    return button;
  };
  elements.categoryList.append(makeButton('all', 'All categories', matching.length));
  [...counts.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]))).forEach(([category, count]) => {
    elements.categoryList.append(makeButton(category, category, count));
  });
  if (elements.categorySummary) elements.categorySummary.textContent = queryActive
    ? `${matching.length.toLocaleString()} search match${matching.length === 1 ? '' : 'es'}`
    : `${totalMode.toLocaleString()} ${state.mode === 'event' ? 'rental' : 'item'}${totalMode === 1 ? '' : 's'}`;
};

const populateCategories = () => {
  if (!elements.category) return;
  const selected = elements.category.value || 'all';
  elements.category.replaceChildren(new Option('All categories', 'all'));
  [...new Set(catalogueModeItems().map((item) => item.category || 'Uncategorised'))]
    .sort((a, b) => String(a).localeCompare(String(b)))
    .forEach((category) => elements.category.append(new Option(category, category)));
  elements.category.value = [...elements.category.options].some((option) => option.value === selected) ? selected : 'all';
  renderCategoryList();
};

const openItemDetails = (item) => {
  if (!item || !elements.detailDialog) return;
  state.detailItem = item;
  elements.detailPreview?.replaceChildren(previewImage(item));
  if (elements.detailCategory) elements.detailCategory.textContent = `${item.category || 'Catalogue'} · ${item.delivery_type === 'event' ? 'Rental' : 'Item'}`;
  if (elements.detailTitle) elements.detailTitle.textContent = item.name || 'DayZ Item';
  if (elements.detailSku) elements.detailSku.textContent = item.sku || 'No SKU';
  if (elements.detailPrice) elements.detailPrice.textContent = item.delivery_type === 'event' ? `${money(item.price)}/restart` : money(item.price);
  if (elements.detailDescription) elements.detailDescription.textContent = item.description || 'No description is available for this catalogue item.';
  if (elements.detailMeta) {
    elements.detailMeta.replaceChildren();
    const values = [stockText(item), `Max ${Number(item.max_per_order || 1).toLocaleString()}/order`, limitText(item)];
    if (item.delivery_type === 'event') values.unshift(`${Number(item.delivery?.minimum_restarts || 1).toLocaleString()}–${Number(item.delivery?.maximum_restarts || 30000).toLocaleString()} restarts`);
    if (item.discount) values.push(`${item.discount.role_name}: ${item.discount.is_percentage ? `${item.discount.amount}% off` : `${money(item.discount.amount)} off`}`);
    values.forEach((value) => { const chip = document.createElement('span'); chip.textContent = value; elements.detailMeta.append(chip); });
  }
  const classnames = Array.isArray(item.types) ? item.types.filter(Boolean) : [];
  if (elements.detailTypes) elements.detailTypes.hidden = classnames.length === 0;
  if (elements.detailClassname) elements.detailClassname.textContent = classnames.slice(0, 8).join(', ');
  if (elements.detailBuy) {
    elements.detailBuy.textContent = purchaseButtonLabel(item);
    elements.detailBuy.disabled = Boolean(state.user && !canPurchase(item));
  }
  elements.detailDialog.showModal();
};

const renderPagination = (totalItems) => {
  if (!elements.pagination) return;
  const pageSize = Math.max(1, Number(state.cataloguePageSize) || 24);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  state.cataloguePage = Math.min(Math.max(1, state.cataloguePage), totalPages);
  elements.pagination.replaceChildren();
  elements.pagination.hidden = totalPages <= 1;
  if (totalPages <= 1) return;
  const go = (page) => {
    state.cataloguePage = Math.min(Math.max(1, page), totalPages);
    renderCatalogue();
    document.querySelector('.member-results-head')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const button = (label, page, { current = false, disabled = false, aria = '' } = {}) => {
    const control = document.createElement('button'); control.type = 'button'; control.textContent = label; control.disabled = disabled;
    if (current) { control.classList.add('active'); control.setAttribute('aria-current', 'page'); }
    if (aria) control.setAttribute('aria-label', aria);
    if (!disabled && !current) control.addEventListener('click', () => go(page));
    return control;
  };
  elements.pagination.append(button('‹', state.cataloguePage - 1, { disabled: state.cataloguePage === 1, aria: 'Previous catalogue page' }));
  const pages = [];
  if (totalPages <= 7) {
    for (let page = 1; page <= totalPages; page += 1) pages.push(page);
  } else {
    pages.push(1);
    if (state.cataloguePage > 4) pages.push('…');
    const start = Math.max(2, state.cataloguePage - 1), end = Math.min(totalPages - 1, state.cataloguePage + 1);
    for (let page = start; page <= end; page += 1) pages.push(page);
    if (state.cataloguePage < totalPages - 3) pages.push('…');
    pages.push(totalPages);
  }
  pages.forEach((page) => {
    if (page === '…') { const spacer = document.createElement('span'); spacer.textContent = '…'; spacer.className = 'member-pagination-ellipsis'; elements.pagination.append(spacer); }
    else elements.pagination.append(button(String(page), page, { current: page === state.cataloguePage, aria: `Catalogue page ${page}` }));
  });
  elements.pagination.append(button('›', state.cataloguePage + 1, { disabled: state.cataloguePage === totalPages, aria: 'Next catalogue page' }));
};

const renderCatalogue = () => {
  state.catalogueSort = elements.sort?.value || state.catalogueSort || 'recommended';
  state.cataloguePageSize = Math.max(1, Number(elements.pageSize?.value || state.cataloguePageSize || 24));
  const visible = sortCatalogueItems(filteredModeItems());
  const total = visible.length;
  const totalPages = Math.max(1, Math.ceil(total / state.cataloguePageSize));
  state.cataloguePage = Math.min(Math.max(1, state.cataloguePage), totalPages);
  const startIndex = total ? (state.cataloguePage - 1) * state.cataloguePageSize : 0;
  const endIndex = Math.min(total, startIndex + state.cataloguePageSize);
  const pageItems = visible.slice(startIndex, endIndex);
  elements.catalogue.replaceChildren();
  pageItems.forEach((item) => {
    const card = document.createElement('article'); card.className = `member-shop-card${item.available ? '' : ' unavailable'}`;
    const preview = document.createElement('button'); preview.type = 'button'; preview.className = 'member-shop-preview member-shop-preview-button'; preview.setAttribute('aria-label', `View ${item.name} details`); preview.append(previewImage(item)); preview.addEventListener('click', () => openItemDetails(item));
    const head = document.createElement('div'); head.className = 'member-shop-card-head';
    const copy = document.createElement('div'); copy.className = 'member-shop-card-title';
    const kicker = document.createElement('p'); kicker.className = 'panel-kicker'; kicker.textContent = `${item.category} · ${item.sku}`;
    const title = document.createElement('button'); title.type = 'button'; title.className = 'member-shop-title-button'; title.textContent = item.name; title.addEventListener('click', () => openItemDetails(item)); copy.append(kicker, title);
    const price = document.createElement('strong'); price.className = 'member-shop-price';
    if (item.discount && Number(item.base_price) > Number(item.price)) {
      const old = document.createElement('del'); old.textContent = item.delivery_type === 'event' ? `${money(item.base_price)}/restart` : money(item.base_price);
      price.append(old, document.createTextNode(item.delivery_type === 'event' ? `${money(item.price)}/restart` : money(item.price)));
    } else price.textContent = item.delivery_type === 'event' ? `${money(item.price)}/restart` : money(item.price);
    head.append(copy, price);
    const description = document.createElement('p'); description.className = 'member-shop-description'; description.textContent = item.description;
    card.append(preview, head);
    if (item.discount) {
      const discount = document.createElement('span'); discount.className = 'member-discount-badge';
      discount.textContent = `${item.discount.role_name} · ${item.discount.is_percentage ? `${item.discount.amount}% off` : `${money(item.discount.amount)} off`}`;
      card.append(discount);
    }
    card.append(description);
    const meta = document.createElement('div'); meta.className = 'member-shop-meta member-shop-meta-compact';
    const values = item.delivery_type === 'event'
      ? [`${Number(item.delivery?.minimum_restarts || 1).toLocaleString()}–${Number(item.delivery?.maximum_restarts || 30000).toLocaleString()} restarts`, stockText(item)]
      : [stockText(item), `Max ${item.max_per_order}/order`];
    values.forEach((value) => { const chip = document.createElement('span'); chip.textContent = value; meta.append(chip); });
    const actions = document.createElement('div'); actions.className = 'member-shop-card-actions';
    const details = document.createElement('button'); details.type = 'button'; details.className = 'secondary-action'; details.textContent = 'View Details'; details.addEventListener('click', () => openItemDetails(item));
    const buy = document.createElement('button'); buy.type = 'button'; buy.className = 'primary-action'; buy.textContent = purchaseButtonLabel(item);
    buy.disabled = Boolean(state.user && !canPurchase(item));
    buy.addEventListener('click', () => state.user ? openPurchase(item) : openLogin());
    actions.append(details, buy);
    card.append(meta, actions); elements.catalogue.append(card);
  });
  if (elements.resultsCount) elements.resultsCount.textContent = `${total.toLocaleString()} ${state.mode === 'event' ? 'rental' : 'item'}${total === 1 ? '' : 's'}`;
  if (elements.resultsSummary) elements.resultsSummary.textContent = total
    ? `Showing ${Number(startIndex + 1).toLocaleString()}–${Number(endIndex).toLocaleString()} of ${total.toLocaleString()} · Page ${state.cataloguePage.toLocaleString()} of ${totalPages.toLocaleString()}`
    : 'Try another search or category.';
  elements.empty.hidden = total > 0;
  renderCategoryList();
  renderPagination(total);
};

const orderDeliveryState = (order) => String(order?.delivery?.status || '').trim().toLowerCase();
const orderClosed = (order) => ['fulfilled', 'cancelled', 'refunded'].includes(String(order?.status || '').toLowerCase());
const orderDisplayStatus = (order) => {
  const orderState = String(order?.status || '').toLowerCase();
  if (orderState === 'refunded') return 'Refunded';
  if (orderState === 'cancelled') return 'Cancelled';
  const deliveryState = orderDeliveryState(order);
  const labels = {
    queued: 'Preparing Delivery', awaiting_approval: 'Preparing Delivery', ready: 'Preparing Delivery', previewed: 'Prepared',
    restart_pending: 'Waiting for Restart', verification: 'Spawn Verification', active: 'Rental Active',
    cleanup_due: order?.delivery_type === 'event' ? 'Rental Ending' : 'Delivered · Finalising',
    failed: 'Delivery Retry', rolled_back: 'Rolled Back', cancelled: 'Cancelled', cancelled_cleaned: 'Cancelled', fulfilled: 'Fulfilled'
  };
  if (labels[deliveryState]) return labels[deliveryState];
  return orderState === 'fulfilled' ? 'Fulfilled' : titleCase(orderState || 'pending');
};
const orderStatusClass = (order) => {
  const orderState = String(order?.status || '').toLowerCase();
  if (['refunded', 'cancelled', 'fulfilled'].includes(orderState)) return orderState;
  return orderDeliveryState(order) || orderState || 'pending';
};
const orderLocationText = (order) => {
  const point = order?.delivery?.location || {};
  if (point.x == null || point.z == null) return '';
  if (order?.delivery_type === 'event') {
    return `X ${Number(point.x).toFixed(1)}, Z ${Number(point.z).toFixed(1)}, A ${Number(point.rotation || 0).toFixed(1)}° · terrain height`;
  }
  if (point.y == null) return '';
  return `X ${Number(point.x).toFixed(1)}, Y ${Number(point.y).toFixed(1)}, Z ${Number(point.z).toFixed(1)}, A ${Number(point.rotation || 0).toFixed(1)}°`;
};
const copyOrderCoordinates = async (order, button) => {
  const text = orderLocationText(order); if (!text) return;
  try { await navigator.clipboard.writeText(text); button.textContent = 'Copied'; }
  catch { button.textContent = 'Copy failed'; }
  window.setTimeout(() => { button.textContent = 'Copy coordinates'; }, 1200);
};
const orderProgress = (order) => {
  const stateValue = orderDeliveryState(order);
  const event = order?.delivery_type === 'event';
  if (['cancelled', 'refunded'].includes(String(order?.status || '').toLowerCase()) || ['cancelled', 'cancelled_cleaned', 'rolled_back'].includes(stateValue)) return null;
  if (event) {
    const stages = ['Paid', 'Prepared', 'Restart spawn', 'Rental active', 'Complete'];
    const map = { awaiting_approval: 1, ready: 1, previewed: 1, restart_pending: 2, verification: 2, active: 3, cleanup_due: 4, fulfilled: 5 };
    return { stages, current: String(order?.status || '').toLowerCase() === 'fulfilled' ? stages.length : (map[stateValue] ?? 1) };
  }
  const stages = ['Paid', 'Prepared', 'Restart', 'Complete'];
  const map = { queued: 1, restart_pending: 2, cleanup_due: 3, fulfilled: 4 };
  return { stages, current: String(order?.status || '').toLowerCase() === 'fulfilled' ? stages.length : (map[stateValue] ?? 1) };
};
const appendOrderProgress = (card, order) => {
  const progress = orderProgress(order); if (!progress) return;
  const track = document.createElement('div'); track.className = 'member-order-track'; track.style.setProperty('--steps', String(progress.stages.length));
  progress.stages.forEach((label, index) => {
    const step = document.createElement('div');
    step.className = index < progress.current ? 'complete' : index === progress.current ? 'active' : '';
    const dot = document.createElement('i'); const text = document.createElement('span'); text.textContent = label;
    step.append(dot, text); track.append(step);
  });
  card.append(track);
};
const appendRestartBanner = (card, order) => {
  if (orderDeliveryState(order) !== 'restart_pending') return;
  const banner = document.createElement('div'); banner.className = 'member-order-restart-banner';
  const icon = document.createElement('span'); icon.textContent = '↻';
  const copy = document.createElement('div'); const label = document.createElement('small'); label.textContent = 'Waiting for next DayZ restart';
  const strong = document.createElement('strong');
  const detail = document.createElement('em');
  if (state.restart?.next_scheduled_restart) {
    strong.textContent = `${durationText(state.restart.restart_countdown_seconds)} remaining`;
    detail.textContent = `Next restart ${dateText(state.restart.next_scheduled_restart)} · ${state.restart.restart_source || 'messages.xml + ADM'}`;
  } else if (state.restart?.restart_schedule_configured) {
    strong.textContent = 'Restart sync pending'; detail.textContent = 'The countdown will anchor on the next observed DayZ restart.';
  } else {
    strong.textContent = 'Restart schedule unavailable'; detail.textContent = 'Railway will continue tracking the delivery automatically.';
  }
  copy.append(label, strong, detail); banner.append(icon, copy); card.append(banner);
};
const appendRentalProgress = (card, order) => {
  if (order?.delivery_type !== 'event') return;
  const purchased = Math.max(1, Number(order?.delivery?.purchased_restarts ?? order.event_restarts ?? 1));
  const remaining = Math.max(0, Number(order?.delivery?.remaining_restarts ?? (String(order?.status).toLowerCase() === 'fulfilled' ? 0 : purchased)));
  const used = Math.min(purchased, Math.max(0, purchased - remaining));
  const percentage = purchased ? Math.min(100, Math.max(0, (used / purchased) * 100)) : 0;
  const block = document.createElement('div'); block.className = 'member-rental-progress';
  const head = document.createElement('div');
  const title = document.createElement('strong'); title.textContent = `${remaining.toLocaleString()} restart${remaining === 1 ? '' : 's'} remaining`;
  const stats = document.createElement('span'); stats.textContent = `${used.toLocaleString()} used · ${purchased.toLocaleString()} purchased`;
  head.append(title, stats);
  const meter = document.createElement('div'); meter.className = 'member-rental-meter'; const fill = document.createElement('i'); fill.style.width = `${percentage}%`; meter.append(fill);
  block.append(head, meter); card.append(block);
};
const orderMatchesScope = (order) => {
  const scope = state.orderScope;
  if (scope === 'all') return true;
  if (scope === 'open') return ['pending', 'processing'].includes(String(order?.status || '').toLowerCase());
  if (scope === 'waiting') return orderDeliveryState(order) === 'restart_pending';
  if (scope === 'active') return order?.delivery_type === 'event' && orderDeliveryState(order) === 'active';
  if (scope === 'history') return orderClosed(order);
  return true;
};
const renderOrders = () => {
  elements.orderList.replaceChildren();
  if (!state.user) return;
  if (!state.access.linked) {
    elements.ordersUnlinked.hidden = false; elements.orderList.hidden = true; elements.ordersEmpty.hidden = true;
    if (elements.ordersOverview) elements.ordersOverview.hidden = true; return;
  }
  elements.ordersUnlinked.hidden = true; elements.orderList.hidden = false;
  if (elements.ordersOverview) elements.ordersOverview.hidden = false;
  const allOrders = Array.isArray(state.orders) ? state.orders : [];
  const openCount = allOrders.filter((order) => ['pending', 'processing'].includes(String(order.status || '').toLowerCase())).length;
  const waitingCount = allOrders.filter((order) => orderDeliveryState(order) === 'restart_pending').length;
  const activeRentals = allOrders.filter((order) => order.delivery_type === 'event' && orderDeliveryState(order) === 'active').length;
  const completed = allOrders.filter((order) => String(order.status || '').toLowerCase() === 'fulfilled').length;
  if (elements.ordersOpen) elements.ordersOpen.textContent = String(openCount);
  if (elements.ordersWaiting) elements.ordersWaiting.textContent = String(waitingCount);
  if (elements.ordersActiveRentals) elements.ordersActiveRentals.textContent = String(activeRentals);
  if (elements.ordersCompleted) elements.ordersCompleted.textContent = String(completed);
  const visibleOrders = allOrders.filter(orderMatchesScope);
  if (elements.ordersResultSummary) elements.ordersResultSummary.textContent = `${visibleOrders.length.toLocaleString()} order${visibleOrders.length === 1 ? '' : 's'}`;
  visibleOrders.forEach((order) => {
    const eventOrder = order.delivery_type === 'event';
    const card = document.createElement('article'); card.className = `member-order-card ${eventOrder ? 'rental-order' : 'item-order'}`;
    const head = document.createElement('div'); head.className = 'member-order-card-head';
    const copy = document.createElement('div');
    const kicker = document.createElement('p'); kicker.className = 'member-order-kicker'; kicker.textContent = `${eventOrder ? 'Vehicle / event rental' : 'Automatic item delivery'} · Order #${order.order_id}`;
    const title = document.createElement('h3'); title.textContent = order.item?.name || 'Shop order';
    const subtitle = document.createElement('small'); subtitle.textContent = eventOrder
      ? `${Number(order.event_restarts || 1).toLocaleString()} restart${Number(order.event_restarts || 1) === 1 ? '' : 's'} purchased at ${money(order.unit_price || 1)}/restart`
      : `${Number(order.quantity || 1).toLocaleString()} × ${order.item?.name || 'item'} · ${money(order.unit_price)} each`;
    copy.append(kicker, title, subtitle);
    const status = document.createElement('span'); status.className = `shop-order-status ${orderStatusClass(order)}`; status.textContent = orderDisplayStatus(order);
    head.append(copy, status); card.append(head);

    const facts = document.createElement('div'); facts.className = 'member-order-facts';
    const factValues = [
      ['Total paid', money(order.total_price)],
      ['Ordered', dateText(order.created_at)],
      [eventOrder ? 'Rental term' : 'Quantity', eventOrder ? `${Number(order.event_restarts || 1).toLocaleString()} restarts` : Number(order.quantity || 1).toLocaleString()],
      ['Delivery state', order.delivery ? orderDisplayStatus(order) : titleCase(order.status)]
    ];
    factValues.forEach(([label, value]) => { const block = document.createElement('div'); const small = document.createElement('span'); small.textContent = label; const strong = document.createElement('strong'); strong.textContent = value; block.append(small, strong); facts.append(block); });
    card.append(facts);
    appendOrderProgress(card, order);
    appendRestartBanner(card, order);
    appendRentalProgress(card, order);

    const locationText = orderLocationText(order);
    if (locationText) {
      const location = document.createElement('div'); location.className = 'member-order-location';
      const locationCopy = document.createElement('div'); const label = document.createElement('span'); label.textContent = order.delivery?.location?.name || 'Delivery coordinates'; const coords = document.createElement('strong'); coords.textContent = locationText; locationCopy.append(label, coords);
      const button = document.createElement('button'); button.type = 'button'; button.className = 'secondary-action compact-action'; button.textContent = 'Copy coordinates'; button.addEventListener('click', () => copyOrderCoordinates(order, button));
      location.append(locationCopy, button); card.append(location);
    }
    if (order.discount) { const line = document.createElement('div'); line.className = 'member-order-note discount'; line.textContent = `Discount applied · ${order.discount.label}`; card.append(line); }
    if (order.buyer_note) { const line = document.createElement('div'); line.className = 'member-order-note'; line.textContent = `Your note · ${order.buyer_note}`; card.append(line); }
    if (order.fulfilment_note) { const line = document.createElement('div'); line.className = 'member-order-note update'; line.textContent = `Order update · ${order.fulfilment_note}`; card.append(line); }
    const latestEvent = Array.isArray(order.delivery?.events) && order.delivery.events.length ? order.delivery.events[0] : (Array.isArray(order.events) ? order.events[0] : null);
    if (latestEvent?.note) { const line = document.createElement('div'); line.className = 'member-order-note automation'; line.textContent = `Latest automation · ${latestEvent.note}`; card.append(line); }
    const footer = document.createElement('div'); footer.className = 'member-order-footer'; footer.innerHTML = `<span>Last updated</span><strong>${dateText(order.updated_at || order.created_at)}</strong>`; card.append(footer);
    elements.orderList.append(card);
  });
  elements.ordersEmpty.hidden = visibleOrders.length > 0;
  if (!visibleOrders.length && allOrders.length && elements.ordersEmpty) elements.ordersEmpty.textContent = 'No orders match this view.';
  else if (elements.ordersEmpty) elements.ordersEmpty.textContent = 'You have not placed a shop order yet.';
};

const applyPayload = (payload, member = false) => {
  state.settings = payload.settings || {};
  state.access = member ? { ...(payload.access || {}), linked: Boolean(payload.linked) } : {
    website_enabled: state.settings.website_enabled !== false, has_required_role: true, can_purchase: false, linked: false
  };
  state.items = Array.isArray(payload.items) ? payload.items : [];
  state.orders = member && Array.isArray(payload.orders) ? payload.orders : [];
  state.cataloguePage = 1;
  elements.title.textContent = state.settings.title || 'Survivor Shop';
  elements.description.textContent = state.settings.description || 'Spend your verified community balance on approved DayZ goods and services.';
  elements.instructions.textContent = state.settings.purchase_instructions || 'Railway prepares paid orders automatically for the next server restart.';
  elements.count.textContent = String(state.items.length);
  elements.manualCount.textContent = String(state.items.filter((item) => item.delivery_type !== 'event').length);
  elements.eventCount.textContent = String(state.items.filter((item) => item.delivery_type === 'event').length);
  if (state.settings.dashboard_image_url) elements.heroImage.src = state.settings.dashboard_image_url;
  if (member) {
    elements.wallet.textContent = payload.linked ? money(payload.balance) : 'PSN link required';
    elements.openOrders.textContent = payload.linked ? String(state.orders.filter((order) => ['pending','processing'].includes(order.status)).length) : '—';
    if (!state.access.website_enabled) {
      elements.access.textContent = 'Unavailable'; elements.accessNote.textContent = 'Member shop disabled by Owner';
      elements.noticeTitle.textContent = 'Member shop is currently disabled'; elements.noticeCopy.textContent = 'The catalogue will return when an Owner enables the dedicated member shop.';
    } else if (!state.access.has_required_role) {
      const roleName = state.settings.required_role?.name || 'required role';
      elements.access.textContent = 'Role required'; elements.accessNote.textContent = roleName;
      elements.noticeTitle.textContent = `The ${roleName} role is required`;
      elements.noticeCopy.textContent = 'Your Discord roles are checked by Railway. Contact staff if you believe your access is incorrect.';
    } else if (!payload.linked) {
      elements.access.textContent = 'PSN link required'; elements.accessNote.textContent = 'Use /link in Discord';
    } else {
      elements.access.textContent = state.settings.enabled ? 'Ready to purchase' : 'Browse only';
      elements.accessNote.textContent = state.settings.enabled ? 'Identity and wallet verified' : 'Purchases are paused';
    }
  }
  populateCategories(); renderCatalogue(); renderOrders();
};

const applyRestartStatus = (payload) => {
  const operations = window.WWZHttp?.normaliseRestartOperations?.(payload?.operations || {}) || (payload?.operations || {});
  const configured = Boolean(operations.restart_schedule_configured);
  const synchronised = Boolean(operations.restart_schedule_synchronised);
  state.restart = operations;
  if (elements.nextRestart) {
    elements.nextRestart.textContent = operations.next_scheduled_restart
      ? dateText(operations.next_scheduled_restart)
      : configured
        ? 'Waiting for sync'
        : 'Not configured';
  }
  if (elements.restartCountdown) {
    const interval = Math.max(0, Math.trunc(Number(operations.restart_interval_minutes) || 0));
    elements.restartCountdown.textContent = synchronised && operations.restart_countdown_seconds != null
      ? `${durationText(operations.restart_countdown_seconds)} remaining · ${operations.restart_source || 'messages.xml + ADM'}`
      : configured
        ? `Every ${durationText(interval * 60)} · syncs after the next observed restart`
        : 'No automatic shutdown message found';
  }
  renderOrders();
};
const loadRestartStatus = async () => {
  try {
    const { response, payload } = await fetchJson(URLS.serverStatus, { headers: { Accept: 'application/json' } }, 8_000);
    if (!response.ok) throw new Error('Restart status unavailable');
    applyRestartStatus(payload);
  } catch {
    if (elements.nextRestart) elements.nextRestart.textContent = 'Unavailable';
    if (elements.restartCountdown) elements.restartCountdown.textContent = 'Unable to reach restart schedule';
  }
};

const loadLocations = async () => {
  if (!state.token) return;
  const { response, payload } = await fetchJson(URLS.locations, { headers: authHeaders() });
  if (response.ok) state.locations = Array.isArray(payload.locations) ? payload.locations : [];
};
const loadShop = async () => {
  if (state.loading) return;
  state.loading = true; elements.refresh.disabled = true; elements.ordersRefresh.disabled = true; elements.error.hidden = true;
  try {
    const member = Boolean(state.token && state.user);
    const { response, payload } = await fetchJson(member ? URLS.account : URLS.catalogue, { headers: authHeaders() });
    if (response.status === 401 || response.status === 403) {
      state.token = ''; sessionStorage.removeItem(SESSION_KEY); setSignedOut(); return loadShop();
    }
    if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'The shop is unavailable.');
    applyPayload(payload, member);
    if (member) await loadLocations();
    setConnection('online', 'Railway connected');
  } catch (error) {
    setConnection('unavailable', 'Shop unavailable'); elements.error.hidden = false;
  } finally {
    state.loading = false; elements.refresh.disabled = false; elements.ordersRefresh.disabled = false;
  }
};

const populateLocations = () => {
  elements.location.replaceChildren(new Option('Enter new coordinates', ''));
  state.locations.forEach((location) => elements.location.append(new Option(
    `${location.name}${location.is_default ? ' · Default' : ''} — X ${location.x}, Y ${location.y}, Z ${location.z}`,
    String(location.location_id)
  )));
  const defaultLocation = state.locations.find((location) => location.is_default);
  if (defaultLocation) elements.location.value = String(defaultLocation.location_id);
  syncLocationMode();
};
const syncLocationMode = () => {
  const saved = Boolean(elements.location.value);
  elements.coordinateInputs.hidden = saved;
  [elements.x, elements.y, elements.z, elements.rotation].forEach((input) => {
    if (!input) return;
    // Disabled controls are excluded from native constraint validation. This is
    // required for legacy saved locations whose stored precision may not match
    // the manual coordinate input step used by older website releases.
    input.disabled = saved;
    input.required = !saved;
  });
  if (saved) {
    const location = state.locations.find((entry) => String(entry.location_id) === elements.location.value);
    if (location) { elements.x.value = location.x; elements.y.value = location.y; elements.z.value = location.z; elements.rotation.value = location.rotation; }
  }
  updateMarker();
};
const ensureCheckoutMap = () => {
  if (checkoutMapInstance || !elements.coordinateMap || !window.WWZMap) return checkoutMapInstance;
  const worldSize = activeWorldSize();
  [elements.x, elements.z].forEach((input) => { if (input) input.max = String(worldSize); });
  checkoutMapInstance = window.WWZMap.create(elements.coordinateMap, {
    mapKey: activeMapKey(),
    mode: 'picker',
    selectable: true,
    copyOnSelect: false,
    roadsVisible: true,
    trailsVisible: false,
    selectedElement: elements.mapReadout,
    zoomInButton: elements.mapZoomIn,
    zoomOutButton: elements.mapZoomOut,
    resetButton: elements.mapReset,
    fullscreenButton: elements.mapFullscreen,
    fullscreenTarget: elements.coordinateMap,
    emptySelectionText: 'No coordinates selected',
    onSelect: ({ x, z }) => {
      if (elements.location.value) return;
      elements.x.value = x.toFixed(1);
      elements.z.value = z.toFixed(1);
      if (elements.y.value === '') elements.y.value = '0';
      updateMarker();
    }
  });
  return checkoutMapInstance;
};

const resetCheckoutMap = () => {
  ensureCheckoutMap()?.reset();
};

const updateMarker = () => {
  const rawX = String(elements.x?.value ?? '').trim();
  const rawZ = String(elements.z?.value ?? '').trim();
  const x = Number(rawX), z = Number(rawZ);
  const worldSize = activeWorldSize();
  const valid = rawX !== '' && rawZ !== '' && Number.isFinite(x) && Number.isFinite(z) && x >= 0 && x <= worldSize && z >= 0 && z <= worldSize;
  if (elements.mapReadout && !checkoutMapInstance) {
    elements.mapReadout.textContent = valid ? `X ${x.toFixed(1)} · Z ${z.toFixed(1)}` : 'No coordinates selected';
  }
  if (!checkoutMapInstance) return;
  if (valid) checkoutMapInstance.setSelection(x, z, { notify: false });
  else checkoutMapInstance.clearSelection({ notify: false });
  checkoutMapInstance.setSelectionEnabled(!elements.location.value);
};

const updateTotal = () => {
  const quantity = Math.max(1, Number(elements.quantity.value || 1));
  elements.total.textContent = money(quantity * Number(state.selectedItem?.price || 0));
};
const openPurchase = (item) => {
  if (!canPurchase(item)) return;
  if (elements.detailDialog?.open) elements.detailDialog.close();
  state.selectedItem = item; elements.purchaseForm.reset(); elements.y.value = '0'; elements.rotation.value = '0';
  const eventItem = item.delivery_type === 'event';
  const minimum = eventItem ? Math.max(1, Number(item.delivery?.minimum_restarts || state.settings.event_restart_min || 1)) : 1;
  const maximum = eventItem
    ? Math.min(30000, Number(item.delivery?.maximum_restarts || state.settings.event_restart_max || 30000))
    : Math.max(1, Math.min(Number(item.max_per_order || 1), item.stock_quantity == null ? 100 : Number(item.stock_quantity), item.remaining_member_limit == null ? 100 : Number(item.remaining_member_limit)));
  elements.quantity.value = String(minimum); elements.quantity.min = String(minimum); elements.quantity.max = String(maximum);
  elements.quantityLabel.textContent = eventItem ? 'Number Of Restarts' : 'Quantity';
  elements.quantityHelp.textContent = eventItem ? `Allowed ${minimum.toLocaleString()}–${maximum.toLocaleString()} restarts.` : `Maximum ${maximum.toLocaleString()} per order.`;
  elements.eventFields.hidden = false;
  elements.purchaseTitle.textContent = `Buy ${item.name}?`; elements.purchaseItem.textContent = `${item.name} · ${item.sku}`;
  elements.purchasePrice.textContent = `${money(item.price)}${eventItem ? ' per restart' : ' each'} · ${stockText(item)}`;
  populateLocations(); updateMarker(); updateTotal(); showMessage(''); elements.purchaseDialog.showModal();
  window.setTimeout(() => {
    const instance = ensureCheckoutMap();
    resetCheckoutMap();
    updateMarker();
    instance?.invalidateSize();
  }, 0);
};
const submitPurchase = async (event) => {
  event.preventDefault();
  if (!state.token || !state.selectedItem || state.purchasing) return;
  state.purchasing = true; elements.purchaseConfirm.disabled = true; showMessage('Railway is validating your wallet, stock and access.', 'info');
  try {
    const eventItem = state.selectedItem.delivery_type === 'event';
    let delivery = null;
    {
      if (!elements.coordinateConfirm.checked) throw new Error('Confirm that you checked the delivery coordinates.');
      delivery = elements.location.value ? { location_id: Number(elements.location.value) } : {
        x: elements.x.value, y: elements.y.value, z: elements.z.value, rotation: elements.rotation.value || 0
      };
      if (!elements.location.value && (!delivery.x || delivery.y === '' || !delivery.z)) throw new Error('Enter complete X, Y and Z coordinates.');
    }
    const quantity = Math.max(1, Number(elements.quantity.value || 1));
    const body = {
      item_id: Number(state.selectedItem.item_id), quantity: eventItem ? 1 : quantity,
      event_restarts: eventItem ? quantity : 1, buyer_note: elements.note.value.trim(),
      purchase_key: `${Date.now().toString(36)}-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}-shop`, delivery
    };
    const { response, payload } = await fetchJson(URLS.purchase, {
      method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(body)
    }, 60000);
    if (!response.ok) throw new Error(payload.message || 'The purchase could not be completed.');
    showMessage(payload.message || 'Order placed successfully.', 'success');
    await loadShop(); window.setTimeout(() => elements.purchaseDialog.close(), 900);
  } catch (error) { showMessage(error.message || 'The purchase could not be completed.'); }
  finally { state.purchasing = false; elements.purchaseConfirm.disabled = false; }
};

$$('[data-member-shop-mode]').forEach((button) => button.addEventListener('click', () => {
  state.mode = button.dataset.memberShopMode === 'event' ? 'event' : 'manual';
  $$('[data-member-shop-mode]').forEach((entry) => { const active = entry === button; entry.classList.toggle('active', active); entry.setAttribute('aria-selected', String(active)); });
  elements.modeLabel.textContent = state.mode === 'event' ? 'Event items' : 'Items'; elements.search.value = ''; resetCataloguePage(); populateCategories(); renderCatalogue();
}));
let catalogueSearchTimer = null;
elements.search.addEventListener('input', () => { window.clearTimeout(catalogueSearchTimer); catalogueSearchTimer = window.setTimeout(() => { resetCataloguePage(); renderCatalogue(); }, 140); });
elements.category.addEventListener('change', () => { resetCataloguePage(); renderCatalogue(); });
elements.sort?.addEventListener('change', () => { state.catalogueSort = elements.sort.value; resetCataloguePage(); renderCatalogue(); });
elements.pageSize?.addEventListener('change', () => { state.cataloguePageSize = Number(elements.pageSize.value || 24); resetCataloguePage(); renderCatalogue(); });
elements.resetFilters?.addEventListener('click', () => {
  elements.search.value = ''; elements.category.value = 'all'; if (elements.sort) elements.sort.value = 'recommended'; if (elements.pageSize) elements.pageSize.value = '24';
  state.catalogueSort = 'recommended'; state.cataloguePageSize = 24; resetCataloguePage(); renderCatalogue(); elements.search.focus();
});
$$('[data-member-item-detail-close]').forEach((button) => button.addEventListener('click', () => elements.detailDialog?.close()));
elements.detailBuy?.addEventListener('click', () => {
  const item = state.detailItem; if (!item) return;
  if (!state.user) { elements.detailDialog?.close(); openLogin(); return; }
  if (canPurchase(item)) openPurchase(item);
});
elements.refresh.addEventListener('click', loadShop);
elements.ordersRefresh.addEventListener('click', loadShop);
elements.ordersScope?.addEventListener('change', () => { state.orderScope = elements.ordersScope.value || 'all'; renderOrders(); });
elements.authButton.addEventListener('click', () => state.user ? location.assign('dashboard.html#players/account') : openLogin());
$$('[data-shop-login]').forEach((button) => button.addEventListener('click', openLogin));
elements.startLogin.addEventListener('click', startLogin);
elements.signout.addEventListener('click', async () => {
  const token = state.token; state.token = ''; sessionStorage.removeItem(SESSION_KEY); setSignedOut(); await loadShop();
  if (token) fetchJson(URLS.authLogout, { method: 'POST', headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } }).catch(() => {});
});
elements.quantity.addEventListener('input', updateTotal);
elements.location.addEventListener('change', syncLocationMode);
[elements.x,elements.z].forEach((input) => input.addEventListener('input', updateMarker));
$$('[data-member-purchase-cancel]').forEach((button) => button.addEventListener('click', () => { if (!state.purchasing) elements.purchaseDialog.close(); }));
elements.purchaseForm.addEventListener('submit', submitPurchase);

const initialise = async () => {
  try {
    const [{ response, payload }] = await Promise.all([
      fetchJson(URLS.authConfig, { headers: { Accept: 'application/json' } }),
      loadServerChoices()
    ]);
    state.authEnabled = Boolean(response.ok && payload?.discord_auth?.enabled);
  } catch {
    state.authEnabled = false;
    if (!state.server) {
      setConnection('unavailable', 'Shop unavailable');
      if (elements.error) {
        elements.error.hidden = false;
        elements.error.textContent = 'World War Z server choices could not be loaded.';
      }
      return;
    }
  }
  elements.startLogin.disabled = !state.authEnabled;
  elements.startLogin.textContent = state.authEnabled ? 'Continue securely with Discord' : 'Discord sign-in is unavailable';
  const fragment = callback();
  if (fragment.error) { clearCallback(); setSignedOut(); }
  else if (fragment.ticket) {
    try { await completeLogin(fragment.ticket); } catch { clearCallback(); state.token = ''; sessionStorage.removeItem(SESSION_KEY); setSignedOut(); }
  } else {
    try { await loadIdentity(); } catch { setSignedOut(); }
  }
  renderServerChoices();
  await loadRestartStatus();
  await loadShop();
  window.setInterval(loadRestartStatus, 30_000);
};
initialise();
