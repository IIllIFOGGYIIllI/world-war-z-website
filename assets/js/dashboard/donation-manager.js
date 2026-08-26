(() => {
  'use strict';

  const ADMIN_DONATIONS_URL = `${DASHBOARD_API_BASE}/api/admin/donations`;
  const ADMIN_DONATIONS_ACTION_URL = `${DASHBOARD_API_BASE}/api/admin/donations/action`;
  const root = document.querySelector('[data-donation-manager]');
  if (!root) return;

  const channelSelect = root.querySelector('[data-donation-channel]');
  const titleInput = root.querySelector('[data-donation-title]');
  const introInput = root.querySelector('[data-donation-intro]');
  const usdEnabled = root.querySelector('[data-donation-usd-enabled]');
  const usdRate = root.querySelector('[data-donation-usd-rate]');
  const categoriesHost = root.querySelector('[data-donation-categories]');
  const packagesHost = root.querySelector('[data-donation-packages]');
  const paymentIntro = root.querySelector('[data-donation-payment-intro]');
  const paymentMethodsHost = root.querySelector('[data-donation-payment-methods]');
  const paymentNotice = root.querySelector('[data-donation-payment-notice]');
  const revisionsHost = root.querySelector('[data-donation-revisions]');
  const revisionsEmpty = root.querySelector('[data-donation-revisions-empty]');
  const summary = root.querySelector('[data-donation-summary]');
  const updated = root.querySelector('[data-donation-updated]');
  const message = root.querySelector('[data-donation-message]');
  const error = root.querySelector('[data-donation-error]');
  const addCategoryButton = root.querySelector('[data-donation-add-category]');
  const addPackageButton = root.querySelector('[data-donation-add-package]');
  const addPaymentMethodButton = root.querySelector('[data-donation-add-payment-method]');
  const saveButton = root.querySelector('[data-donation-save]');
  const publishButton = root.querySelector('[data-donation-publish]');
  const unpublishButton = root.querySelector('[data-donation-unpublish]');
  const refreshButton = root.querySelector('[data-donation-refresh]');

  let requestInProgress = false;
  let state = { record: { document: {} }, channels: [], revisions: [] };

  const makeKey = (prefix = 'entry') => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const showMessage = (text = '', tone = 'error') => {
    if (!message) return;
    message.hidden = !text;
    message.textContent = text;
    message.dataset.tone = tone;
  };

  const button = (label, className = 'secondary-action compact-action') => {
    const element = document.createElement('button');
    element.type = 'button';
    element.className = className;
    element.textContent = label;
    return element;
  };

  const moveControls = (element, container, sync) => {
    const actions = document.createElement('div');
    actions.className = 'donation-row-actions';
    const up = button('↑', 'icon-button rules-mini-button');
    const down = button('↓', 'icon-button rules-mini-button');
    up.title = 'Move up';
    down.title = 'Move down';
    up.addEventListener('click', () => {
      const previous = element.previousElementSibling;
      const host = container || element.parentElement;
      if (previous && host) host.insertBefore(element, previous);
      sync();
    });
    down.addEventListener('click', () => {
      const next = element.nextElementSibling;
      const host = container || element.parentElement;
      if (next && host) host.insertBefore(next, element);
      sync();
    });
    actions.append(up, down);
    return { actions, up, down };
  };

  const itemRows = () => [...categoriesHost.querySelectorAll('[data-donation-item]')];
  const itemOptions = () => itemRows().map((row) => ({
    key: row.dataset.itemKey,
    name: row.querySelector('[data-donation-item-name]')?.value.trim() || 'Unnamed item'
  }));

  const refreshBenefitItemOptions = () => {
    const options = itemOptions();
    packagesHost.querySelectorAll('[data-benefit-item-key]').forEach((select) => {
      const current = select.value;
      select.replaceChildren(new Option('Select catalogue item…', ''));
      options.forEach((item) => select.add(new Option(item.name, item.key)));
      select.value = current;
      if (!select.value && current) {
        select.add(new Option(`Missing item (${current})`, current));
        select.value = current;
      }
    });
  };

  const sync = () => {
    [...categoriesHost.querySelectorAll('[data-donation-category]')].forEach((card, index, cards) => {
      const number = card.querySelector('[data-donation-category-number]');
      if (number) number.textContent = String(index + 1).padStart(2, '0');
      const up = card.querySelector('[data-category-up]');
      const down = card.querySelector('[data-category-down]');
      if (up) up.disabled = index === 0;
      if (down) down.disabled = index === cards.length - 1;
      [...card.querySelectorAll('[data-donation-item]')].forEach((row, rowIndex, rows) => {
        const rowUp = row.querySelector('[data-item-up]');
        const rowDown = row.querySelector('[data-item-down]');
        if (rowUp) rowUp.disabled = rowIndex === 0;
        if (rowDown) rowDown.disabled = rowIndex === rows.length - 1;
      });
    });
    [...packagesHost.querySelectorAll('[data-donation-package]')].forEach((card, index, cards) => {
      const number = card.querySelector('[data-donation-package-number]');
      if (number) number.textContent = String(index + 1).padStart(2, '0');
      const up = card.querySelector('[data-package-up]');
      const down = card.querySelector('[data-package-down]');
      if (up) up.disabled = index === 0;
      if (down) down.disabled = index === cards.length - 1;
      [...card.querySelectorAll('[data-donation-benefit]')].forEach((row, rowIndex, rows) => {
        const rowUp = row.querySelector('[data-benefit-up]');
        const rowDown = row.querySelector('[data-benefit-down]');
        if (rowUp) rowUp.disabled = rowIndex === 0;
        if (rowDown) rowDown.disabled = rowIndex === rows.length - 1;
      });
    });
    [...paymentMethodsHost.querySelectorAll('[data-donation-payment-method]')].forEach((row, rowIndex, rows) => {
      const rowUp = row.querySelector('[data-payment-up]');
      const rowDown = row.querySelector('[data-payment-down]');
      if (rowUp) rowUp.disabled = rowIndex === 0;
      if (rowDown) rowDown.disabled = rowIndex === rows.length - 1;
    });
    refreshBenefitItemOptions();
    const categoryCount = categoriesHost.querySelectorAll('[data-donation-category]').length;
    const itemCount = itemRows().length;
    const packageCount = packagesHost.querySelectorAll('[data-donation-package]').length;
    if (summary) summary.textContent = `${categoryCount} categor${categoryCount === 1 ? 'y' : 'ies'} · ${itemCount} item${itemCount === 1 ? '' : 's'} · ${packageCount} package${packageCount === 1 ? '' : 's'}`;
    if (usdRate) usdRate.disabled = !usdEnabled?.checked;
  };

  const createItemRow = (item = {}) => {
    const row = document.createElement('div');
    row.className = 'donation-item-row';
    row.dataset.donationItem = '';
    row.dataset.itemKey = item.key || makeKey('item');

    const enabled = document.createElement('input');
    enabled.type = 'checkbox';
    enabled.checked = item.enabled !== false;
    enabled.dataset.donationItemEnabled = '';
    enabled.title = 'Include this item when publishing';

    const name = document.createElement('input');
    name.type = 'text';
    name.maxLength = 120;
    name.placeholder = 'Item name';
    name.value = item.name || '';
    name.dataset.donationItemName = '';

    const price = document.createElement('input');
    price.type = 'number';
    price.min = '0';
    price.max = '1000000';
    price.step = '0.01';
    price.placeholder = 'AUD price';
    price.value = item.price_aud ?? '0.00';
    price.dataset.donationItemPrice = '';

    const description = document.createElement('textarea');
    description.rows = 2;
    description.maxLength = 1200;
    description.placeholder = 'Description / fulfilment note';
    description.value = item.description || '';
    description.dataset.donationItemDescription = '';

    const controls = moveControls(row, null, sync);
    controls.up.dataset.itemUp = '';
    controls.down.dataset.itemDown = '';
    const remove = button('×', 'icon-button rules-mini-button danger');
    remove.title = 'Delete item';
    remove.addEventListener('click', () => {
      const referenced = [...packagesHost.querySelectorAll('[data-benefit-item-key]')].some((select) => select.value === row.dataset.itemKey);
      if (referenced) {
        showMessage('That item is still included in a package. Remove the package benefit first.', 'error');
        return;
      }
      row.remove();
      sync();
    });
    controls.actions.append(remove);
    controls.up.addEventListener('click', () => {});
    name.addEventListener('input', sync);
    enabled.addEventListener('change', sync);
    row.append(enabled, name, price, description, controls.actions);
    return row;
  };

  const createCategoryCard = (category = {}) => {
    const card = document.createElement('article');
    card.className = 'donation-card';
    card.dataset.donationCategory = '';
    card.dataset.categoryKey = category.key || makeKey('category');

    const heading = document.createElement('div');
    heading.className = 'donation-card-heading';
    const identity = document.createElement('div');
    identity.className = 'donation-card-identity';
    const number = document.createElement('span');
    number.className = 'donation-card-number';
    number.dataset.donationCategoryNumber = '';
    const title = document.createElement('input');
    title.type = 'text';
    title.maxLength = 100;
    title.placeholder = 'CATEGORY TITLE';
    title.value = category.title || '';
    title.dataset.donationCategoryTitle = '';
    identity.append(number, title);

    const actions = document.createElement('div');
    actions.className = 'donation-card-actions';
    const up = button('Move Up'); up.dataset.categoryUp = '';
    const down = button('Move Down'); down.dataset.categoryDown = '';
    const remove = button('Delete Category', 'secondary-action compact-action danger-outline');
    up.addEventListener('click', () => { const previous = card.previousElementSibling; if (previous) categoriesHost.insertBefore(card, previous); sync(); });
    down.addEventListener('click', () => { const next = card.nextElementSibling; if (next) categoriesHost.insertBefore(next, card); sync(); });
    remove.addEventListener('click', () => {
      const keys = [...card.querySelectorAll('[data-donation-item]')].map((row) => row.dataset.itemKey);
      const referenced = [...packagesHost.querySelectorAll('[data-benefit-item-key]')].some((select) => keys.includes(select.value));
      if (referenced) {
        showMessage('This category contains an item still used by a package. Remove those package benefits first.', 'error');
        return;
      }
      if (!window.confirm(`Delete ${title.value || 'this category'} from the donation draft?`)) return;
      card.remove();
      sync();
    });
    actions.append(up, down, remove);
    heading.append(identity, actions);

    const list = document.createElement('div');
    list.className = 'donation-item-list';
    list.dataset.donationItemList = '';
    (Array.isArray(category.items) && category.items.length ? category.items : [{}]).forEach((item) => list.append(createItemRow(item)));
    const addItem = button('+ Add Item');
    addItem.addEventListener('click', () => { list.append(createItemRow()); sync(); list.lastElementChild?.querySelector('[data-donation-item-name]')?.focus(); });
    title.addEventListener('input', sync);
    card.append(heading, list, addItem);
    return card;
  };

  const createBenefitRow = (benefit = {}) => {
    const row = document.createElement('div');
    row.className = 'donation-benefit-row';
    row.dataset.donationBenefit = '';

    const type = document.createElement('select');
    type.dataset.benefitType = '';
    [['item','Catalogue Item'],['role','Discord Role'],['shop_discount','Shop Discount'],['discord_currency','Discord Currency'],['custom','Custom Benefit']].forEach(([value,label]) => type.add(new Option(label,value)));
    type.value = benefit.type || 'item';

    const valueHost = document.createElement('div');
    valueHost.dataset.benefitValueHost = '';
    const renderValue = () => {
      const current = type.value;
      const old = valueHost.firstElementChild;
      const previousValue = old?.value;
      valueHost.replaceChildren();
      let field;
      if (current === 'item') {
        field = document.createElement('select');
        field.dataset.benefitItemKey = '';
        const desired = benefit.type === 'item' ? benefit.item_key || '' : previousValue || '';
        field.add(new Option('Select catalogue item…', ''));
        itemOptions().forEach((item) => field.add(new Option(item.name, item.key)));
        field.value = desired;
      } else {
        field = document.createElement('input');
        if (current === 'shop_discount') {
          field.type = 'number'; field.min = '0'; field.max = '100'; field.step = '1'; field.dataset.benefitPercent = ''; field.placeholder = 'Discount %';
          field.value = benefit.type === current ? benefit.percent ?? 0 : previousValue || 0;
        } else if (current === 'discord_currency') {
          field.type = 'number'; field.min = '0'; field.max = '2000000000'; field.step = '1'; field.dataset.benefitAmount = ''; field.placeholder = 'Discord currency amount';
          field.value = benefit.type === current ? benefit.amount ?? 0 : previousValue || 0;
        } else {
          field.type = 'text'; field.maxLength = current === 'custom' ? 1200 : 120; field.dataset.benefitLabel = ''; field.placeholder = current === 'role' ? 'Role name' : 'Benefit description';
          field.value = benefit.type === current ? benefit.label || '' : previousValue || '';
        }
      }
      valueHost.append(field);
    };
    type.addEventListener('change', () => { renderValue(); sync(); });
    renderValue();

    const controls = moveControls(row, null, sync);
    controls.up.dataset.benefitUp = '';
    controls.down.dataset.benefitDown = '';
    controls.up.addEventListener('click', () => {});
    const remove = button('×', 'icon-button rules-mini-button danger');
    remove.title = 'Delete benefit';
    remove.addEventListener('click', () => { row.remove(); sync(); });
    controls.actions.append(remove);
    row.append(type, valueHost, controls.actions);
    return row;
  };

  const createPackageCard = (packageData = {}) => {
    const card = document.createElement('article');
    card.className = 'donation-card';
    card.dataset.donationPackage = '';
    card.dataset.packageKey = packageData.key || makeKey('package');

    const heading = document.createElement('div');
    heading.className = 'donation-card-heading';
    const identity = document.createElement('div');
    identity.className = 'donation-card-identity';
    const number = document.createElement('span');
    number.className = 'donation-card-number';
    number.dataset.donationPackageNumber = '';
    const name = document.createElement('input');
    name.type = 'text'; name.maxLength = 120; name.placeholder = 'Package name'; name.value = packageData.name || ''; name.dataset.donationPackageName = '';
    identity.append(number, name);
    const actions = document.createElement('div');
    actions.className = 'donation-card-actions';
    const up = button('Move Up'); up.dataset.packageUp = '';
    const down = button('Move Down'); down.dataset.packageDown = '';
    const remove = button('Delete Package', 'secondary-action compact-action danger-outline');
    up.addEventListener('click', () => { const previous = card.previousElementSibling; if (previous) packagesHost.insertBefore(card, previous); sync(); });
    down.addEventListener('click', () => { const next = card.nextElementSibling; if (next) packagesHost.insertBefore(next, card); sync(); });
    remove.addEventListener('click', () => { if (window.confirm(`Delete ${name.value || 'this package'} from the donation draft?`)) { card.remove(); sync(); } });
    actions.append(up, down, remove);
    heading.append(identity, actions);

    const meta = document.createElement('div');
    meta.className = 'donation-manager-package-meta';
    const descriptionLabel = document.createElement('label');
    descriptionLabel.className = 'dialog-field wide';
    const descriptionTitle = document.createElement('span'); descriptionTitle.textContent = 'Package description';
    const description = document.createElement('textarea'); description.rows = 2; description.maxLength = 1200; description.value = packageData.description || ''; description.dataset.donationPackageDescription = '';
    descriptionLabel.append(descriptionTitle, description);
    const priceLabel = document.createElement('label'); priceLabel.className = 'dialog-field';
    const priceTitle = document.createElement('span'); priceTitle.textContent = 'AUD price';
    const price = document.createElement('input'); price.type = 'number'; price.min = '0'; price.max = '1000000'; price.step = '0.01'; price.value = packageData.price_aud ?? '0.00'; price.dataset.donationPackagePrice = '';
    priceLabel.append(priceTitle, price);
    const enabledLabel = document.createElement('label'); enabledLabel.className = 'donation-manager-toggle';
    const enabled = document.createElement('input'); enabled.type = 'checkbox'; enabled.checked = packageData.enabled !== false; enabled.dataset.donationPackageEnabled = '';
    const enabledText = document.createElement('span'); enabledText.textContent = 'Publish package';
    enabledLabel.append(enabled, enabledText);
    meta.append(priceLabel, enabledLabel, descriptionLabel);

    const benefitsTitle = document.createElement('div'); benefitsTitle.className = 'donation-manager-mini-label'; benefitsTitle.textContent = 'Package benefits';
    const benefits = document.createElement('div'); benefits.className = 'donation-benefit-list'; benefits.dataset.donationBenefitList = '';
    (Array.isArray(packageData.benefits) && packageData.benefits.length ? packageData.benefits : [{ type: 'custom', label: '' }]).forEach((entry) => benefits.append(createBenefitRow(entry)));
    const addBenefit = button('+ Add Benefit');
    addBenefit.addEventListener('click', () => { benefits.append(createBenefitRow({ type: 'item' })); sync(); });
    name.addEventListener('input', sync);
    enabled.addEventListener('change', sync);
    card.append(heading, meta, benefitsTitle, benefits, addBenefit);
    return card;
  };

  const createPaymentMethodRow = (method = {}) => {
    const row = document.createElement('div');
    row.className = 'donation-payment-row';
    row.dataset.donationPaymentMethod = '';
    const label = document.createElement('input'); label.type = 'text'; label.maxLength = 120; label.placeholder = 'Method label'; label.value = method.label || ''; label.dataset.paymentLabel = '';
    const url = document.createElement('input'); url.type = 'url'; url.maxLength = 500; url.placeholder = 'https://… (optional)'; url.value = method.url || ''; url.dataset.paymentUrl = '';
    const controls = moveControls(row, paymentMethodsHost, sync);
    controls.up.dataset.paymentUp = '';
    controls.down.dataset.paymentDown = '';
    const remove = button('×', 'icon-button rules-mini-button danger');
    remove.title = 'Delete payment method';
    remove.addEventListener('click', () => { row.remove(); sync(); });
    controls.actions.append(remove);
    row.append(label, url, controls.actions);
    return row;
  };

  const benefitFromRow = (row) => {
    const type = row.querySelector('[data-benefit-type]')?.value || 'custom';
    if (type === 'item') return { type, item_key: row.querySelector('[data-benefit-item-key]')?.value || '' };
    if (type === 'shop_discount') return { type, percent: Number(row.querySelector('[data-benefit-percent]')?.value || 0) };
    if (type === 'discord_currency') return { type, amount: Number(row.querySelector('[data-benefit-amount]')?.value || 0) };
    return { type, label: row.querySelector('[data-benefit-label]')?.value || '' };
  };

  const documentFromDom = () => ({
    title: titleInput.value || '',
    intro: introInput.value || '',
    currency: 'AUD',
    show_usd_estimates: Boolean(usdEnabled.checked),
    usd_rate: usdRate.value || '',
    categories: [...categoriesHost.querySelectorAll('[data-donation-category]')].map((card) => ({
      key: card.dataset.categoryKey,
      title: card.querySelector('[data-donation-category-title]')?.value || '',
      items: [...card.querySelectorAll('[data-donation-item]')].map((row) => ({
        key: row.dataset.itemKey,
        name: row.querySelector('[data-donation-item-name]')?.value || '',
        price_aud: row.querySelector('[data-donation-item-price]')?.value || '0',
        description: row.querySelector('[data-donation-item-description]')?.value || '',
        enabled: Boolean(row.querySelector('[data-donation-item-enabled]')?.checked)
      }))
    })),
    packages: [...packagesHost.querySelectorAll('[data-donation-package]')].map((card) => ({
      key: card.dataset.packageKey,
      name: card.querySelector('[data-donation-package-name]')?.value || '',
      price_aud: card.querySelector('[data-donation-package-price]')?.value || '0',
      description: card.querySelector('[data-donation-package-description]')?.value || '',
      enabled: Boolean(card.querySelector('[data-donation-package-enabled]')?.checked),
      benefits: [...card.querySelectorAll('[data-donation-benefit]')].map(benefitFromRow)
    })),
    payment: {
      intro: paymentIntro.value || '',
      methods: [...paymentMethodsHost.querySelectorAll('[data-donation-payment-method]')].map((row) => ({
        label: row.querySelector('[data-payment-label]')?.value || '',
        url: row.querySelector('[data-payment-url]')?.value || ''
      })),
      final_notice: paymentNotice.value || ''
    }
  });

  const render = () => {
    const record = state.record || {};
    const documentData = record.document || {};
    titleInput.value = documentData.title || 'WORLD WAR Z DONATIONS';
    introInput.value = documentData.intro || '';
    usdEnabled.checked = Boolean(documentData.show_usd_estimates);
    usdRate.value = documentData.usd_rate || '';

    categoriesHost.replaceChildren();
    (documentData.categories || []).forEach((category) => categoriesHost.append(createCategoryCard(category)));
    if (!categoriesHost.children.length) categoriesHost.append(createCategoryCard());

    packagesHost.replaceChildren();
    (documentData.packages || []).forEach((entry) => packagesHost.append(createPackageCard(entry)));
    if (!packagesHost.children.length) packagesHost.append(createPackageCard());

    paymentIntro.value = documentData.payment?.intro || '';
    paymentNotice.value = documentData.payment?.final_notice || '';
    paymentMethodsHost.replaceChildren();
    (documentData.payment?.methods || []).forEach((method) => paymentMethodsHost.append(createPaymentMethodRow(method)));
    if (!paymentMethodsHost.children.length) paymentMethodsHost.append(createPaymentMethodRow());

    channelSelect.replaceChildren(new Option('Select Discord donation channel…', ''));
    (state.channels || []).forEach((channel) => {
      const category = channel.category ? `${channel.category} / ` : '';
      const warning = channel.can_publish ? '' : ' · missing publish permission';
      channelSelect.add(new Option(`${category}#${channel.name}${warning}`, channel.key));
    });
    channelSelect.value = record.channel_key || '';

    revisionsHost.replaceChildren();
    (state.revisions || []).forEach((revision) => {
      const item = document.createElement('li');
      const symbol = document.createElement('span');
      symbol.className = 'activity-symbol';
      symbol.textContent = revision.action === 'publish' ? '↥' : revision.action === 'unpublish' ? '−' : revision.action === 'seed' ? '★' : '✎';
      const copy = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = `Revision ${revision.revision} · ${String(revision.action || 'save').replace(/_/g, ' ')}`;
      const small = document.createElement('small');
      small.textContent = `${revision.actor_name || 'System'} · ${revision.created_at ? formatAccountDate(revision.created_at) : 'Unknown time'}`;
      copy.append(strong, small);
      item.append(symbol, copy);
      revisionsHost.append(item);
    });
    if (revisionsEmpty) revisionsEmpty.hidden = Boolean((state.revisions || []).length);
    if (updated) {
      const when = record.updated_at ? formatAccountDate(record.updated_at) : 'Not yet';
      const by = record.updated_by_name ? ` by ${record.updated_by_name}` : '';
      const published = record.published_at ? ` · Discord published ${formatAccountDate(record.published_at)}` : ' · Not currently published by WWZ';
      updated.textContent = `Revision ${record.revision || 0} · Updated ${when}${by}${published}`;
    }
    if (unpublishButton) unpublishButton.disabled = !record.published_at;
    sync();
  };

  const load = async () => {
    const token = storageGet(AUTH_SESSION_KEY);
    if (!token || !['staff', 'owner'].includes(dashboardAccessLevel) || requestInProgress) return false;
    requestInProgress = true;
    refreshButton?.setAttribute('disabled', '');
    if (error) error.hidden = true;
    showMessage('');
    try {
      const response = await authFetch(ADMIN_DONATIONS_URL, { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } });
      const payload = await response.json().catch(() => ({}));
      if (handleAdminPlayerAuthorizationResponse(response, payload, { actionRequest: false })) return false;
      if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Donation Manager unavailable.');
      state = { record: payload.record || { document: {} }, channels: payload.channels || [], revisions: payload.revisions || [] };
      render();
      return true;
    } catch (problem) {
      if (error) { error.hidden = false; error.textContent = problem instanceof Error ? problem.message : 'Donation Manager is temporarily unavailable.'; }
      return false;
    } finally {
      requestInProgress = false;
      refreshButton?.removeAttribute('disabled');
    }
  };

  const validateDraft = (documentData, actionName) => {
    if (!documentData.title.trim()) return 'Donation title is required.';
    if (!documentData.categories.length || documentData.categories.some((category) => !category.title.trim() || !category.items.length)) return 'Every donation category needs a title and at least one item.';
    if (documentData.categories.some((category) => category.items.some((item) => !item.name.trim()))) return 'Every donation item needs a name.';
    if (!documentData.packages.length || documentData.packages.some((entry) => !entry.name.trim() || !entry.benefits.length)) return 'Every donation package needs a name and at least one benefit.';
    if (documentData.packages.some((entry) => entry.benefits.some((benefit) => benefit.type === 'item' && !benefit.item_key))) return 'Every catalogue-item package benefit must select an item.';
    if (!documentData.payment.methods.length || documentData.payment.methods.some((method) => !method.label.trim())) return 'At least one named payment method is required.';
    if (documentData.show_usd_estimates && !documentData.usd_rate) return 'Enter an approximate USD conversion rate before enabling USD estimates.';
    if (actionName === 'publish' && !channelSelect.value) return 'Select the Discord donation channel before publishing.';
    return '';
  };

  const action = async (name, actionButton) => {
    const token = storageGet(AUTH_SESSION_KEY);
    if (!token || !['staff', 'owner'].includes(dashboardAccessLevel) || requestInProgress) return false;
    const documentData = documentFromDom();
    if (name !== 'unpublish') {
      const validation = validateDraft(documentData, name);
      if (validation) { showMessage(validation, 'error'); return false; }
    }
    requestInProgress = true;
    actionButton?.setAttribute('disabled', '');
    showMessage('');
    try {
      const response = await authFetch(ADMIN_DONATIONS_ACTION_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: name, channel_key: channelSelect.value || '', document: documentData })
      });
      const payload = await response.json().catch(() => ({}));
      if (handleAdminPlayerAuthorizationResponse(response, payload, { actionRequest: true })) return false;
      if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Donation Manager action failed.');
      const success = payload.message || 'Donation catalogue updated.';
      requestInProgress = false;
      await load();
      showMessage(success, 'success');
      return true;
    } catch (problem) {
      showMessage(problem instanceof Error ? problem.message : 'Donation Manager action failed.', 'error');
      return false;
    } finally {
      requestInProgress = false;
      actionButton?.removeAttribute('disabled');
    }
  };

  addCategoryButton?.addEventListener('click', () => { categoriesHost.append(createCategoryCard()); sync(); categoriesHost.lastElementChild?.querySelector('[data-donation-category-title]')?.focus(); });
  addPackageButton?.addEventListener('click', () => { packagesHost.append(createPackageCard()); sync(); packagesHost.lastElementChild?.querySelector('[data-donation-package-name]')?.focus(); });
  addPaymentMethodButton?.addEventListener('click', () => { paymentMethodsHost.append(createPaymentMethodRow()); sync(); });
  usdEnabled?.addEventListener('change', sync);
  refreshButton?.addEventListener('click', load);
  saveButton?.addEventListener('click', () => action('save', saveButton));
  publishButton?.addEventListener('click', () => {
    if (!window.confirm('Publish this exact donation catalogue to Discord? WWZ will replace only its previously published donation messages.')) return;
    action('publish', publishButton);
  });
  unpublishButton?.addEventListener('click', () => {
    if (!window.confirm('Remove only the donation messages previously published by WWZ? The saved catalogue will remain intact.')) return;
    action('unpublish', unpublishButton);
  });

  window.addEventListener('wwz:viewchange', (event) => {
    if (event.detail?.view === 'staff' && event.detail?.section === 'donations') load();
  });
  window.__wwzDonationManagerReady = true;
})();
