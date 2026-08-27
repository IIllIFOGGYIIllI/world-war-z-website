(() => {
  'use strict';

  const API_BASE = 'https://world-war-z.up.railway.app';
  const URLS = {
    authConfig: `${API_BASE}/api/auth/config`,
    authLogin: `${API_BASE}/api/auth/discord/login`,
    authComplete: `${API_BASE}/api/auth/discord/complete`,
    authMe: `${API_BASE}/api/auth/me`,
    authLogout: `${API_BASE}/api/auth/logout`,
    servers: `${API_BASE}/api/donations/servers`,
    catalogue: `${API_BASE}/api/donations/catalogue`,
    orders: `${API_BASE}/api/account/donations/orders`,
    orderAction: `${API_BASE}/api/account/donations/orders/action`
  };
  const SESSION_KEY = 'wwz_dashboard_session';
  const SERVER_KEY = 'wwz_dashboard_server';
  const CURRENCY_KEY = 'wwz_donation_display_currency';
  const FX_CACHE_KEY = 'wwz_donation_fx_rates_v1';
  const FX_URL = 'https://api.frankfurter.dev/v2/rates?base=AUD&quotes=USD,NZD,GBP,EUR,CAD,PHP,JPY,SGD,INR,ZAR,CHF,SEK,NOK,DKK,KRW,BRL,MXN,PLN,AED';
  const FX_FRESH_MS = 6 * 60 * 60 * 1000;
  const FALLBACK_FX_DATE = '2026-08-27';
  const FALLBACK_FX_RATES = Object.freeze({
    AUD: 1, USD: 0.71723, NZD: 1.2069, GBP: 0.527666, EUR: 0.615517, CAD: 0.995322,
    PHP: 44.2544, JPY: 114.312, SGD: 0.9123, INR: 68.4342, ZAR: 11.4536, CHF: 0.577583,
    SEK: 6.83707, NOK: 6.70847, DKK: 4.60125, KRW: 993.687, BRL: 3.69686, MXN: 12.1623,
    PLN: 2.65498, AED: 2.63309
  });
  const DISPLAY_CURRENCIES = [
    ['AUD', 'Australian Dollar'], ['USD', 'US Dollar'], ['NZD', 'New Zealand Dollar'],
    ['GBP', 'British Pound'], ['EUR', 'Euro'], ['CAD', 'Canadian Dollar'],
    ['PHP', 'Philippine Peso'], ['JPY', 'Japanese Yen'], ['SGD', 'Singapore Dollar'],
    ['INR', 'Indian Rupee'], ['ZAR', 'South African Rand'], ['CHF', 'Swiss Franc'],
    ['SEK', 'Swedish Krona'], ['NOK', 'Norwegian Krone'], ['DKK', 'Danish Krone'],
    ['KRW', 'South Korean Won'], ['BRL', 'Brazilian Real'], ['MXN', 'Mexican Peso'],
    ['PLN', 'Polish Zloty'], ['AED', 'UAE Dirham']
  ];
  const REGION_CURRENCY = {
    AU: 'AUD', US: 'USD', NZ: 'NZD', GB: 'GBP', CA: 'CAD', PH: 'PHP', JP: 'JPY', SG: 'SGD',
    IN: 'INR', ZA: 'ZAR', CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', KR: 'KRW', BR: 'BRL',
    MX: 'MXN', PL: 'PLN', AE: 'AED', IE: 'EUR', DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR',
    NL: 'EUR', BE: 'EUR', AT: 'EUR', PT: 'EUR', FI: 'EUR', GR: 'EUR', LU: 'EUR'
  };
  const $ = (selector, root = document) => root.querySelector(selector);

  const state = {
    token: sessionStorage.getItem(SESSION_KEY) || '',
    authEnabled: false,
    user: null,
    servers: [],
    server: null,
    catalogue: { categories: [], packages: [], payment: { methods: [] } },
    orders: [],
    selectedPurchase: null,
    displayCurrency: 'AUD',
    fxRates: { ...FALLBACK_FX_RATES },
    fxDate: FALLBACK_FX_DATE,
    fxFetchedAt: 0,
    fxLive: false,
    fxSource: 'fallback',
    loading: false,
    actionPending: false
  };

  const elements = {
    apiState: $('[data-donation-api-state]'),
    apiLabel: $('[data-donation-api-label]'),
    authButton: $('[data-donation-auth-button]'),
    authLabel: $('[data-donation-auth-label]'),
    signout: $('[data-donation-signout]'),
    intro: $('[data-donation-intro]'),
    serverButtons: $('[data-donation-server-buttons]'),
    packages: $('[data-donation-packages]'),
    packagesEmpty: $('[data-donation-packages-empty]'),
    categories: $('[data-donation-categories]'),
    itemsEmpty: $('[data-donation-items-empty]'),
    paymentIntro: $('[data-donation-payment-intro]'),
    paymentMethods: $('[data-donation-payment-methods]'),
    finalNotice: $('[data-donation-final-notice]'),
    currencySelect: $('[data-donation-currency]'),
    currencyStatus: $('[data-donation-currency-status]'),
    refresh: $('[data-donation-refresh]'),
    ordersRefresh: $('[data-donation-orders-refresh]'),
    ordersGuest: $('[data-donation-orders-guest]'),
    ordersSignin: $('[data-donation-orders-signin]'),
    memberOrders: $('[data-donation-member-orders]'),
    ordersEmpty: $('[data-donation-orders-empty]'),
    pageError: $('[data-donation-page-error]'),
    checkoutDialog: $('[data-donation-checkout-dialog]'),
    checkoutForm: $('[data-donation-checkout-form]'),
    checkoutTitle: $('[data-donation-checkout-title]'),
    checkoutDescription: $('[data-donation-checkout-description]'),
    checkoutPurchase: $('[data-donation-checkout-purchase]'),
    checkoutPrice: $('[data-donation-checkout-price]'),
    checkoutPayment: $('[data-donation-checkout-payment]'),
    checkoutMessage: $('[data-donation-checkout-message]'),
    checkoutConfirm: $('[data-donation-checkout-confirm]'),
    checkoutCancel: $('[data-donation-checkout-cancel]')
  };

  const fetchJson = (url, options = {}, timeoutMs = 15_000) => window.WWZHttp.json(url, options, timeoutMs);
  const authHeaders = (extra = {}) => ({
    Accept: 'application/json',
    ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
    ...extra
  });
  const money = (value) => `$${Number(value || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AUD`;
  const formatCurrency = (value, currency) => {
    const amount = Number(value || 0);
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency, currencyDisplay: 'narrowSymbol', minimumFractionDigits: currency === 'JPY' || currency === 'KRW' ? 0 : 2, maximumFractionDigits: currency === 'JPY' || currency === 'KRW' ? 0 : 2 }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${currency}`;
    }
  };
  const inferredCurrency = () => {
    try {
      const stored = String(localStorage.getItem(CURRENCY_KEY) || '').trim().toUpperCase();
      if (DISPLAY_CURRENCIES.some(([code]) => code === stored)) return stored;
      const locale = String(navigator.languages?.[0] || navigator.language || 'en-AU');
      const region = String(locale.split(/[-_]/)[1] || '').slice(0, 2).toUpperCase();
      return REGION_CURRENCY[region] || 'AUD';
    } catch { return 'AUD'; }
  };
  const activeFxRate = (currency = state.displayCurrency) => {
    if (currency === 'AUD') return 1;
    let rate = Number(state.fxRates?.[currency] || 0);
    if ((!Number.isFinite(rate) || rate <= 0) && currency === 'USD') rate = Number(state.catalogue.usd_rate || 0);
    if ((!Number.isFinite(rate) || rate <= 0)) rate = Number(FALLBACK_FX_RATES[currency] || 0);
    return Number.isFinite(rate) && rate > 0 ? rate : 0;
  };
  const convertedText = (audValue) => {
    const currency = state.displayCurrency || 'AUD';
    if (currency === 'AUD') {
      if (!state.catalogue.show_usd_estimates) return '';
      const manualUsdRate = Number(state.catalogue.usd_rate || 0);
      if (!Number.isFinite(manualUsdRate) || manualUsdRate <= 0) return '';
      return `Approx. ${formatCurrency(Number(audValue || 0) * manualUsdRate, 'USD')} USD`;
    }
    const rate = activeFxRate(currency);
    if (!rate) return 'Conversion temporarily unavailable';
    return `Approx. ${formatCurrency(Number(audValue || 0) * rate, currency)} ${currency}`;
  };
  const selectedPriceText = (audValue) => {
    const currency = state.displayCurrency || 'AUD';
    if (currency === 'AUD') return money(audValue);
    const rate = activeFxRate(currency);
    if (!rate) return money(audValue);
    return `${formatCurrency(Number(audValue || 0) * rate, currency)} ${currency}`;
  };
  const combinedPriceText = (audValue) => {
    if ((state.displayCurrency || 'AUD') === 'AUD') return money(audValue);
    const rate = activeFxRate(state.displayCurrency);
    return rate ? `${selectedPriceText(audValue)} approx. · ${money(audValue)} authoritative` : money(audValue);
  };
  const dateText = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Recently';
    return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
  };
  const titleCase = (value) => String(value || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  const setConnection = (kind, label) => {
    if (elements.apiState) elements.apiState.dataset.state = kind;
    if (elements.apiLabel) elements.apiLabel.textContent = label;
  };
  const showPageError = (message = '') => {
    if (!elements.pageError) return;
    elements.pageError.hidden = !message;
    elements.pageError.textContent = message || '';
  };
  const showCheckoutMessage = (message = '', tone = 'error') => {
    if (!elements.checkoutMessage) return;
    elements.checkoutMessage.hidden = !message;
    elements.checkoutMessage.textContent = message;
    elements.checkoutMessage.dataset.type = tone;
  };
  const button = (label, className = 'primary-action') => {
    const value = document.createElement('button');
    value.type = 'button';
    value.disabled = false;
    value.className = className;
    value.textContent = label;
    return value;
  };

  const readServer = () => {
    try { return JSON.parse(sessionStorage.getItem(SERVER_KEY) || 'null'); } catch { return null; }
  };
  const saveServer = (server) => {
    state.server = server || null;
    if (server) sessionStorage.setItem(SERVER_KEY, JSON.stringify(server));
    else sessionStorage.removeItem(SERVER_KEY);
  };

  const callback = () => {
    const params = new URLSearchParams(location.hash.slice(1));
    return { ticket: params.get('login_ticket'), error: params.get('auth_error') };
  };
  const clearCallback = () => history.replaceState({}, '', `${location.pathname}${location.search}`);
  const startLogin = () => {
    if (!state.authEnabled) {
      showPageError('Discord sign-in is temporarily unavailable.');
      return;
    }
    const returnTo = `${location.origin}${location.pathname}`;
    location.assign(`${URLS.authLogin}?return_to=${encodeURIComponent(returnTo)}`);
  };
  const setSignedOut = () => {
    state.user = null;
    if (elements.authLabel) elements.authLabel.textContent = 'Sign in with Discord';
    if (elements.signout) elements.signout.hidden = true;
    if (elements.ordersGuest) elements.ordersGuest.hidden = false;
    if (elements.memberOrders) elements.memberOrders.hidden = true;
    if (elements.ordersEmpty) elements.ordersEmpty.hidden = true;
  };
  const setSignedIn = (payload) => {
    state.user = payload;
    const displayName = payload?.user?.display_name || payload?.user?.username || 'Discord Member';
    if (elements.authLabel) elements.authLabel.textContent = displayName;
    if (elements.signout) elements.signout.hidden = false;
    if (elements.ordersGuest) elements.ordersGuest.hidden = true;
  };
  const completeLogin = async (ticket) => {
    const { response, payload } = await fetchJson(URLS.authComplete, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
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
      state.token = '';
      sessionStorage.removeItem(SESSION_KEY);
      setSignedOut();
      return false;
    }
    if (!response.ok) throw new Error(payload.message || 'Your Discord session could not be verified.');
    setSignedIn(payload);
    return true;
  };

  const populateCurrencySelect = () => {
    if (!elements.currencySelect) return;
    elements.currencySelect.replaceChildren();
    DISPLAY_CURRENCIES.forEach(([code, name]) => elements.currencySelect.add(new Option(`${code} — ${name}`, code)));
    elements.currencySelect.value = state.displayCurrency;
    if (!elements.currencySelect.value) {
      state.displayCurrency = 'AUD';
      elements.currencySelect.value = 'AUD';
    }
  };

  const updateCurrencyStatus = (message = '') => {
    if (!elements.currencyStatus) return;
    if (message) {
      elements.currencyStatus.textContent = message;
      return;
    }
    if (state.displayCurrency === 'AUD') {
      elements.currencyStatus.textContent = 'AUD is the authoritative checkout currency';
      return;
    }
    const rate = Number(state.fxRates?.[state.displayCurrency] || 0);
    if (Number.isFinite(rate) && rate > 0) {
      const source = state.fxSource === 'live' ? 'Live' : state.fxSource === 'cached' ? 'Cached' : 'Fallback';
      elements.currencyStatus.textContent = `${source} indicative rate · 1 AUD ≈ ${rate.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${state.displayCurrency}${state.fxDate ? ` · ${state.fxDate}` : ''}`;
    } else {
      elements.currencyStatus.textContent = 'Conversion temporarily unavailable — AUD prices remain valid';
    }
  };

  const readFxCache = () => {
    try {
      const cached = JSON.parse(localStorage.getItem(FX_CACHE_KEY) || 'null');
      if (!cached || typeof cached !== 'object' || !cached.rates) return null;
      return cached;
    } catch { return null; }
  };

  const applyFxPayload = (rows, fetchedAt = Date.now(), live = true) => {
    const rates = { ...FALLBACK_FX_RATES };
    let date = '';
    (Array.isArray(rows) ? rows : []).forEach((row) => {
      const quote = String(row?.quote || '').trim().toUpperCase();
      const rate = Number(row?.rate || 0);
      if (/^[A-Z]{3}$/.test(quote) && Number.isFinite(rate) && rate > 0) rates[quote] = rate;
      if (!date && row?.date) date = String(row.date);
    });
    state.fxRates = rates;
    state.fxDate = date;
    state.fxFetchedAt = fetchedAt;
    state.fxLive = live;
    state.fxSource = live ? 'live' : 'cached';
  };

  const loadFxRates = async () => {
    populateCurrencySelect();
    const cached = readFxCache();
    if (cached?.rates) {
      state.fxRates = { ...FALLBACK_FX_RATES, ...(cached.rates || {}) };
      state.fxDate = String(cached.date || '');
      state.fxFetchedAt = Number(cached.fetchedAt || 0);
      state.fxLive = false;
      state.fxSource = 'cached';
      updateCurrencyStatus();
      if (Date.now() - state.fxFetchedAt < FX_FRESH_MS) return;
    }
    try {
      const { response, payload } = await fetchJson(FX_URL, { headers: { Accept: 'application/json' } }, 8_000);
      if (!response.ok || !Array.isArray(payload)) throw new Error('Exchange rates unavailable');
      applyFxPayload(payload, Date.now(), true);
      try { localStorage.setItem(FX_CACHE_KEY, JSON.stringify({ rates: state.fxRates, date: state.fxDate, fetchedAt: state.fxFetchedAt })); } catch {}
      updateCurrencyStatus();
      renderCatalogue();
      renderOrders();
      if (elements.checkoutDialog?.open && state.selectedPurchase?.entry) {
        elements.checkoutPrice.textContent = combinedPriceText(state.selectedPurchase.entry.price_aud);
      }
    } catch {
      state.fxLive = false;
      if (!cached) {
        state.fxRates = { ...FALLBACK_FX_RATES };
        state.fxDate = FALLBACK_FX_DATE;
        state.fxSource = 'fallback';
      }
      updateCurrencyStatus();
      renderCatalogue();
      renderOrders();
      if (elements.checkoutDialog?.open && state.selectedPurchase?.entry) {
        elements.checkoutPrice.textContent = combinedPriceText(state.selectedPurchase.entry.price_aud);
      }
    }
  };

  const purchasePreview = (kind) => {
    const preview = document.createElement('div');
    preview.className = 'donation-card-preview';
    const icon = document.createElement('span');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = kind === 'package' ? '🎁' : '🧰';
    preview.append(icon);
    return preview;
  };

  const openCheckout = (purchaseType, entry) => {
    if (!state.user) {
      startLogin();
      return;
    }
    if (!state.server) {
      showPageError('Select a World War Z server before creating an order.');
      return;
    }
    if (state.server.paused) {
      showPageError(`${state.server.name} is currently paused, so purchases are unavailable for that server.`);
      return;
    }
    const methods = Array.isArray(state.catalogue?.payment?.methods) ? state.catalogue.payment.methods : [];
    if (!methods.length) {
      showPageError('No donation payment methods are configured yet.');
      return;
    }
    state.selectedPurchase = { purchaseType, entry };
    elements.checkoutTitle.textContent = 'Create Donation Order';
    elements.checkoutDescription.textContent = 'This creates a tracked WWZ order and private Discord purchase ticket. Payment remains external.';
    elements.checkoutPurchase.textContent = String(entry.name || 'Donation purchase');
    elements.checkoutPrice.textContent = combinedPriceText(entry.price_aud);
    elements.checkoutPayment.replaceChildren();
    methods.forEach((method) => {
      const label = String(method.label || '').trim();
      if (label) elements.checkoutPayment.add(new Option(label, label));
    });
    showCheckoutMessage('');
    elements.checkoutDialog.showModal();
  };

  const benefitLabel = (benefit) => {
    const type = String(benefit?.type || 'custom');
    if (type === 'item') {
      const key = String(benefit?.item_key || '');
      for (const category of state.catalogue.categories || []) {
        const item = (category.items || []).find((entry) => String(entry.key) === key);
        if (item) return String(item.name || 'Donation item');
      }
      return 'Donation item';
    }
    if (type === 'shop_discount') return `${Number(benefit.percent || 0)}% shop discount`;
    if (type === 'discord_currency') return `$${Number(benefit.amount || 0).toLocaleString('en-AU')} Discord currency`;
    return String(benefit?.label || titleCase(type));
  };

  const buildCard = (type, entry, categoryTitle = '') => {
    const card = document.createElement('article');
    card.className = 'donation-card';
    card.append(purchasePreview(type));
    const copy = document.createElement('div');
    copy.className = 'donation-card-copy';
    const kicker = document.createElement('p');
    kicker.className = 'panel-kicker';
    kicker.textContent = type === 'package' ? 'Donator package' : categoryTitle || 'Single item';
    const title = document.createElement('h3');
    title.textContent = String(entry.name || 'Donation purchase');
    const description = document.createElement('p');
    description.className = 'donation-card-description';
    description.textContent = String(entry.description || (type === 'package' ? 'Bundled World War Z supporter benefits.' : 'World War Z supporter item.'));
    const price = document.createElement('div');
    price.className = 'donation-price';
    const primary = document.createElement('strong');
    primary.textContent = selectedPriceText(entry.price_aud);
    price.append(primary);
    if ((state.displayCurrency || 'AUD') !== 'AUD') {
      const small = document.createElement('small');
      small.textContent = `${money(entry.price_aud)} authoritative`;
      price.append(small);
    } else {
      const converted = convertedText(entry.price_aud);
      if (converted) {
        const small = document.createElement('small');
        small.textContent = converted;
        price.append(small);
      }
    }
    copy.append(kicker, title, description, price);
    if (type === 'package') {
      const list = document.createElement('ul');
      list.className = 'donation-benefits';
      (entry.benefits || []).forEach((benefit) => {
        const row = document.createElement('li');
        row.textContent = benefitLabel(benefit);
        list.append(row);
      });
      copy.append(list);
    }
    const buy = button(state.user ? 'Create Purchase Order' : 'Sign in to Purchase');
    buy.disabled = Boolean(state.server?.paused);
    if (state.server?.paused) buy.textContent = 'Server Paused';
    buy.addEventListener('click', () => openCheckout(type, entry));
    copy.append(buy);
    card.append(copy);
    return card;
  };

  const renderCatalogue = () => {
    if (elements.intro) elements.intro.textContent = String(state.catalogue.intro || 'Support the World War Z community through optional donation items and packages.');
    elements.packages.replaceChildren();
    const packages = Array.isArray(state.catalogue.packages) ? state.catalogue.packages : [];
    packages.forEach((entry) => elements.packages.append(buildCard('package', entry)));
    elements.packagesEmpty.hidden = packages.length > 0;

    elements.categories.replaceChildren();
    let itemCount = 0;
    (state.catalogue.categories || []).forEach((category) => {
      const items = Array.isArray(category.items) ? category.items : [];
      if (!items.length) return;
      itemCount += items.length;
      const block = document.createElement('section');
      block.className = 'donation-category-block';
      const heading = document.createElement('h3');
      heading.textContent = String(category.title || 'Donation Items');
      const grid = document.createElement('div');
      grid.className = 'donation-item-grid';
      items.forEach((entry) => grid.append(buildCard('item', entry, category.title)));
      block.append(heading, grid);
      elements.categories.append(block);
    });
    elements.itemsEmpty.hidden = itemCount > 0;

    const payment = state.catalogue.payment || {};
    elements.paymentIntro.textContent = String(payment.intro || 'Choose one of the configured external payment methods after creating an order.');
    elements.paymentMethods.replaceChildren();
    (payment.methods || []).forEach((method) => {
      const card = document.createElement('div');
      card.className = 'donation-payment-method';
      const title = document.createElement('strong');
      title.textContent = String(method.label || 'Payment method');
      const copy = document.createElement('p');
      copy.textContent = method.url ? 'Available during checkout and on your saved order.' : 'Follow the payment instructions provided by World War Z staff.';
      card.append(title, copy);
      if (String(method.url || '').startsWith('https://')) {
        const link = document.createElement('a');
        link.className = 'secondary-action compact-action';
        link.href = method.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Open Payment Provider';
        card.append(link);
      }
      elements.paymentMethods.append(card);
    });
    elements.finalNotice.textContent = String(payment.final_notice || 'All payments are handled by the configured external provider.');
  };

  const renderServers = () => {
    elements.serverButtons.replaceChildren();
    state.servers.forEach((server) => {
      const control = button('', 'donation-server-button');
      const name = document.createElement('strong');
      name.textContent = server.name || server.map_name || server.key;
      const detail = document.createElement('small');
      detail.textContent = `${server.map_name || titleCase(server.map_key)}${server.paused ? ' · Paused' : ''}`;
      control.append(name, detail);
      control.classList.toggle('active', server.key === state.server?.key);
      control.setAttribute('aria-pressed', String(server.key === state.server?.key));
      control.addEventListener('click', async () => {
        if (state.loading || server.key === state.server?.key) return;
        saveServer(server);
        renderServers();
        await loadStorefront();
      });
      elements.serverButtons.append(control);
    });
  };

  const statusText = (status) => ({
    awaiting_payment: 'Awaiting Payment',
    proof_submitted: 'Proof Submitted',
    needs_info: 'More Info Needed',
    fulfilment: 'Fulfilment',
    completed: 'Completed',
    rejected: 'Rejected',
    cancelled: 'Cancelled'
  }[status] || titleCase(status));

  const submitProof = async (order, form) => {
    if (state.actionPending) return;
    const reference = $('[data-proof-reference]', form)?.value.trim() || '';
    const note = $('[data-proof-note]', form)?.value.trim() || '';
    if (!reference) {
      showPageError('Enter the PayPal/Nitrado payment reference or proof details first.');
      return;
    }
    state.actionPending = true;
    [...form.elements].forEach((entry) => { entry.disabled = true; });
    try {
      const { response, payload } = await fetchJson(URLS.orderAction, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ action: 'proof', order_id: order.order_id, reference, note })
      }, 30_000);
      if (!response.ok) throw new Error(payload.message || 'Payment proof could not be submitted.');
      showPageError('');
      await loadOrders();
    } catch (error) {
      showPageError(error.message || 'Payment proof could not be submitted.');
    } finally {
      state.actionPending = false;
      [...form.elements].forEach((entry) => { entry.disabled = false; });
    }
  };

  const cancelOrder = async (order, control) => {
    if (state.actionPending) return;
    if (!window.confirm(`Cancel unpaid order ${order.order_id}?`)) return;
    state.actionPending = true;
    control.disabled = true;
    try {
      const { response, payload } = await fetchJson(URLS.orderAction, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ action: 'cancel', order_id: order.order_id })
      }, 30_000);
      if (!response.ok) throw new Error(payload.message || 'The order could not be cancelled.');
      showPageError('');
      await loadOrders();
    } catch (error) {
      showPageError(error.message || 'The order could not be cancelled.');
    } finally {
      state.actionPending = false;
      control.disabled = false;
    }
  };

  const renderOrders = () => {
    if (!state.user) {
      elements.ordersGuest.hidden = false;
      elements.memberOrders.hidden = true;
      elements.ordersEmpty.hidden = true;
      return;
    }
    elements.ordersGuest.hidden = true;
    elements.memberOrders.replaceChildren();
    elements.memberOrders.hidden = state.orders.length === 0;
    elements.ordersEmpty.hidden = state.orders.length > 0;

    state.orders.forEach((order) => {
      const card = document.createElement('article');
      card.className = 'donation-member-order';
      const head = document.createElement('div');
      head.className = 'donation-member-order-head';
      const heading = document.createElement('div');
      const kicker = document.createElement('p');
      kicker.className = 'panel-kicker';
      kicker.textContent = order.order_id || 'Donation Order';
      const title = document.createElement('h3');
      title.textContent = order.purchase_name || 'Donation purchase';
      heading.append(kicker, title);
      const status = document.createElement('span');
      status.className = 'donation-member-order-status';
      status.dataset.status = order.status || '';
      status.textContent = statusText(order.status);
      head.append(heading, status);

      const body = document.createElement('div');
      body.className = 'donation-member-order-body';
      const meta = document.createElement('div');
      meta.className = 'donation-member-order-meta';
      [
        ['Amount', combinedPriceText(order.price_aud)],
        ['Payment', order.payment_method || '—'],
        ['Created', dateText(order.created_at)],
        ['Payment Reference', order.payment_reference || 'Not submitted']
      ].forEach(([label, value]) => {
        const row = document.createElement('div');
        const caption = document.createElement('span'); caption.textContent = label;
        const strong = document.createElement('strong'); strong.textContent = value;
        row.append(caption, strong); meta.append(row);
      });
      const benefits = document.createElement('div');
      benefits.className = 'donation-member-benefits';
      const benefitTitle = document.createElement('strong');
      benefitTitle.textContent = 'Fulfilment';
      benefits.append(benefitTitle);
      (order.fulfilment || []).forEach((benefit) => {
        const row = document.createElement('div');
        row.className = 'donation-member-benefit';
        const label = document.createElement('span'); label.textContent = benefit.label || titleCase(benefit.type);
        const value = document.createElement('span'); value.textContent = titleCase(benefit.status || 'pending');
        if (benefit.note) value.title = benefit.note;
        row.append(label, value); benefits.append(row);
      });
      if (!(order.fulfilment || []).length) {
        const empty = document.createElement('span');
        empty.textContent = 'No fulfilment tasks are attached to this order.';
        benefits.append(empty);
      }
      body.append(meta, benefits);

      const actions = document.createElement('div');
      actions.className = 'donation-member-order-actions';
      if (String(order.payment_url || '').startsWith('https://') && ['awaiting_payment', 'needs_info'].includes(order.status)) {
        const pay = document.createElement('a');
        pay.className = 'primary-action compact-action';
        pay.href = order.payment_url;
        pay.target = '_blank';
        pay.rel = 'noopener noreferrer';
        pay.textContent = 'Open Payment Provider';
        actions.append(pay);
      }
      if (String(order.ticket_url || '').startsWith('https://')) {
        const ticket = document.createElement('a');
        ticket.className = 'secondary-action compact-action';
        ticket.href = order.ticket_url;
        ticket.target = '_blank';
        ticket.rel = 'noopener noreferrer';
        ticket.textContent = `Open Purchase Ticket${order.ticket_number ? ` #${order.ticket_number}` : ''}`;
        actions.append(ticket);
      }
      if (['awaiting_payment', 'needs_info'].includes(order.status)) {
        const proof = document.createElement('form');
        proof.className = 'donation-proof-form';
        const reference = document.createElement('input');
        reference.type = 'text'; reference.maxLength = 700; reference.required = true;
        reference.placeholder = 'PayPal/Nitrado reference or proof details'; reference.dataset.proofReference = '';
        reference.value = order.payment_reference || '';
        const note = document.createElement('input');
        note.type = 'text'; note.maxLength = 1200; note.placeholder = 'Optional note'; note.dataset.proofNote = '';
        note.value = order.member_note || '';
        const submit = document.createElement('button');
        submit.type = 'submit'; submit.className = 'secondary-action compact-action';
        submit.textContent = order.payment_reference ? 'Update Proof' : 'Submit Payment Proof';
        proof.append(reference, note, submit);
        proof.addEventListener('submit', (event) => { event.preventDefault(); submitProof(order, proof); });
        actions.append(proof);

        const cancel = button('Cancel Order', 'dialog-cancel compact-action');
        cancel.addEventListener('click', () => cancelOrder(order, cancel));
        actions.append(cancel);
      }
      card.append(head, body, actions);
      elements.memberOrders.append(card);
    });
  };

  const loadOrders = async () => {
    if (!state.user || !state.server) {
      state.orders = [];
      renderOrders();
      return;
    }
    const { response, payload } = await fetchJson(URLS.orders, { headers: authHeaders() });
    if (response.status === 401 || response.status === 403) {
      state.token = '';
      sessionStorage.removeItem(SESSION_KEY);
      setSignedOut();
      state.orders = [];
      renderOrders();
      return;
    }
    if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Donation orders could not be loaded.');
    state.orders = Array.isArray(payload.orders) ? payload.orders : [];
    renderOrders();
  };

  const loadCatalogue = async () => {
    const { response, payload } = await fetchJson(URLS.catalogue, { headers: { Accept: 'application/json' } });
    if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Donation catalogue could not be loaded.');
    state.catalogue = payload.catalogue || { categories: [], packages: [], payment: { methods: [] } };
    if (payload.server) {
      const matched = state.servers.find((entry) => entry.key === payload.server.key);
      if (matched) saveServer({ ...matched, ...payload.server });
    }
    renderCatalogue();
    renderServers();
  };

  const loadStorefront = async () => {
    if (state.loading || !state.server) return;
    state.loading = true;
    showPageError('');
    if (elements.refresh) elements.refresh.disabled = true;
    if (elements.ordersRefresh) elements.ordersRefresh.disabled = true;
    setConnection('loading', 'Refreshing');
    try {
      await loadCatalogue();
      await loadOrders();
      setConnection('online', 'Railway connected');
    } catch (error) {
      setConnection('unavailable', 'Store unavailable');
      showPageError(error.message || 'The donation storefront is temporarily unavailable.');
    } finally {
      state.loading = false;
      if (elements.refresh) elements.refresh.disabled = false;
      if (elements.ordersRefresh) elements.ordersRefresh.disabled = false;
    }
  };

  const loadServers = async () => {
    const { response, payload } = await fetchJson(URLS.servers, { headers: { Accept: 'application/json' } });
    if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'World War Z server choices could not be loaded.');
    state.servers = Array.isArray(payload.servers) ? payload.servers : [];
    const stored = readServer();
    const selected = state.servers.find((entry) => entry.key === stored?.key) || state.servers.find((entry) => !entry.paused) || state.servers[0] || null;
    saveServer(selected);
    renderServers();
  };

  const createOrder = async (event) => {
    event.preventDefault();
    if (!state.user || !state.selectedPurchase || state.actionPending) return;
    const paymentMethod = elements.checkoutPayment.value;
    if (!paymentMethod) {
      showCheckoutMessage('Select a payment method.');
      return;
    }
    state.actionPending = true;
    elements.checkoutConfirm.disabled = true;
    showCheckoutMessage('Creating your tracked WWZ order and private purchase ticket…', 'info');
    try {
      const { purchaseType, entry } = state.selectedPurchase;
      const { response, payload } = await fetchJson(URLS.orderAction, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          action: 'create',
          purchase_type: purchaseType,
          catalogue_key: entry.key,
          payment_method: paymentMethod
        })
      }, 45_000);
      if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'The donation order could not be created.');
      const warnings = [payload.message || 'Donation order created.'];
      if (payload.ticket_warning) warnings.push(payload.ticket_warning);
      if (payload.payment_url) warnings.push('Opening the external payment provider now. Return here afterward to submit the payment reference/proof.');
      else warnings.push('No direct payment URL is configured. Follow the payment instructions shown on this page or in your purchase ticket.');
      showCheckoutMessage(warnings.join(' '), payload.ticket_warning ? 'info' : 'success');
      await loadOrders();
      if (String(payload.payment_url || '').startsWith('https://')) {
        window.open(payload.payment_url, '_blank', 'noopener,noreferrer');
      }
      window.setTimeout(() => {
        if (elements.checkoutDialog.open) elements.checkoutDialog.close();
        document.querySelector('#orders')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 1400);
    } catch (error) {
      showCheckoutMessage(error.message || 'The donation order could not be created.');
    } finally {
      state.actionPending = false;
      elements.checkoutConfirm.disabled = false;
    }
  };

  elements.authButton?.addEventListener('click', () => state.user ? document.querySelector('#orders')?.scrollIntoView({ behavior: 'smooth' }) : startLogin());
  elements.ordersSignin?.addEventListener('click', startLogin);
  elements.signout?.addEventListener('click', async () => {
    const token = state.token;
    state.token = '';
    sessionStorage.removeItem(SESSION_KEY);
    setSignedOut();
    state.orders = [];
    renderOrders();
    renderCatalogue();
    if (token) fetchJson(URLS.authLogout, { method: 'POST', headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } }).catch(() => {});
  });
  elements.currencySelect?.addEventListener('change', () => {
    const selected = String(elements.currencySelect.value || 'AUD').toUpperCase();
    state.displayCurrency = DISPLAY_CURRENCIES.some(([code]) => code === selected) ? selected : 'AUD';
    try { localStorage.setItem(CURRENCY_KEY, state.displayCurrency); } catch {}
    updateCurrencyStatus();
    renderCatalogue();
    renderOrders();
    if (elements.checkoutDialog?.open && state.selectedPurchase?.entry) {
      elements.checkoutPrice.textContent = combinedPriceText(state.selectedPurchase.entry.price_aud);
    }
  });
  elements.refresh?.addEventListener('click', async () => {
    await Promise.allSettled([loadStorefront(), loadFxRates()]);
  });
  elements.ordersRefresh?.addEventListener('click', async () => {
    if (!state.user) { startLogin(); return; }
    try { await loadOrders(); showPageError(''); } catch (error) { showPageError(error.message || 'Donation orders could not be loaded.'); }
  });
  elements.checkoutForm?.addEventListener('submit', createOrder);
  elements.checkoutCancel?.addEventListener('click', () => { if (!state.actionPending) elements.checkoutDialog.close(); });

  const initialise = async () => {
    setSignedOut();
    setConnection('loading', 'Connecting');
    state.displayCurrency = inferredCurrency();
    populateCurrencySelect();
    updateCurrencyStatus('Loading live exchange rates…');
    loadFxRates().catch(() => {});
    try {
      const [authResult] = await Promise.all([
        fetchJson(URLS.authConfig, { headers: { Accept: 'application/json' } }).catch(() => ({ response: { ok: false }, payload: {} })),
        loadServers()
      ]);
      state.authEnabled = Boolean(authResult.response?.ok && authResult.payload?.discord_auth?.enabled);

      const fragment = callback();
      if (fragment.error) {
        clearCallback();
        showPageError('Discord sign-in was not completed. You can still browse the donation catalogue.');
      } else if (fragment.ticket) {
        try { await completeLogin(fragment.ticket); }
        catch (error) {
          clearCallback();
          state.token = '';
          sessionStorage.removeItem(SESSION_KEY);
          setSignedOut();
          showPageError(error.message || 'Discord sign-in could not be completed.');
        }
      } else {
        try { await loadIdentity(); }
        catch { setSignedOut(); }
      }

      if (!state.server) throw new Error('No World War Z donation server is currently available.');
      await loadStorefront();
    } catch (error) {
      setConnection('unavailable', 'Store unavailable');
      showPageError(error.message || 'The donation storefront is temporarily unavailable.');
    }
  };

  initialise();
})();
