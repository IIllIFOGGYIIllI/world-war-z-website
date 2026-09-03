(() => {
  'use strict';
  const API_BASE = 'https://world-war-z.up.railway.app';
  const URLS = { servers: `${API_BASE}/api/donations/servers`, flags: `${API_BASE}/api/flags/public` };
  const SERVER_KEY = 'wwz_dashboard_server';
  const host = document.querySelector('[data-public-flags]');
  const status = document.querySelector('[data-flags-status]');
  const meta = document.querySelector('[data-flags-meta]');
  const serverButtons = document.querySelector('[data-flags-server-buttons]');
  const search = document.querySelector('[data-flags-search]');
  const filter = document.querySelector('[data-flags-filter]');
  const summaryHost = document.querySelector('[data-flags-summary]');
  const rulesHost = document.querySelector('[data-flags-rules]');
  if (!host) return;
  const state = { servers: [], server: null, flags: [], summary: {}, rules: [], loading: false };
  const readStoredServer = () => { try { return JSON.parse(sessionStorage.getItem(SERVER_KEY) || 'null'); } catch { return null; } };
  const saveServer = (server) => { state.server = server || null; try { if (server) sessionStorage.setItem(SERVER_KEY, JSON.stringify(server)); } catch {} };
  const requestedServer = () => String(new URLSearchParams(location.search).get('server') || '').trim().toLowerCase();
  const updateAddress = (server) => { if (!server) return; const url = new URL(location.href); url.searchParams.set('server', String(server.map_key || server.key || '').toLowerCase()); history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`); };
  const initials = (name) => String(name || 'FLAG').replace(/\([^)]*\)/g, '').split(/\s+/).filter(Boolean).slice(0,2).map((part) => part[0]?.toUpperCase() || '').join('') || 'F';
  const setStatus = (message, hidden = false) => { if (!status) return; status.hidden = hidden; if (!hidden) status.textContent = message; };
  const renderServers = () => {
    if (!serverButtons) return; serverButtons.replaceChildren();
    state.servers.forEach((server) => {
      const control = document.createElement('button'); control.type = 'button'; control.className = 'flags-server-button';
      const name = document.createElement('strong'); name.textContent = server.map_name || server.name || server.key;
      const detail = document.createElement('small'); detail.textContent = server.paused ? 'Registered · currently paused' : 'Independent claims';
      control.append(name, detail); const active = server.key === state.server?.key; control.classList.toggle('active', active); control.setAttribute('aria-pressed', String(active)); control.disabled = state.loading;
      control.addEventListener('click', async () => { if (state.loading || active) return; saveServer(server); updateAddress(server); renderServers(); await loadFlags(); });
      serverButtons.append(control);
    });
  };
  const statusLabel = (item) => {
    if (item.reserved) return ['reserved', 'Reserved'];
    if (item.status === 'available') return ['available', 'Available'];
    if (item.status === 'partial') return ['partial', `${item.claimed_count}/${item.capacity} claimed`];
    return ['claimed', 'Claimed'];
  };
  const renderSummary = () => {
    if (!summaryHost) return; summaryHost.replaceChildren();
    [['Available Flags', state.summary.available ?? 0], ['Flags In Use', state.summary.claimed ?? 0], ['Claim Slots', `${state.summary.slots_used ?? 0}/${state.summary.slots_total ?? 0}`], ['Pending', state.summary.pending ?? 0]].forEach(([label, value]) => {
      const card = document.createElement('div'); card.className = 'flag-summary-card'; const span = document.createElement('span'); span.textContent = label; const strong = document.createElement('strong'); strong.textContent = value; card.append(span, strong); summaryHost.append(card);
    });
  };
  const renderRules = () => { if (!rulesHost) return; rulesHost.replaceChildren(); state.rules.forEach((rule) => { const li = document.createElement('li'); li.textContent = rule; rulesHost.append(li); }); };
  const renderFlags = () => {
    const needle = String(search?.value || '').trim().toLowerCase(); const wanted = String(filter?.value || 'all');
    const rows = state.flags.filter((item) => (!needle || String(item.name).toLowerCase().includes(needle)) && (wanted === 'all' || item.status === wanted || (wanted === 'claimed' && Number(item.claimed_count) > 0)));
    host.replaceChildren();
    rows.forEach((item) => {
      const card = document.createElement('article'); card.className = 'flag-card';
      const visual = document.createElement('div'); visual.className = 'flag-card-visual'; visual.textContent = initials(item.name); visual.title = `${item.name} catalogue marker`;
      const copy = document.createElement('div'); copy.className = 'flag-card-copy'; const heading = document.createElement('h2'); heading.textContent = item.name;
      const [tone, label] = statusLabel(item); const badge = document.createElement('span'); badge.className = `flag-status ${tone}`; badge.textContent = label;
      copy.append(heading, badge);
      const claims = Array.isArray(item.claims) ? item.claims : []; const owner = document.createElement('p'); owner.className = 'flag-owners';
      owner.textContent = claims.length ? claims.map((claim) => claim.claimant_name).join(' · ') : (item.reserved ? (item.reserved_label || 'WWZ Admin Team') : `${item.remaining} claim slot${item.remaining === 1 ? '' : 's'} available`); copy.append(owner);
      if (item.special) { const special = document.createElement('p'); special.className = 'flag-special'; special.textContent = item.special; copy.append(special); }
      card.append(visual, copy); host.append(card);
    });
    if (!rows.length) { const empty = document.createElement('div'); empty.className = 'flag-empty'; empty.textContent = 'No flags match the current search/filter.'; host.append(empty); }
  };
  const render = () => { renderSummary(); renderRules(); renderFlags(); if (meta) meta.textContent = `${state.server?.name || 'World War Z'} · ${state.server?.map_name || ''} · shared catalogue, independent ownership`; };
  const loadFlags = async () => {
    if (!state.server || state.loading) return; state.loading = true; renderServers(); setStatus(`Loading ${state.server.map_name || state.server.name} flag claims…`);
    try { const response = await fetch(URLS.flags, { headers: { Accept: 'application/json', 'X-WWZ-Server': state.server.key }, cache: 'no-store' }); const payload = await response.json().catch(() => ({})); if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Flag claims unavailable.'); state.flags = Array.isArray(payload.flags) ? payload.flags : []; state.summary = payload.summary || {}; state.rules = Array.isArray(payload.rules) ? payload.rules : []; render(); setStatus('', true); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Flag claims are temporarily unavailable.'); }
    finally { state.loading = false; renderServers(); }
  };
  search?.addEventListener('input', renderFlags); filter?.addEventListener('change', renderFlags);
  const initialise = async () => {
    setStatus('Loading World War Z servers…');
    try { const response = await fetch(URLS.servers, { headers: { Accept: 'application/json' }, cache: 'no-store' }); const payload = await response.json().catch(() => ({})); if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Server choices unavailable.'); state.servers = Array.isArray(payload.servers) ? payload.servers : []; const requested = requestedServer(); const stored = readStoredServer(); const selected = state.servers.find((entry) => String(entry.key).toLowerCase() === requested || String(entry.map_key).toLowerCase() === requested) || state.servers.find((entry) => entry.key === stored?.key) || state.servers.find((entry) => !entry.paused) || state.servers[0] || null; if (!selected) throw new Error('No World War Z server is currently available.'); saveServer(selected); updateAddress(selected); renderServers(); await loadFlags(); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Flag claims are temporarily unavailable.'); }
  };
  initialise();
})();
