(() => {
  'use strict';

  const API_BASE = 'https://world-war-z.up.railway.app';
  const URLS = {
    servers: `${API_BASE}/api/donations/servers`,
    rules: `${API_BASE}/api/rules/public`
  };
  const SERVER_KEY = 'wwz_dashboard_server';
  const host = document.querySelector('[data-public-rules]');
  const status = document.querySelector('[data-rules-status]');
  const meta = document.querySelector('[data-rules-meta]');
  const serverButtons = document.querySelector('[data-rules-server-buttons]');
  if (!host) return;

  const state = { servers: [], server: null, loading: false };
  const titleCase = (value) => String(value || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  const readStoredServer = () => {
    try { return JSON.parse(sessionStorage.getItem(SERVER_KEY) || 'null'); } catch { return null; }
  };
  const saveServer = (server) => {
    state.server = server || null;
    try {
      if (server) sessionStorage.setItem(SERVER_KEY, JSON.stringify(server));
      else sessionStorage.removeItem(SERVER_KEY);
    } catch {}
  };
  const requestedServer = () => String(new URLSearchParams(location.search).get('server') || '').trim().toLowerCase();
  const updateAddress = (server) => {
    if (!server) return;
    const url = new URL(location.href);
    url.searchParams.set('server', String(server.map_key || server.key || '').toLowerCase());
    history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  };
  const setStatus = (message, hidden = false) => {
    if (!status) return;
    status.hidden = hidden;
    if (!hidden) status.textContent = message;
  };

  const renderServers = () => {
    if (!serverButtons) return;
    serverButtons.replaceChildren();
    state.servers.forEach((server) => {
      const control = document.createElement('button');
      control.type = 'button';
      control.className = 'rules-server-button';
      const name = document.createElement('strong');
      name.textContent = server.map_name || server.name || titleCase(server.map_key) || server.key;
      const detail = document.createElement('small');
      detail.textContent = server.paused ? 'Registered · currently paused' : 'Live server';
      control.append(name, detail);
      const active = server.key === state.server?.key;
      control.classList.toggle('active', active);
      control.setAttribute('aria-pressed', String(active));
      control.disabled = state.loading;
      control.addEventListener('click', async () => {
        if (state.loading || active) return;
        saveServer(server);
        updateAddress(server);
        renderServers();
        await loadRules();
      });
      serverButtons.append(control);
    });
  };

  const renderRules = (payload) => {
    host.replaceChildren();
    const sections = Array.isArray(payload.sections) ? payload.sections : [];
    sections.forEach((section, index) => {
      const article = document.createElement('article');
      article.className = 'content-card rules-public-section';
      const title = document.createElement('h2');
      title.textContent = `${index + 1}. ${section.title || 'RULES'}`;
      const list = document.createElement('ul');
      (section.rules || []).forEach((rule) => {
        const item = document.createElement('li');
        item.textContent = rule;
        list.append(item);
      });
      article.append(title, list);
      host.append(article);
    });
    if (!sections.length) {
      const empty = document.createElement('article');
      empty.className = 'content-card rules-public-section';
      empty.textContent = 'No public rules have been published for this server yet.';
      host.append(empty);
    }
    if (meta) {
      const updated = payload.updated_at ? new Date(payload.updated_at).toLocaleString('en-AU') : 'initial ruleset';
      meta.textContent = `${payload.server?.name || state.server?.name || 'World War Z'} · ${payload.server?.map_name || state.server?.map_name || 'DayZ'} · Revision ${payload.revision || 0} · Updated ${updated}`;
    }
  };

  const loadRules = async () => {
    if (!state.server || state.loading) return;
    state.loading = true;
    renderServers();
    setStatus(`Loading ${state.server.map_name || state.server.name || 'server'} rules…`);
    try {
      const response = await fetch(URLS.rules, {
        headers: { Accept: 'application/json', 'X-WWZ-Server': state.server.key },
        cache: 'no-store'
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Rules unavailable.');
      const matched = state.servers.find((entry) => entry.key === payload.server?.key);
      if (matched) saveServer({ ...matched, ...payload.server });
      renderRules(payload);
      setStatus('', true);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Server rules are temporarily unavailable.');
    } finally {
      state.loading = false;
      renderServers();
    }
  };

  const initialise = async () => {
    setStatus('Loading World War Z servers…');
    try {
      const response = await fetch(URLS.servers, { headers: { Accept: 'application/json' }, cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'World War Z server choices could not be loaded.');
      state.servers = Array.isArray(payload.servers) ? payload.servers : [];
      const requested = requestedServer();
      const stored = readStoredServer();
      const selected = state.servers.find((entry) => String(entry.key).toLowerCase() === requested || String(entry.map_key).toLowerCase() === requested)
        || state.servers.find((entry) => entry.key === stored?.key)
        || state.servers.find((entry) => !entry.paused)
        || state.servers[0]
        || null;
      if (!selected) throw new Error('No World War Z server is currently available.');
      saveServer(selected);
      updateAddress(selected);
      renderServers();
      await loadRules();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Server rules are temporarily unavailable.');
    }
  };

  initialise();
})();
