(() => {
  'use strict';
  if (window.__wwzMyWwzReady) return;

  const overviewPanel = document.querySelector('[data-view-panel="overview"]');
  if (!overviewPanel) return;

  const API = {
    account: ACCOUNT_SUMMARY_URL,
    progression: ACCOUNT_PROGRESSION_URL,
    objectives: ACCOUNT_OBJECTIVES_URL,
    tickets: `${DASHBOARD_API_BASE}/api/account/tickets`,
    shop: ACCOUNT_SHOP_URL,
    community: `${DASHBOARD_API_BASE}/api/community/overview?days=14`,
    status: SERVER_STATUS_URL,
    chernarus: `${DASHBOARD_API_BASE}/api/chernarus/pve`,
    livonia: `${DASHBOARD_API_BASE}/api/livonia/pvp`,
  };

  let root = null;
  let active = false;
  let refreshTimer = 0;
  let refreshInProgress = false;
  let lastSnapshot = null;

  const sessionToken = () => {
    try { return storageGet(AUTH_SESSION_KEY) || ''; } catch { return ''; }
  };

  const selectedServer = () => window.WWZServerContext?.getSelectedServer?.() || null;
  const number = (value) => Number(value || 0).toLocaleString('en-AU');
  const money = (value) => `$${Number(value || 0).toLocaleString('en-AU')}`;

  const relative = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    const seconds = Math.round((date.getTime() - Date.now()) / 1000);
    const absolute = Math.abs(seconds);
    const formatter = new Intl.RelativeTimeFormat('en-AU', { numeric: 'auto' });
    if (absolute < 60) return formatter.format(seconds, 'second');
    if (absolute < 3600) return formatter.format(Math.round(seconds / 60), 'minute');
    if (absolute < 86400) return formatter.format(Math.round(seconds / 3600), 'hour');
    return formatter.format(Math.round(seconds / 86400), 'day');
  };

  const duration = (seconds) => {
    const total = Math.max(0, Number(seconds || 0));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const countdown = (value) => {
    const target = new Date(value).getTime();
    if (!Number.isFinite(target)) return '—';
    return duration(Math.max(0, Math.floor((target - Date.now()) / 1000)));
  };

  const requestJson = async (url, { auth = false } = {}) => {
    const headers = { Accept: 'application/json' };
    const token = sessionToken();
    if (auth && !token) throw new Error('Sign in required.');
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await authFetch(url, { headers, cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload?.message || `Request failed (${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return payload;
  };

  const createMetric = (label, value = '—', note = '') => {
    const card = document.createElement('article');
    card.className = 'my-wwz-metric';
    const span = document.createElement('span');
    const strong = document.createElement('strong');
    const small = document.createElement('small');
    span.textContent = label;
    strong.textContent = value;
    small.textContent = note;
    card.append(span, strong, small);
    return card;
  };

  const createNavButton = (label, view, section = '') => {
    const button = document.createElement('button');
    button.type = 'button';
    button.disabled = false;
    button.className = 'my-wwz-action';
    button.textContent = label;
    button.addEventListener('click', () => showView(view, true, section));
    return button;
  };

  const createStatusRow = (label, value, detail = '', tone = '') => {
    const row = document.createElement('div');
    row.className = 'my-wwz-status-row';
    if (tone) row.dataset.tone = tone;
    const copy = document.createElement('div');
    const strong = document.createElement('strong');
    const small = document.createElement('small');
    const valueNode = document.createElement('span');
    strong.textContent = label;
    small.textContent = detail;
    valueNode.textContent = value;
    copy.append(strong, small);
    row.append(copy, valueNode);
    return row;
  };

  const ensureRoot = () => {
    if (root?.isConnected) return root;
    root = overviewPanel.querySelector('[data-my-wwz-root]');
    if (root) return root;

    root = document.createElement('section');
    root.className = 'my-wwz-shell';
    root.dataset.myWwzRoot = '';
    root.dataset.dashboardSection = 'summary';
    root.id = 'dashboard-my-wwz';
    root.innerHTML = `
      <div class="my-wwz-heading">
        <div>
          <p class="panel-kicker">Milestone 09 · Personal command view</p>
          <h2>My WWZ</h2>
          <p data-my-wwz-subtitle>Pulling together your current server, survivor, progression and community activity.</p>
        </div>
        <div class="my-wwz-heading-actions">
          <span class="my-wwz-world" data-my-wwz-world>Current server</span>
          <button class="secondary-action compact-action" data-my-wwz-refresh type="button">Refresh My WWZ</button>
        </div>
      </div>
      <p class="my-wwz-message" data-my-wwz-message hidden role="status"></p>
      <div class="my-wwz-metrics" data-my-wwz-metrics></div>
      <div class="my-wwz-grid">
        <article class="my-wwz-card my-wwz-card-feature" data-my-wwz-now>
          <header><div><span>RIGHT NOW</span><h3>What's Happening Now?</h3></div><b data-my-wwz-now-state>Loading</b></header>
          <div class="my-wwz-card-body" data-my-wwz-now-body></div>
        </article>
        <article class="my-wwz-card" data-my-wwz-objectives>
          <header><div><span>MY OBJECTIVES</span><h3>What To Work On</h3></div><b data-my-wwz-objective-count>—</b></header>
          <div class="my-wwz-card-body" data-my-wwz-objective-list></div>
        </article>
        <article class="my-wwz-card" data-my-wwz-survivor>
          <header><div><span>MY SURVIVOR</span><h3>Current Snapshot</h3></div><b data-my-wwz-survivor-state>—</b></header>
          <div class="my-wwz-card-body" data-my-wwz-survivor-body></div>
        </article>
        <article class="my-wwz-card" data-my-wwz-attention>
          <header><div><span>ATTENTION</span><h3>Needs Your Eyes</h3></div><b data-my-wwz-attention-count>0</b></header>
          <div class="my-wwz-card-body" data-my-wwz-attention-body></div>
        </article>
        <article class="my-wwz-card my-wwz-card-wide" data-my-wwz-recent>
          <header><div><span>RECENT PROGRESS</span><h3>Your Latest Activity</h3></div><b>Live account data</b></header>
          <div class="my-wwz-recent-grid" data-my-wwz-recent-body></div>
        </article>
        <article class="my-wwz-card my-wwz-card-wide">
          <header><div><span>QUICK ACTIONS</span><h3>Jump Straight In</h3></div><b>Companion ready</b></header>
          <div class="my-wwz-actions" data-my-wwz-actions></div>
        </article>
      </div>`;
    const metricGrid = overviewPanel.querySelector('.metric-grid');
    if (metricGrid) metricGrid.insertAdjacentElement('afterend', root);
    else overviewPanel.querySelector('.view-heading')?.insertAdjacentElement('afterend', root);

    const refresh = root.querySelector('[data-my-wwz-refresh]');
    refresh?.addEventListener('click', () => refreshSnapshot({ force: true }));
    renderQuickActions();
    return root;
  };

  const setMessage = (message = '', tone = '') => {
    ensureRoot();
    const target = root.querySelector('[data-my-wwz-message]');
    if (!target) return;
    target.textContent = message;
    target.hidden = !message;
    target.dataset.tone = tone;
  };

  const renderQuickActions = () => {
    ensureRoot();
    const actions = root.querySelector('[data-my-wwz-actions]');
    if (!actions || actions.childElementCount) return;
    [
      ['Map', 'map', 'explorer'],
      ['Shop', 'shop', 'catalogue'],
      ['Quests', 'objectives', 'quests'],
      ['Tickets', 'tickets', 'member'],
      ['Events', 'community', 'events'],
      ['Profile', 'players', 'profile'],
    ].forEach(([label, view, section]) => actions.append(createNavButton(label, view, section)));
  };

  const renderGuest = () => {
    ensureRoot();
    root.dataset.state = 'guest';
    const server = selectedServer();
    root.querySelector('[data-my-wwz-world]').textContent = server?.map_name || 'Select server';
    root.querySelector('[data-my-wwz-subtitle]').textContent = 'Sign in with Discord to load your personal WWZ dashboard.';
    const metrics = root.querySelector('[data-my-wwz-metrics]');
    metrics.replaceChildren(
      createMetric('Server', server?.map_name || '—', server?.name || 'World War Z'),
      createMetric('Survivor', 'Sign in required', 'Discord + PSN identity'),
      createMetric('Progression', '—', 'XP, level and prestige'),
      createMetric('Wallet', '—', 'Economy and orders')
    );
    root.querySelector('[data-my-wwz-now-body]').replaceChildren(createStatusRow('My WWZ is locked', 'Discord sign-in', 'Authenticate to load server-aware personal data.'));
    root.querySelector('[data-my-wwz-objective-list]').replaceChildren(createStatusRow('Objectives', 'Sign in required', 'Daily and weekly quests appear here.'));
    root.querySelector('[data-my-wwz-survivor-body]').replaceChildren(createStatusRow('Survivor profile', 'Sign in required', 'PSN, progression and world-specific statistics.'));
    root.querySelector('[data-my-wwz-attention-body]').replaceChildren(createStatusRow('Attention feed', 'Sign in required', 'Tickets, orders and event notices appear here.'));
    root.querySelector('[data-my-wwz-recent-body]').replaceChildren(createStatusRow('Recent activity', 'Sign in required', 'XP and economy history appears here.'));
  };

  const renderMetrics = (snapshot) => {
    const { account, progression, shop, status, server } = snapshot;
    const profile = account?.profile || {};
    const economy = account?.economy || {};
    const member = progression?.member || {};
    const players = status?.players || {};
    const operations = status?.operations || {};
    const openOrders = (shop?.orders || []).filter((order) => ['pending', 'processing'].includes(String(order.status))).length;
    const statusLabel = String(status?.status || 'unknown').replace(/^./, (letter) => letter.toUpperCase());
    const restart = operations.restart_countdown_seconds != null
      ? `Restart ${duration(operations.restart_countdown_seconds)}`
      : 'Restart sync pending';

    const metrics = root.querySelector('[data-my-wwz-metrics]');
    metrics.replaceChildren(
      createMetric('Current server', `${statusLabel} · ${number(players.current)} / ${number(players.maximum)}`, `${server?.map_name || status?.server?.map || 'World'} · ${restart}`),
      createMetric('My survivor', profile.linked ? String(profile.psn_id || 'Linked survivor') : 'PSN not linked', profile.linked ? (profile.online ? 'Online now' : 'Verified survivor') : 'Use /account link in Discord'),
      createMetric('Progression', `Level ${Number(member.level || 1)} · P${Number(member.prestige || 0)}`, `${number(member.lifetime_xp)} lifetime XP`),
      createMetric('Wallet & orders', money(shop?.balance ?? economy.balance), `${openOrders} open order${openOrders === 1 ? '' : 's'}`)
    );
  };

  const renderNow = (snapshot) => {
    const { community, world, server } = snapshot;
    const body = root.querySelector('[data-my-wwz-now-body]');
    const state = root.querySelector('[data-my-wwz-now-state]');
    body.replaceChildren();

    const events = Array.isArray(community?.events) ? community.events : [];
    const event = events.find((item) => String(item.status) === 'active')
      || events.find((item) => String(item.status) === 'scheduled')
      || events[0];

    if (event) {
      body.append(createStatusRow(
        event.title || 'Community event',
        String(event.status || 'scheduled').toUpperCase(),
        `${event.location_label || 'Server-wide'} · starts ${relative(event.starts_at)}`
      ));
    }

    if (server?.map_key === 'chernarus') {
      const expedition = world?.expeditions?.[0];
      const goal = world?.community_goal || {};
      const personal = world?.personal || {};
      const activeJourney = (personal?.journeys?.catalogue || []).find((item) => item.status === 'active');
      if (expedition) {
        body.append(createStatusRow('Active PvE expedition', expedition.name || 'Expedition', `${expedition.tier || 'PvE'} · rotates in ${countdown(expedition.ends_at)}`, 'pve'));
      }
      if (activeJourney) {
        const current = Number(activeJourney.current_stage || 0);
        const stage = activeJourney.stages?.[current];
        body.append(createStatusRow('No-death operation', activeJourney.name || 'Operation', stage ? `Current stage: ${stage.name}` : 'Operation in progress', 'pve'));
      }
      if (goal?.name) {
        body.append(createStatusRow('Weekly community goal', `${Number(goal.percent || 0).toFixed(0)}%`, goal.name, goal.completed ? 'good' : ''));
      }
      state.textContent = 'Chernarus PvE';
    } else {
      const hotspot = world?.hotspots?.[0];
      const objective = world?.faction_objective;
      const wanted = world?.most_wanted?.[0];
      if (hotspot) body.append(createStatusRow('Active PvP hotspot', hotspot.name || 'Hotspot', `Rotates in ${countdown(hotspot.ends_at)}`, 'pvp'));
      if (objective) body.append(createStatusRow('Faction objective', objective.name || 'Control objective', `${Number(objective.points_per_kill || 0)} points per confirmed PvP kill`, 'pvp'));
      if (wanted) body.append(createStatusRow('Most Wanted', wanted.target_psn || 'Target', `${money(wanted.amount)} bounty`, 'danger'));
      state.textContent = 'Livonia PvP';
    }

    if (!body.childElementCount) {
      body.append(createStatusRow('Current operations', 'Quiet right now', 'No active event or rotation data is available.'));
    }
  };

  const questRows = (objectives) => [
    ...(objectives?.quests?.daily || []).map((quest) => ({ ...quest, cadence: 'Daily' })),
    ...(objectives?.quests?.weekly || []).map((quest) => ({ ...quest, cadence: 'Weekly' })),
  ];

  const renderObjectives = (snapshot) => {
    const body = root.querySelector('[data-my-wwz-objective-list]');
    const count = root.querySelector('[data-my-wwz-objective-count]');
    body.replaceChildren();

    const quests = questRows(snapshot.objectives);
    const active = quests.filter((quest) => ['active', 'completed'].includes(String(quest.status || 'active'))).slice(0, 4);
    count.textContent = `${active.length} active`;

    active.forEach((quest) => {
      const objectiveList = Array.isArray(quest.objectives) ? quest.objectives : [];
      const complete = objectiveList.filter((item) => item.complete).length;
      const detail = quest.status === 'completed'
        ? `Reward ready · ${money(quest.reward_money)} + ${number(quest.reward_xp)} XP`
        : `${complete} / ${objectiveList.length} objectives complete`;
      body.append(createStatusRow(`${quest.cadence} · ${quest.title}`, String(quest.status || 'active').toUpperCase(), detail, quest.status === 'completed' ? 'good' : ''));
    });

    if (snapshot.server?.map_key === 'chernarus') {
      const activeJourney = (snapshot.world?.personal?.journeys?.catalogue || []).find((item) => item.status === 'active');
      if (activeJourney) {
        const current = Number(activeJourney.current_stage || 0);
        const stage = activeJourney.stages?.[current];
        body.append(createStatusRow('Operation objective', stage?.name || activeJourney.name || 'Current operation', activeJourney.name || 'No-death operation', 'pve'));
      }
    }

    if (!body.childElementCount) {
      body.append(createStatusRow('Quests', 'No active quests', 'Open Objectives to check the current rotation.'));
    }
  };

  const renderSurvivor = (snapshot) => {
    const body = root.querySelector('[data-my-wwz-survivor-body]');
    const state = root.querySelector('[data-my-wwz-survivor-state]');
    body.replaceChildren();

    const profile = snapshot.account?.profile || {};
    const member = snapshot.progression?.member || {};
    state.textContent = profile.psn_id || member.display_name || 'Survivor';

    body.append(createStatusRow(
      'Progression',
      `Level ${Number(member.level || 1)} · Prestige ${Number(member.prestige || 0)}`,
      member.survivor_title?.name || member.prestige_title || 'Survivor'
    ));

    if (snapshot.server?.map_key === 'chernarus') {
      const personal = snapshot.world?.personal || {};
      const passport = personal.passport || {};
      const reputation = personal.reputation || {};
      const life = personal.life?.current || null;
      body.append(createStatusRow('Survivor Passport', `${Number(passport.discovered || 0)} / ${Number(passport.total || 0)}`, `${Number(passport.percent || 0).toFixed(0)}% Chernarus discovered`, 'pve'));
      body.append(createStatusRow('PvE reputation', reputation.name || 'Survivor', `${number(reputation.points)} reputation`, 'pve'));
      body.append(createStatusRow('Current tracked life', life ? duration(life.active_seconds) : 'Waiting for position', life ? `${(Number(life.distance_metres || 0) / 1000).toFixed(1)} km validated travel` : 'Starts from the next valid ADM position'));
    } else {
      const pvp = profile.pvp || {};
      const leaderboard = snapshot.world?.competition?.leaderboards?.day || [];
      const row = leaderboard.find((item) => String(item.psn || '').toLowerCase() === String(profile.psn_id || '').toLowerCase());
      body.append(createStatusRow('Confirmed PvP', `${number(pvp.kills)} K · ${number(pvp.deaths)} D`, `${Number(pvp.kd_ratio || 0).toFixed(2)} K/D`, 'pvp'));
      body.append(createStatusRow('Current streak', number(pvp.current_streak), pvp.favourite_weapon ? `Favourite weapon: ${pvp.favourite_weapon}` : 'Confirmed combat activity', 'pvp'));
      body.append(createStatusRow('24h leaderboard', row ? `${number(row.kills)} kills` : 'No ranked kills', row ? `${Number(row.kd || 0).toFixed(2)} K/D · ${number(row.hotspot_kills)} hotspot` : 'Only confirmed PvP is counted'));
    }
  };

  const renderAttention = (snapshot) => {
    const body = root.querySelector('[data-my-wwz-attention-body]');
    const count = root.querySelector('[data-my-wwz-attention-count]');
    body.replaceChildren();

    const tickets = (snapshot.tickets?.tickets || []).filter((ticket) => ['creating', 'open'].includes(String(ticket.status)));
    const orders = (snapshot.shop?.orders || []).filter((order) => ['pending', 'processing'].includes(String(order.status)));
    const events = (snapshot.community?.events || []).filter((event) => ['active', 'scheduled'].includes(String(event.status)));
    const serverStatus = String(snapshot.status?.status || 'unknown');

    const items = [];
    if (tickets.length) items.push(['Open support tickets', `${tickets.length}`, tickets[0]?.subject || 'A ticket is awaiting attention', '']);
    if (orders.length) items.push(['Shop / trader orders', `${orders.length}`, `${orders.filter((order) => order.status === 'processing').length} processing`, '']);
    if (events.length) items.push(['Community events', `${events.length}`, events[0]?.title || 'Upcoming event', '']);
    if (serverStatus !== 'online') items.push(['Server status', serverStatus.toUpperCase(), 'Check live server status before joining.', 'danger']);

    count.textContent = String(items.length);
    items.forEach(([label, value, detail, tone]) => body.append(createStatusRow(label, value, detail, tone)));
    if (!items.length) body.append(createStatusRow('All clear', '0 items', 'No open tickets, orders, scheduled events or server warnings.', 'good'));
  };

  const renderRecent = (snapshot) => {
    const body = root.querySelector('[data-my-wwz-recent-body]');
    body.replaceChildren();

    const xp = (snapshot.progression?.recent_xp || []).filter((row) => Number(row.amount) !== 0).slice(0, 3);
    const transactions = (snapshot.account?.recent_transactions || []).slice(0, 3);

    const progression = document.createElement('div');
    progression.className = 'my-wwz-recent-column';
    const progressionTitle = document.createElement('strong');
    progressionTitle.textContent = 'XP / Progression';
    progression.append(progressionTitle);
    xp.forEach((row) => progression.append(createStatusRow(
      String(row.details || String(row.source_type || 'XP').replaceAll('_', ' ')),
      `${Number(row.amount) > 0 ? '+' : ''}${number(row.amount)} XP`,
      relative(row.created_at)
    )));
    if (!xp.length) progression.append(createStatusRow('Progression activity', 'No recent XP', 'New legitimate XP events will appear here.'));

    const economy = document.createElement('div');
    economy.className = 'my-wwz-recent-column';
    const economyTitle = document.createElement('strong');
    economyTitle.textContent = 'Economy';
    economy.append(economyTitle);
    transactions.forEach((row) => {
      const change = Number(row.change || 0);
      economy.append(createStatusRow(
        String(row.details || row.command || 'Economy activity'),
        `${change >= 0 ? '+' : '−'}${money(Math.abs(change))}`,
        relative(row.created_at),
        change >= 0 ? 'good' : ''
      ));
    });
    if (!transactions.length) economy.append(createStatusRow('Economy activity', 'No recent transactions', 'Your wallet history will appear here.'));

    body.append(progression, economy);
  };

  const renderSnapshot = (snapshot) => {
    ensureRoot();
    lastSnapshot = snapshot;
    root.dataset.state = 'ready';
    root.dataset.map = snapshot.server?.map_key || '';
    root.querySelector('[data-my-wwz-world]').textContent = `${snapshot.server?.map_name || 'Current server'} · ${snapshot.server?.name || 'World War Z'}`;
    root.querySelector('[data-my-wwz-subtitle]').textContent = snapshot.server?.map_key === 'chernarus'
      ? 'Your Chernarus PvE command view: server state, Survivor Passport, quests, operations, events and account activity.'
      : 'Your Livonia PvP command view: server state, confirmed combat, hotspots, quests, events and account activity.';
    renderMetrics(snapshot);
    renderNow(snapshot);
    renderObjectives(snapshot);
    renderSurvivor(snapshot);
    renderAttention(snapshot);
    renderRecent(snapshot);
  };

  const collectSnapshot = async () => {
    const server = selectedServer();
    if (!server) throw new Error('Select a World War Z server first.');

    const worldUrl = server.map_key === 'livonia' ? API.livonia : API.chernarus;
    const calls = {
      account: requestJson(API.account, { auth: true }),
      progression: requestJson(API.progression, { auth: true }),
      objectives: requestJson(API.objectives, { auth: true }),
      tickets: requestJson(API.tickets, { auth: true }),
      shop: requestJson(API.shop, { auth: true }),
      community: requestJson(API.community, { auth: false }),
      status: requestJson(API.status, { auth: false }),
      world: requestJson(worldUrl, { auth: false }),
    };

    const keys = Object.keys(calls);
    const results = await Promise.allSettled(keys.map((key) => calls[key]));
    const snapshot = { server, failures: [] };
    results.forEach((result, index) => {
      const key = keys[index];
      if (result.status === 'fulfilled') snapshot[key] = result.value;
      else {
        snapshot[key] = null;
        snapshot.failures.push({ key, message: result.reason?.message || 'Unavailable' });
      }
    });
    return snapshot;
  };

  const schedule = () => {
    window.clearTimeout(refreshTimer);
    if (!active || document.hidden) return;
    refreshTimer = window.setTimeout(async () => {
      await refreshSnapshot();
      schedule();
    }, 60_000);
  };

  const refreshSnapshot = async ({ force = false } = {}) => {
    if (refreshInProgress) return;
    ensureRoot();

    if (!sessionToken()) {
      renderGuest();
      setMessage('');
      return;
    }

    if (!selectedServer()) {
      renderGuest();
      setMessage('Select a World War Z server to load My WWZ.', 'info');
      return;
    }

    refreshInProgress = true;
    const button = root.querySelector('[data-my-wwz-refresh]');
    button?.setAttribute('disabled', '');
    if (force || !lastSnapshot) setMessage('Refreshing your WWZ command view…', 'info');

    try {
      const snapshot = await collectSnapshot();
      renderSnapshot(snapshot);
      if (snapshot.failures.length) {
        setMessage(`${snapshot.failures.length} live data source${snapshot.failures.length === 1 ? '' : 's'} could not refresh. The available My WWZ cards are still current.`, 'warning');
      } else {
        setMessage(`My WWZ refreshed ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`, 'success');
      }
    } catch (error) {
      setMessage(error.message || 'My WWZ could not be refreshed.', 'error');
    } finally {
      refreshInProgress = false;
      button?.removeAttribute('disabled');
    }
  };

  const activate = () => {
    active = true;
    ensureRoot();
    refreshSnapshot();
    schedule();
  };

  const deactivate = () => {
    active = false;
    window.clearTimeout(refreshTimer);
    refreshTimer = 0;
  };

  window.addEventListener('wwz:viewchange', (event) => {
    if (event.detail?.view === 'overview') activate();
    else deactivate();
  });
  window.addEventListener('wwz:authchange', () => {
    lastSnapshot = null;
    if (active) refreshSnapshot({ force: true });
  });
  window.addEventListener('wwz:serverchange', () => {
    lastSnapshot = null;
    if (active) refreshSnapshot({ force: true });
  });
  window.addEventListener('online', () => {
    if (active) refreshSnapshot({ force: true });
  });
  document.addEventListener('visibilitychange', () => {
    if (!active) return;
    if (document.hidden) window.clearTimeout(refreshTimer);
    else {
      refreshSnapshot();
      schedule();
    }
  });

  window.WWZMyWwz = Object.freeze({ activate, deactivate, refresh: refreshSnapshot });
  window.__wwzMyWwzReady = true;

  if (overviewPanel.classList.contains('active')) activate();
})();
