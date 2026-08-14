(() => {
  'use strict';

  const state = {
    feeds: [],
    channels: [],
    feedTypes: [],
    dynamicLists: [],
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

  const setMessage = (text = '', kind = 'info') => {
    const element = $('[data-server-feeds-message]');
    if (!element) return;
    element.hidden = !text;
    element.textContent = text;
    element.dataset.kind = kind;
  };

  const setEditorMessage = (text = '', kind = 'info') => {
    const element = $('[data-server-feed-editor-message]');
    if (!element) return;
    element.hidden = !text;
    element.textContent = text;
    element.dataset.kind = kind;
  };

  const authenticatedJson = async (url, options = {}, timeout = 15_000) => {
    const token = sessionToken();
    if (!token) throw new Error('Your dashboard session has expired. Sign in again.');
    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');
    headers.set('Authorization', `Bearer ${token}`);
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    const { response, payload } = await window.WWZHttp.json(url, { ...options, headers }, timeout);
    if (response.status === 401 || response.status === 403) {
      throw new Error(response.status === 403
        ? 'Your current Discord account does not have Admin access to Server Feeds.'
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
    if (feed.include_location) parts.push('Map location');
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
      channel.innerHTML = `<strong>Discord:</strong> #${String(feed.channel_name || 'Unavailable channel')}`;
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

  const populateSelects = () => {
    const typeSelect = $('[data-server-feed-type]');
    if (typeSelect) {
      const current = typeSelect.value;
      typeSelect.replaceChildren(new Option('Select feed type…', ''));
      state.feedTypes.forEach((item) => typeSelect.add(new Option(item.name, item.key)));
      if (state.feedTypes.some((item) => item.key === current)) typeSelect.value = current;
    }
    const channelSelect = $('[data-server-feed-channel]');
    if (channelSelect) {
      const current = channelSelect.value;
      channelSelect.replaceChildren(new Option('Select Discord channel…', ''));
      state.channels.forEach((item) => channelSelect.add(new Option(`#${item.name}`, item.key)));
      if (state.channels.some((item) => item.key === current)) channelSelect.value = current;
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
    $('[data-server-feed-location]').checked = feed ? Boolean(feed.include_location) : true;
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
      include_location: Boolean($('[data-server-feed-location]')?.checked),
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
      state.feedTypes = Array.isArray(payload.feed_types) ? payload.feed_types : [];
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

  const bind = () => {
    $('[data-server-feed-create]')?.addEventListener('click', () => openEditor());
    $('[data-server-feed-refresh]')?.addEventListener('click', () => loadFeeds({ force: true }));
    $('[data-server-feed-search]')?.addEventListener('input', renderFeeds);
    $('[data-server-feed-filter]')?.addEventListener('change', renderFeeds);
    $('[data-server-feed-editor-form]')?.addEventListener('submit', saveFeed);
    $('[data-server-feed-add-list]')?.addEventListener('click', () => {
      if (state.dynamicLists.length >= 20) {
        setEditorMessage('A maximum of 20 dynamic lists can be configured per feed.', 'warning');
        return;
      }
      state.dynamicLists.push({ name: `List ${state.dynamicLists.length + 1}`, mode: 'ignore', active: true, entries: [] });
      renderDynamicLists();
    });
    $$('[data-server-feed-editor-cancel]').forEach((button) => button.addEventListener('click', () => $('[data-server-feed-dialog]')?.close?.()));
    $('[data-server-feed-dialog]')?.addEventListener('click', (event) => {
      if (event.target === $('[data-server-feed-dialog]')) $('[data-server-feed-dialog]')?.close?.();
    });
    window.addEventListener('wwz:viewchange', (event) => {
      state.active = String(event.detail?.view || '') === 'feeds';
    });
    window.addEventListener('wwz:serverchange', () => {
      state.loaded = false;
      state.feeds = [];
      state.channels = [];
      state.feedTypes = [];
      if (state.active) loadFeeds({ force: true }).catch(() => {});
    });
  };

  bind();
  window.__wwzServerFeedsReady = true;
  window.WWZServerFeeds = Object.freeze({ activate, loadFeeds, openEditor });
})();
