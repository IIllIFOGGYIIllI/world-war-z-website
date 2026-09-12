(() => {
  'use strict';

  const state = {
    feeds: [],
    channels: [],
    categories: [],
    feedTypes: [],
    feedGroups: [],
    dynamicLists: [],
    mapName: '',
    runtime: {},
    loaded: false,
    loading: false,
    active: false,
    editorFeedId: null,
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const isAdmin = () => ['staff', 'owner'].includes(String(dashboardAccessLevel || ''));
  const sessionToken = () => storageGet(AUTH_SESSION_KEY);
  const feedsUrl = ADMIN_SERVER_FEEDS_URL;
  const actionUrl = ADMIN_SERVER_FEEDS_ACTION_URL;

  const setStatus = (selector, text = '', kind = 'info') => {
    const element = $(selector);
    if (!element) return;
    element.hidden = !text;
    element.textContent = text;
    element.dataset.kind = kind;
  };

  const setMessage = (text = '', kind = 'info') => setStatus('[data-server-feeds-message]', text, kind);
  const setEditorMessage = (text = '', kind = 'info') => setStatus('[data-server-feed-editor-message]', text, kind);
  const setBulkMessage = (text = '', kind = 'info') => setStatus('[data-server-feed-bulk-message]', text, kind);
  const setAutoMessage = (text = '', kind = 'info') => setStatus('[data-server-feed-auto-message]', text, kind);

  const authenticatedJson = async (url, options = {}, timeout = 20_000) => {
    const token = sessionToken();
    if (!token) throw new Error('Your dashboard session has expired. Sign in again.');
    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');
    headers.set('Authorization', `Bearer ${token}`);
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    const { response, payload } = await window.WWZHttp.json(url, { ...options, headers }, timeout);
    if (response.status === 401 || response.status === 403) {
      throw new Error(response.status === 403
        ? (payload?.message || 'Your current Discord account does not have Admin access to Server Feeds.')
        : 'Your dashboard session has expired. Sign in again.');
    }
    if (!response.ok || !['ok', 'accepted'].includes(String(payload?.status || ''))) {
      throw new Error(payload?.message || `Server-feed request failed with HTTP ${response.status}.`);
    }
    return payload;
  };

  const feedTypeLabel = (key) => state.feedTypes.find((item) => item.key === key)?.name
    || String(key || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

  const optionsSummary = (feed) => {
    const parts = [];
    if (feed.minimize_output) parts.push('Minimized');
    if (feed.footer_timestamp) parts.push('Timestamp');
    if (feed.custom_embed) parts.push('Custom embed');
    const listCount = Array.isArray(feed.dynamic_lists) ? feed.dynamic_lists.filter((item) => item.active !== false).length : 0;
    if (listCount) parts.push(`${listCount} filter list${listCount === 1 ? '' : 's'}`);
    return parts.length ? parts.join(' · ') : 'Standard output';
  };

  const renderSummary = () => {
    const total = state.feeds.length;
    const active = state.feeds.filter((item) => item.active).length;
    const types = new Set(state.feeds.map((item) => item.feed_type)).size;
    const channels = new Set(state.feeds.map((item) => item.channel_key).filter(Boolean)).size;
    const values = {
      '[data-server-feed-total]': total,
      '[data-server-feed-active]': active,
      '[data-server-feed-types]': types,
      '[data-server-feed-channels]': channels,
    };
    Object.entries(values).forEach(([selector, value]) => {
      const element = $(selector);
      if (element) element.textContent = String(value);
    });
  };

  const renderFeeds = () => {
    const list = $('[data-server-feed-list]');
    const empty = $('[data-server-feed-empty]');
    if (!list) return;
    list.replaceChildren();

    const query = String($('[data-server-feed-search]')?.value || '').trim().toLowerCase();
    const filter = String($('[data-server-feed-filter]')?.value || 'all');
    const records = state.feeds.filter((feed) => {
      if (filter === 'active' && !feed.active) return false;
      if (filter === 'inactive' && feed.active) return false;
      const haystack = `${feedTypeLabel(feed.feed_type)} ${feed.channel_name || ''} ${feed.note || ''}`.toLowerCase();
      return !query || haystack.includes(query);
    });

    records.forEach((feed) => {
      const article = document.createElement('article');
      article.className = 'server-feed-card';
      article.dataset.feedId = String(feed.id);

      const colour = document.createElement('span');
      colour.className = 'server-feed-colour';
      colour.style.backgroundColor = /^#[0-9a-f]{6}$/i.test(String(feed.colour || '')) ? feed.colour : '#6c5ce7';

      const main = document.createElement('div');
      main.className = 'server-feed-card-copy';
      const heading = document.createElement('div');
      heading.className = 'server-feed-card-heading';
      const title = document.createElement('h3');
      title.textContent = feedTypeLabel(feed.feed_type);
      const status = document.createElement('span');
      status.className = `server-feed-state ${feed.active ? 'active' : 'inactive'}`;
      status.textContent = feed.active ? 'Active' : 'Inactive';
      heading.append(title, status);
      const channel = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = 'Discord: ';
      channel.append(strong, `#${String(feed.channel_name || 'Unavailable channel')}`);
      const options = document.createElement('small');
      options.textContent = optionsSummary(feed);
      main.append(heading, channel, options);
      if (feed.note) {
        const note = document.createElement('p');
        note.className = 'server-feed-note';
        note.textContent = feed.note;
        main.append(note);
      }

      const actions = document.createElement('div');
      actions.className = 'server-feed-card-actions';
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'secondary-action compact-action';
      edit.textContent = 'Edit';
      edit.addEventListener('click', () => openEditor(feed));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'danger-action compact-action';
      remove.textContent = 'Delete';
      remove.addEventListener('click', () => deleteFeed(feed));
      actions.append(edit, remove);

      article.append(colour, main, actions);
      list.append(article);
    });

    if (empty) empty.hidden = records.length > 0;
    renderSummary();
  };

  const channelOptionLabel = (item) => {
    const category = String(item?.category_name || '').trim();
    return category ? `#${item.name} — ${category}` : `#${item.name}`;
  };

  const populateChannelSelect = (select) => {
    if (!select) return;
    const current = select.value;
    select.replaceChildren(new Option('Select Discord channel…', ''));
    state.channels.forEach((item) => select.add(new Option(channelOptionLabel(item), item.key)));
    if (state.channels.some((item) => item.key === current)) select.value = current;
  };

  const populateSelects = () => {
    const typeSelect = $('[data-server-feed-type]');
    if (typeSelect) {
      const current = typeSelect.value;
      typeSelect.replaceChildren(new Option('Select feed type…', ''));
      state.feedTypes.forEach((item) => typeSelect.add(new Option(item.name, item.key)));
      if (state.feedTypes.some((item) => item.key === current)) typeSelect.value = current;
    }
    populateChannelSelect($('[data-server-feed-channel]'));
    populateChannelSelect($('[data-server-feed-bulk-channel]'));

    const categorySelect = $('[data-server-feed-auto-category]');
    if (categorySelect) {
      const current = categorySelect.value;
      categorySelect.replaceChildren(new Option('Create / reuse protected WWZ Logs', ''));
      state.categories.forEach((item) => categorySelect.add(new Option(item.name, item.key)));
      if (state.categories.some((item) => item.key === current)) categorySelect.value = current;
    }
  };

  const renderDynamicLists = () => {
    const container = $('[data-server-feed-dynamic-lists]');
    if (!container) return;
    container.replaceChildren();
    state.dynamicLists.forEach((list, index) => {
      const row = document.createElement('article');
      row.className = 'server-feed-dynamic-list';
      row.innerHTML = `
        <div class="server-feed-list-head">
          <label><span>List name</span><input data-feed-list-name maxlength="60" type="text"></label>
          <label><span>Mode</span><select data-feed-list-mode><option value="ignore">Ignore</option><option value="allow">Allow only</option></select></label>
          <label class="server-feed-list-active"><input data-feed-list-active type="checkbox"><span>Active</span></label>
          <button class="danger-action compact-action" data-feed-list-remove type="button">Remove</button>
        </div>
        <label class="dialog-field"><span>PlayStation IDs <small>one per line or comma-separated</small></span><textarea data-feed-list-entries rows="3" maxlength="8000"></textarea></label>`;
      $('[data-feed-list-name]', row).value = list.name || `List ${index + 1}`;
      $('[data-feed-list-mode]', row).value = list.mode === 'allow' ? 'allow' : 'ignore';
      $('[data-feed-list-active]', row).checked = list.active !== false;
      $('[data-feed-list-entries]', row).value = Array.isArray(list.entries) ? list.entries.join('\n') : '';
      $('[data-feed-list-remove]', row).addEventListener('click', () => {
        state.dynamicLists.splice(index, 1);
        renderDynamicLists();
      });
      container.append(row);
    });
    const empty = $('[data-server-feed-lists-empty]');
    if (empty) empty.hidden = state.dynamicLists.length > 0;
  };

  const readDynamicLists = () => $$('[data-server-feed-dynamic-lists] .server-feed-dynamic-list').map((row, index) => ({
    name: String($('[data-feed-list-name]', row)?.value || `List ${index + 1}`).trim(),
    mode: String($('[data-feed-list-mode]', row)?.value || 'ignore'),
    active: Boolean($('[data-feed-list-active]', row)?.checked),
    entries: String($('[data-feed-list-entries]', row)?.value || '')
      .replaceAll('\r', '\n')
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean),
  }));

  const openEditor = (feed = null) => {
    state.editorFeedId = feed ? Number(feed.id) : null;
    state.dynamicLists = Array.isArray(feed?.dynamic_lists)
      ? feed.dynamic_lists.map((item) => ({ ...item, entries: [...(item.entries || [])] }))
      : [];
    populateSelects();
    $('[data-server-feed-editor-title]').textContent = feed ? `Edit ${feedTypeLabel(feed.feed_type)} Feed` : 'Create Server Feed';
    $('[data-server-feed-type]').value = String(feed?.feed_type || '');
    $('[data-server-feed-channel]').value = String(feed?.channel_key || '');
    $('[data-server-feed-colour]').value = /^#[0-9a-f]{6}$/i.test(String(feed?.colour || '')) ? feed.colour : '#6c5ce7';
    $('[data-server-feed-active]').checked = feed ? Boolean(feed.active) : true;
    $('[data-server-feed-minimize]').checked = Boolean(feed?.minimize_output);
    $('[data-server-feed-timestamp]').checked = feed ? Boolean(feed.footer_timestamp) : true;
    $('[data-server-feed-custom-embed]').checked = Boolean(feed?.custom_embed);
    $('[data-server-feed-note]').value = String(feed?.note || '');
    $('[data-server-feed-save]').textContent = feed ? 'Save Changes' : 'Create Feed';
    setEditorMessage('');
    renderDynamicLists();
    $('[data-server-feed-dialog]')?.showModal?.();
  };

  const saveFeed = async (event) => {
    event.preventDefault();
    const payload = {
      action: state.editorFeedId ? 'update' : 'create',
      feed_id: state.editorFeedId,
      feed_type: String($('[data-server-feed-type]')?.value || ''),
      channel_key: String($('[data-server-feed-channel]')?.value || ''),
      colour: String($('[data-server-feed-colour]')?.value || '#6c5ce7'),
      active: Boolean($('[data-server-feed-active]')?.checked),
      minimize_output: Boolean($('[data-server-feed-minimize]')?.checked),
      footer_timestamp: Boolean($('[data-server-feed-timestamp]')?.checked),
      custom_embed: Boolean($('[data-server-feed-custom-embed]')?.checked),
      note: String($('[data-server-feed-note]')?.value || '').trim(),
      dynamic_lists: readDynamicLists(),
    };
    if (!payload.feed_type) {
      setEditorMessage('Select a feed type.', 'error');
      return;
    }
    if (!payload.channel_key) {
      setEditorMessage('Select a Discord channel.', 'error');
      return;
    }
    setEditorMessage('Saving server feed…');
    try {
      const result = await authenticatedJson(actionUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const saved = result.feed;
      const index = state.feeds.findIndex((item) => Number(item.id) === Number(saved.id));
      if (index >= 0) state.feeds.splice(index, 1, saved);
      else state.feeds.push(saved);
      state.feeds.sort((a, b) => Number(b.active) - Number(a.active) || String(a.feed_type).localeCompare(String(b.feed_type)) || Number(a.id) - Number(b.id));
      $('[data-server-feed-dialog]')?.close?.();
      renderFeeds();
      setMessage(`${feedTypeLabel(saved.feed_type)} feed saved.`, 'success');
    } catch (error) {
      setEditorMessage(error?.message || 'The server feed could not be saved.', 'error');
    }
  };

  const deleteFeed = async (feed) => {
    const label = feedTypeLabel(feed.feed_type);
    if (!window.confirm(`Delete the ${label} feed routed to #${feed.channel_name || 'channel'}?`)) return;
    setMessage(`Deleting ${label} feed…`);
    try {
      await authenticatedJson(actionUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'delete', feed_id: feed.id }),
      });
      state.feeds = state.feeds.filter((item) => Number(item.id) !== Number(feed.id));
      renderFeeds();
      setMessage(`${label} feed deleted.`, 'success');
    } catch (error) {
      setMessage(error?.message || 'The server feed could not be deleted.', 'error');
    }
  };

  const updateBulkGroupToggle = (groupElement) => {
    const toggle = $('[data-server-feed-bulk-group-toggle]', groupElement);
    const boxes = $$('[data-server-feed-bulk-type]', groupElement);
    if (!toggle || !boxes.length) return;
    const checked = boxes.filter((box) => box.checked).length;
    toggle.checked = checked === boxes.length;
    toggle.indeterminate = checked > 0 && checked < boxes.length;
  };

  const renderBulkGroups = () => {
    const container = $('[data-server-feed-bulk-groups]');
    if (!container) return;
    container.replaceChildren();
    const groups = state.feedGroups.length
      ? state.feedGroups
      : [{ key: 'all', name: 'All Server Feeds', feed_types: state.feedTypes.map((item) => item.key) }];

    groups.forEach((group) => {
      const article = document.createElement('article');
      article.className = 'server-feed-bulk-group';

      const header = document.createElement('div');
      header.className = 'server-feed-bulk-group-head';
      const title = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = String(group.name || 'Feed Group');
      const small = document.createElement('small');
      small.textContent = `${Array.isArray(group.feed_types) ? group.feed_types.length : 0} event types`;
      title.append(strong, small);
      const toggleLabel = document.createElement('label');
      toggleLabel.className = 'server-feed-bulk-group-toggle';
      const toggle = document.createElement('input');
      toggle.type = 'checkbox';
      toggle.dataset.serverFeedBulkGroupToggle = '';
      toggleLabel.append(toggle, document.createTextNode(' Select group'));
      header.append(title, toggleLabel);

      const grid = document.createElement('div');
      grid.className = 'server-feed-bulk-type-grid';
      (group.feed_types || []).forEach((feedType) => {
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.value = String(feedType);
        input.dataset.serverFeedBulkType = '';
        const span = document.createElement('span');
        span.textContent = feedTypeLabel(feedType);
        label.append(input, span);
        input.addEventListener('change', () => updateBulkGroupToggle(article));
        grid.append(label);
      });

      toggle.addEventListener('change', () => {
        $$('[data-server-feed-bulk-type]', article).forEach((box) => { box.checked = toggle.checked; });
        updateBulkGroupToggle(article);
      });
      article.append(header, grid);
      container.append(article);
    });
  };

  const bulkSelectedTypes = () => $$('[data-server-feed-bulk-type]:checked').map((box) => String(box.value || '')).filter(Boolean);

  const openBulk = () => {
    populateSelects();
    renderBulkGroups();
    $('[data-server-feed-bulk-channel]').value = '';
    $('[data-server-feed-bulk-colour]').value = '#6c5ce7';
    $('[data-server-feed-bulk-active]').checked = true;
    $('[data-server-feed-bulk-minimize]').checked = false;
    $('[data-server-feed-bulk-timestamp]').checked = true;
    setBulkMessage('');
    $('[data-server-feed-bulk-dialog]')?.showModal?.();
  };

  const saveBulk = async (event) => {
    event.preventDefault();
    const feedTypes = bulkSelectedTypes();
    const payload = {
      action: 'bulk_create',
      feed_types: feedTypes,
      channel_key: String($('[data-server-feed-bulk-channel]')?.value || ''),
      colour: String($('[data-server-feed-bulk-colour]')?.value || '#6c5ce7'),
      active: Boolean($('[data-server-feed-bulk-active]')?.checked),
      minimize_output: Boolean($('[data-server-feed-bulk-minimize]')?.checked),
      footer_timestamp: Boolean($('[data-server-feed-bulk-timestamp]')?.checked),
      custom_embed: false,
      note: '',
      dynamic_lists: [],
    };
    if (!payload.channel_key) {
      setBulkMessage('Select a Discord channel.', 'error');
      return;
    }
    if (!payload.feed_types.length) {
      setBulkMessage('Select at least one feed type.', 'error');
      return;
    }

    setBulkMessage(`Assigning ${payload.feed_types.length} feed types…`);
    try {
      const result = await authenticatedJson(actionUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
      }, 30_000);
      $('[data-server-feed-bulk-dialog]')?.close?.();
      await loadFeeds({ force: true });
      const created = Number(result.created_count || 0);
      const skipped = Array.isArray(result.skipped_feed_types) ? result.skipped_feed_types.length : 0;
      setMessage(
        `${created} feed route${created === 1 ? '' : 's'} assigned${skipped ? ` · ${skipped} identical route${skipped === 1 ? '' : 's'} already existed` : ''}.`,
        'success',
      );
    } catch (error) {
      setBulkMessage(error?.message || 'The selected feeds could not be assigned.', 'error');
    }
  };

  const renderAutoExplainer = () => {
    const container = $('[data-server-feed-auto-explainer]');
    if (!container) return;
    container.replaceChildren();
    const layout = String($('[data-server-feed-auto-layout]')?.value || 'grouped');
    const categoryKey = String($('[data-server-feed-auto-category]')?.value || '');
    const categoryNameField = $('.server-feed-auto-category-name');
    if (categoryNameField) categoryNameField.hidden = Boolean(categoryKey);

    if (layout === 'detailed') {
      const paragraph = document.createElement('p');
      paragraph.innerHTML = `<strong>Detailed layout:</strong> one Discord channel per missing supported event type (up to ${state.feedTypes.length} channels on a completely fresh setup). Existing routes are still preserved.`;
      container.append(paragraph);
      return;
    }

    const intro = document.createElement('p');
    intro.innerHTML = '<strong>Grouped layout:</strong> related events share a clean log channel. WWZ first extends any channel already used by that group, then reuses a matching channel name, then creates one only if needed.';
    container.append(intro);
    const grid = document.createElement('div');
    grid.className = 'server-feed-auto-groups';
    state.feedGroups.forEach((group) => {
      const card = document.createElement('div');
      const channel = document.createElement('strong');
      channel.textContent = `#${group.channel_name}`;
      const detail = document.createElement('span');
      detail.textContent = `${group.name} · ${(group.feed_types || []).length} event types`;
      card.append(channel, detail);
      grid.append(card);
    });
    container.append(grid);
  };

  const openAuto = () => {
    populateSelects();
    $('[data-server-feed-auto-layout]').value = 'grouped';
    const categorySelect = $('[data-server-feed-auto-category]');
    const existingLogs = state.categories.find((item) => String(item.name || '').trim().toLowerCase() === 'wwz logs');
    if (categorySelect) categorySelect.value = existingLogs?.key || '';
    $('[data-server-feed-auto-category-name]').value = 'WWZ Logs';
    setAutoMessage('');
    renderAutoExplainer();
    $('[data-server-feed-auto-dialog]')?.showModal?.();
  };

  const saveAuto = async (event) => {
    event.preventDefault();
    const categoryKey = String($('[data-server-feed-auto-category]')?.value || '');
    const payload = {
      action: 'auto_setup',
      layout: String($('[data-server-feed-auto-layout]')?.value || 'grouped'),
      category_key: categoryKey,
      category_name: String($('[data-server-feed-auto-category-name]')?.value || 'WWZ Logs').trim() || 'WWZ Logs',
    };
    setAutoMessage(`Checking ${state.mapName || 'the selected server'} and configuring missing feed routes…`);
    try {
      const result = await authenticatedJson(actionUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
      }, 60_000);
      $('[data-server-feed-auto-dialog]')?.close?.();
      await loadFeeds({ force: true });
      const setup = result.setup || {};
      const routes = Number(setup.created_feed_count || 0);
      const channels = Array.isArray(setup.created_channels) ? setup.created_channels.length : 0;
      const reused = Array.isArray(setup.reused_channels) ? setup.reused_channels.length : 0;
      const message = routes
        ? `Auto setup complete: ${routes} missing feed route${routes === 1 ? '' : 's'} assigned, ${channels} channel${channels === 1 ? '' : 's'} created${reused ? `, ${reused} existing channel${reused === 1 ? '' : 's'} reused` : ''}.`
        : 'Auto setup complete: every supported event type was already configured, so nothing was changed.';
      setMessage(message, 'success');
    } catch (error) {
      setAutoMessage(error?.message || 'Automatic server-feed setup could not be completed.', 'error');
    }
  };

  const loadFeeds = async ({ force = false } = {}) => {
    if (!isAdmin()) return;
    if (state.loading) return;
    if (state.loaded && !force) {
      renderFeeds();
      return;
    }
    state.loading = true;
    setMessage('Loading server feeds and Discord channels…');
    try {
      const payload = await authenticatedJson(`${feedsUrl}?t=${Date.now()}`);
      state.feeds = Array.isArray(payload.feeds) ? payload.feeds : [];
      state.channels = Array.isArray(payload.channels) ? payload.channels : [];
      state.categories = Array.isArray(payload.categories) ? payload.categories : [];
      state.feedTypes = Array.isArray(payload.feed_types) ? payload.feed_types : [];
      state.feedGroups = Array.isArray(payload.feed_groups) ? payload.feed_groups : [];
      state.mapName = String(payload.map_name || '');
      state.runtime = payload.runtime && typeof payload.runtime === 'object' ? payload.runtime : {};
      const bulkButton = $('[data-server-feed-bulk]');
      const autoButton = $('[data-server-feed-auto]');
      if (bulkButton) bulkButton.disabled = state.runtime.bulk_assign === false;
      if (autoButton) autoButton.disabled = state.runtime.auto_channel_setup === false;
      state.loaded = true;
      populateSelects();
      renderFeeds();
      setMessage('');
    } catch (error) {
      setMessage(error?.message || 'Server feeds are temporarily unavailable.', 'error');
    } finally {
      state.loading = false;
    }
  };

  const activate = async () => {
    if (!isAdmin()) return;
    state.active = true;
    await loadFeeds();
  };

  const bindDialogBackdrop = (selector) => {
    const dialog = $(selector);
    dialog?.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close?.();
    });
  };

  const bind = () => {
    $('[data-server-feed-create]')?.addEventListener('click', () => openEditor());
    $('[data-server-feed-bulk]')?.addEventListener('click', openBulk);
    $('[data-server-feed-auto]')?.addEventListener('click', openAuto);
    $('[data-server-feed-refresh]')?.addEventListener('click', () => loadFeeds({ force: true }));
    $('[data-server-feed-search]')?.addEventListener('input', renderFeeds);
    $('[data-server-feed-filter]')?.addEventListener('change', renderFeeds);
    $('[data-server-feed-editor-form]')?.addEventListener('submit', saveFeed);
    $('[data-server-feed-bulk-form]')?.addEventListener('submit', saveBulk);
    $('[data-server-feed-auto-form]')?.addEventListener('submit', saveAuto);
    $('[data-server-feed-auto-layout]')?.addEventListener('change', renderAutoExplainer);
    $('[data-server-feed-auto-category]')?.addEventListener('change', renderAutoExplainer);
    $('[data-server-feed-bulk-all]')?.addEventListener('click', () => {
      $$('[data-server-feed-bulk-type]').forEach((box) => { box.checked = true; });
      $$('.server-feed-bulk-group').forEach(updateBulkGroupToggle);
    });
    $('[data-server-feed-bulk-none]')?.addEventListener('click', () => {
      $$('[data-server-feed-bulk-type]').forEach((box) => { box.checked = false; });
      $$('.server-feed-bulk-group').forEach(updateBulkGroupToggle);
    });
    $('[data-server-feed-add-list]')?.addEventListener('click', () => {
      if (state.dynamicLists.length >= 20) {
        setEditorMessage('A maximum of 20 dynamic lists can be configured per feed.', 'warning');
        return;
      }
      state.dynamicLists.push({ name: `List ${state.dynamicLists.length + 1}`, mode: 'ignore', active: true, entries: [] });
      renderDynamicLists();
    });
    $$('[data-server-feed-editor-cancel]').forEach((button) => button.addEventListener('click', () => $('[data-server-feed-dialog]')?.close?.()));
    $$('[data-server-feed-bulk-cancel]').forEach((button) => button.addEventListener('click', () => $('[data-server-feed-bulk-dialog]')?.close?.()));
    $$('[data-server-feed-auto-cancel]').forEach((button) => button.addEventListener('click', () => $('[data-server-feed-auto-dialog]')?.close?.()));
    bindDialogBackdrop('[data-server-feed-dialog]');
    bindDialogBackdrop('[data-server-feed-bulk-dialog]');
    bindDialogBackdrop('[data-server-feed-auto-dialog]');
    window.addEventListener('wwz:viewchange', (event) => {
      state.active = String(event.detail?.view || '') === 'feeds';
    });
    window.addEventListener('wwz:serverchange', () => {
      state.loaded = false;
      state.feeds = [];
      state.channels = [];
      state.categories = [];
      state.feedTypes = [];
      state.feedGroups = [];
      state.mapName = '';
      state.runtime = {};
      if (state.active) loadFeeds({ force: true }).catch(() => {});
    });
  };

  bind();
  window.__wwzServerFeedsReady = true;
  window.WWZServerFeeds = Object.freeze({ activate, loadFeeds, openEditor, openBulk, openAuto });
})();
