(() => {
  'use strict';
  if (window.__wwzMyWwzReady) return;

  const overviewPanel = document.querySelector('[data-view-panel="overview"]');
  if (!overviewPanel) return;

  const API = Object.freeze({
    home: `${DASHBOARD_API_BASE}/api/account/home`,
    status: SERVER_STATUS_URL,
    chernarus: `${DASHBOARD_API_BASE}/api/chernarus/pve`,
    livonia: `${DASHBOARD_API_BASE}/api/livonia/pvp`,
  });

  let root = null;
  let active = false;
  let refreshTimer = 0;
  let transientTimer = 0;
  let refreshInProgress = false;
  let lastSnapshot = null;

  const token = () => {
    try { return storageGet(AUTH_SESSION_KEY) || ''; } catch (_) { return ''; }
  };
  const selectedServer = () => window.WWZServerContext?.getSelectedServer?.() || null;
  const integer = (value) => Math.max(0, Number.parseInt(value || 0, 10) || 0);
  const formatNumber = (value) => Number(value || 0).toLocaleString('en-AU');
  const credits = (value) => `${formatNumber(value)} credits`;
  const titleCase = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const relative = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    const seconds = Math.round((date.getTime() - Date.now()) / 1000);
    const abs = Math.abs(seconds);
    const formatter = new Intl.RelativeTimeFormat('en-AU', { numeric: 'auto' });
    if (abs < 60) return formatter.format(seconds, 'second');
    if (abs < 3600) return formatter.format(Math.round(seconds / 60), 'minute');
    if (abs < 86400) return formatter.format(Math.round(seconds / 3600), 'hour');
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

  const requestJson = async (url, { auth = false } = {}) => {
    const headers = { Accept: 'application/json' };
    const session = token();
    if (auth && !session) throw new Error('Discord sign-in is required.');
    if (session) headers.Authorization = `Bearer ${session}`;
    const response = await authFetch(url, { headers, cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload?.message || `Request failed (${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return payload;
  };

  const nav = (view, section = '') => {
    if (typeof showView === 'function') showView(view, true, section);
  };

  const openTarget = (target) => {
    const fallback = '/dashboard.html#actioncentre/inbox';
    try {
      const url = new URL(String(target || fallback), location.href);
      if (url.origin === location.origin && /\/dashboard\.html$/i.test(url.pathname) && url.hash) {
        const [view = '', section = ''] = url.hash.replace(/^#/, '').split('/', 2);
        nav(view || 'overview', section || '');
        return;
      }
      if (url.origin === location.origin) {
        location.href = `${url.pathname}${url.search}${url.hash}`;
        return;
      }
    } catch (_) {}
    nav('actioncentre', 'inbox');
  };

  const button = (label, onClick, className = 'my-wwz-link') => {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = className;
    node.textContent = label;
    node.addEventListener('click', onClick);
    return node;
  };

  const metric = (label, value, note, tone = '') => {
    const card = document.createElement('article');
    card.className = 'my-wwz-metric';
    if (tone) card.dataset.tone = tone;
    const labelNode = document.createElement('span');
    const valueNode = document.createElement('strong');
    const noteNode = document.createElement('small');
    labelNode.textContent = label;
    valueNode.textContent = value;
    noteNode.textContent = note;
    card.append(labelNode, valueNode, noteNode);
    return card;
  };

  const empty = (title, detail) => {
    const node = document.createElement('div');
    node.className = 'my-wwz-empty';
    const strong = document.createElement('strong');
    const small = document.createElement('small');
    strong.textContent = title;
    small.textContent = detail;
    node.append(strong, small);
    return node;
  };

  const row = ({ title, value = '', detail = '', tone = '', target = '', meta = '' }) => {
    const interactive = Boolean(target);
    const node = document.createElement(interactive ? 'button' : 'div');
    if (interactive) node.type = 'button';
    node.className = `my-wwz-row${interactive ? ' is-action' : ''}`;
    if (tone) node.dataset.tone = tone;
    const copy = document.createElement('span');
    copy.className = 'my-wwz-row-copy';
    const strong = document.createElement('strong');
    strong.textContent = title;
    const small = document.createElement('small');
    small.textContent = detail;
    copy.append(strong, small);
    const side = document.createElement('span');
    side.className = 'my-wwz-row-side';
    const valueNode = document.createElement('b');
    valueNode.textContent = value;
    side.append(valueNode);
    if (meta) {
      const metaNode = document.createElement('small');
      metaNode.textContent = meta;
      side.append(metaNode);
    }
    if (interactive) {
      const arrow = document.createElement('i');
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '→';
      side.append(arrow);
      node.addEventListener('click', () => openTarget(target));
    }
    node.append(copy, side);
    return node;
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
      <header class="my-wwz-hero">
        <div class="my-wwz-identity">
          <div class="my-wwz-avatar" data-my-wwz-avatar aria-hidden="true">WZ</div>
          <div>
            <p class="panel-kicker">Personal command centre</p>
            <h1 data-my-wwz-title>Welcome back</h1>
            <p data-my-wwz-subtitle>Your survivor, objectives, faction, events and account activity in one place.</p>
            <div class="my-wwz-hero-badges" data-my-wwz-badges></div>
          </div>
        </div>
        <div class="my-wwz-hero-actions">
          <div class="my-wwz-refresh-state"><strong data-my-wwz-world>Current server</strong><small data-my-wwz-updated>Waiting for refresh</small></div>
          <button class="secondary-action compact-action" data-my-wwz-actions-open type="button">Action Centre</button>
          <button class="primary-action compact-action" data-my-wwz-refresh type="button">Refresh Home</button>
        </div>
      </header>
      <p class="my-wwz-message" data-my-wwz-message hidden role="status"></p>
      <section class="my-wwz-link-callout" data-my-wwz-link-callout hidden>
        <div><strong>Finish your survivor account</strong><p>Link and verify your PlayStation identity to unlock progression, quests, economy and server activity across this command centre.</p></div>
        <button class="secondary-action" data-my-wwz-link-account type="button">Open Account Centre</button>
      </section>
      <div class="my-wwz-metrics" data-my-wwz-metrics aria-label="Personal WWZ summary"></div>
      <div class="my-wwz-grid">
        <article class="my-wwz-card my-wwz-card-feature" data-my-wwz-next>
          <header><div><span>NEXT UP</span><h2>Your Priorities</h2></div><b data-my-wwz-next-count>0</b></header>
          <div class="my-wwz-card-body" data-my-wwz-next-body></div>
          <footer><button class="my-wwz-link" data-my-wwz-next-open type="button">Open Action Centre →</button></footer>
        </article>
        <article class="my-wwz-card" data-my-wwz-world-card>
          <header><div><span>CURRENT WORLD</span><h2>Server &amp; Live Intel</h2></div><b data-my-wwz-world-state>—</b></header>
          <div class="my-wwz-card-body" data-my-wwz-world-body></div>
          <footer><button class="my-wwz-link" data-my-wwz-world-open type="button">Open World Operations →</button></footer>
        </article>
        <article class="my-wwz-card" data-my-wwz-progress>
          <header><div><span>QUESTS &amp; PROGRESSION</span><h2>Keep Moving Forward</h2></div><b data-my-wwz-progress-level>Level 1</b></header>
          <div class="my-wwz-progress-track" aria-hidden="true"><i data-my-wwz-progress-bar></i></div>
          <div class="my-wwz-card-body" data-my-wwz-progress-body></div>
          <footer><button class="my-wwz-link" data-my-wwz-quests-open type="button">Open Objectives →</button><button class="my-wwz-link" data-my-wwz-progress-open type="button">Progression →</button></footer>
        </article>
        <article class="my-wwz-card" data-my-wwz-faction>
          <header><div><span>FACTION</span><h2>Your Group</h2></div><b data-my-wwz-faction-state>Independent</b></header>
          <div class="my-wwz-card-body" data-my-wwz-faction-body></div>
          <footer><button class="my-wwz-link" data-my-wwz-faction-open type="button">Open Faction Centre →</button></footer>
        </article>
        <article class="my-wwz-card" data-my-wwz-events>
          <header><div><span>COMMUNITY EVENTS</span><h2>Upcoming &amp; Registered</h2></div><b data-my-wwz-event-count>0</b></header>
          <div class="my-wwz-card-body" data-my-wwz-events-body></div>
          <footer><button class="my-wwz-link" data-my-wwz-events-open type="button">Open Event Calendar →</button></footer>
        </article>
        <article class="my-wwz-card" data-my-wwz-orders>
          <header><div><span>ORDERS &amp; SUPPORT</span><h2>Things In Progress</h2></div><b data-my-wwz-order-count>0</b></header>
          <div class="my-wwz-card-body" data-my-wwz-orders-body></div>
          <footer><button class="my-wwz-link" data-my-wwz-shop-open type="button">Shop →</button><button class="my-wwz-link" data-my-wwz-tickets-open type="button">Tickets →</button></footer>
        </article>
        <article class="my-wwz-card my-wwz-card-wide" data-my-wwz-recent>
          <header><div><span>RECENT ACTIVITY</span><h2>Your Latest WWZ Activity</h2></div><b>Selected server only</b></header>
          <div class="my-wwz-activity" data-my-wwz-recent-body></div>
        </article>
        <article class="my-wwz-card my-wwz-card-wide" data-my-wwz-quick>
          <header><div><span>QUICK LINKS</span><h2>Jump Straight In</h2></div><b>One click away</b></header>
          <div class="my-wwz-quick-links" data-my-wwz-quick-links></div>
        </article>
      </div>`;
    overviewPanel.querySelector('.view-heading')?.insertAdjacentElement('afterend', root);

    root.querySelector('[data-my-wwz-refresh]')?.addEventListener('click', () => refresh({ force: true }));
    root.querySelector('[data-my-wwz-actions-open]')?.addEventListener('click', () => nav('actioncentre', 'inbox'));
    root.querySelector('[data-my-wwz-next-open]')?.addEventListener('click', () => nav('actioncentre', 'inbox'));
    root.querySelector('[data-my-wwz-link-account]')?.addEventListener('click', () => nav('players', 'account'));
    root.querySelector('[data-my-wwz-quests-open]')?.addEventListener('click', () => nav('objectives', 'quests'));
    root.querySelector('[data-my-wwz-progress-open]')?.addEventListener('click', () => nav('progression', 'progress'));
    root.querySelector('[data-my-wwz-faction-open]')?.addEventListener('click', () => nav('factions', 'directory'));
    root.querySelector('[data-my-wwz-events-open]')?.addEventListener('click', () => nav('community', 'events'));
    root.querySelector('[data-my-wwz-shop-open]')?.addEventListener('click', () => nav('shop', 'catalogue'));
    root.querySelector('[data-my-wwz-tickets-open]')?.addEventListener('click', () => nav('tickets', 'support'));
    root.querySelector('[data-my-wwz-world-open]')?.addEventListener('click', () => openWorld());
    renderQuickLinks();
    return root;
  };

  const setMessage = (message = '', tone = '', { transient = false } = {}) => {
    ensureRoot();
    window.clearTimeout(transientTimer);
    transientTimer = 0;
    const node = root.querySelector('[data-my-wwz-message]');
    node.textContent = message;
    node.dataset.tone = tone;
    node.hidden = !message;
    if (message && transient) {
      transientTimer = window.setTimeout(() => {
        if (node.textContent === message) {
          node.hidden = true;
          node.textContent = '';
          node.dataset.tone = '';
        }
      }, 4200);
    }
  };

  const openWorld = () => {
    const server = selectedServer();
    if (server?.map_key === 'livonia') nav('livoniapvp', 'operations');
    else nav('chernaruspve', 'operations');
  };

  const renderQuickLinks = () => {
    ensureRoot();
    const container = root.querySelector('[data-my-wwz-quick-links]');
    container.replaceChildren();
    const world = selectedServer()?.map_key === 'livonia'
      ? ['PvP Intel', () => nav('livoniapvp', 'operations')]
      : ['PvE Operations', () => nav('chernaruspve', 'operations')];
    [
      ['Account', () => nav('players', 'account')],
      ['Progression', () => nav('progression', 'progress')],
      ['Quests', () => nav('objectives', 'quests')],
      ['Factions', () => nav('factions', 'directory')],
      ['Events', () => nav('community', 'events')],
      ['Shop', () => nav('shop', 'catalogue')],
      ['Tickets', () => nav('tickets', 'support')],
      ['Action Centre', () => nav('actioncentre', 'inbox')],
      ['Map', () => nav('map', 'explorer')],
      world,
    ].forEach(([label, handler]) => container.append(button(label, handler, 'my-wwz-quick-link')));
  };

  const renderHero = (snapshot) => {
    const home = snapshot.home || {};
    const identity = home.identity || {};
    const profile = home.profile || {};
    const server = snapshot.server || {};
    const display = String(identity.display_name || 'Survivor');
    root.querySelector('[data-my-wwz-title]').textContent = `Welcome back, ${display}`;
    root.querySelector('[data-my-wwz-subtitle]').textContent = profile.linked
      ? `Your ${server.map_name || 'WWZ'} survivor command centre — live priorities, progress and community activity.`
      : 'Your WWZ account is connected. Link your PlayStation survivor to unlock the full command centre.';
    root.querySelector('[data-my-wwz-world]').textContent = `${server.map_name || 'Current server'} · ${server.name || 'World War Z'}`;
    root.querySelector('[data-my-wwz-updated]').textContent = `Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const avatar = root.querySelector('[data-my-wwz-avatar]');
    avatar.replaceChildren();
    if (identity.avatar_url) {
      const image = document.createElement('img');
      image.src = identity.avatar_url;
      image.alt = '';
      avatar.append(image);
    } else {
      avatar.textContent = display.split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase() || 'WZ';
    }

    const badges = root.querySelector('[data-my-wwz-badges]');
    badges.replaceChildren();
    const values = [
      server.map_name || 'Current world',
      titleCase(identity.access_level || server.access_level || 'member'),
      profile.linked ? (profile.online ? 'Online now' : `PSN · ${profile.psn_id || 'Verified'}`) : 'PSN not linked',
    ];
    values.forEach((value, index) => {
      const tag = document.createElement('span');
      tag.textContent = value;
      if (index === 2 && profile.online) tag.dataset.tone = 'good';
      if (index === 2 && !profile.linked) tag.dataset.tone = 'warning';
      badges.append(tag);
    });

    root.querySelector('[data-my-wwz-link-callout]').hidden = Boolean(profile.linked);
  };

  const renderMetrics = (snapshot) => {
    const home = snapshot.home || {};
    const progress = home.progression || {};
    const faction = home.faction || {};
    const quests = home.quests || {};
    const actions = home.action_centre?.summary || {};
    const metrics = root.querySelector('[data-my-wwz-metrics]');
    const progressNote = progress.next_level_xp
      ? `${formatNumber(progress.current_level_xp)} / ${formatNumber(progress.next_level_xp)} XP`
      : `${formatNumber(progress.lifetime_xp)} lifetime XP`;
    const factionValue = faction.member ? (faction.name || 'Faction member') : 'Independent';
    const factionNote = faction.member
      ? `${titleCase(faction.role)} · ${formatNumber(faction.member_count)} members`
      : `${formatNumber(faction.pending_invitations)} invite · ${formatNumber(faction.pending_applications)} application`;
    const questTone = integer(quests.claimable) > 0 ? 'attention' : '';
    const actionTone = integer(actions.urgent) > 0 ? 'danger' : integer(actions.actions) > 0 ? 'attention' : '';
    metrics.replaceChildren(
      metric('Progression', `Level ${integer(progress.level) || 1} · P${integer(progress.prestige)}`, progressNote),
      metric('Wallet', credits(home.economy?.balance), `${integer(home.economy?.daily_streak)} day streak`),
      metric('Faction', factionValue, factionNote),
      metric('Quests', `${integer(quests.claimable)} claimable`, `${integer(quests.active_count)} current objectives`, questTone),
      metric('Action Centre', `${integer(actions.actions)} actions`, `${integer(actions.unread)} unread${integer(actions.admin_actions) ? ` · ${integer(actions.admin_actions)} admin` : ''}`, actionTone),
    );
  };

  const renderNext = (snapshot) => {
    const body = root.querySelector('[data-my-wwz-next-body]');
    body.replaceChildren();
    const home = snapshot.home || {};
    const profile = home.profile || {};
    const actions = [...(home.action_centre?.top_actions || [])];
    if (!profile.linked) {
      body.append(row({ title: 'Link your PlayStation survivor', value: 'SETUP', detail: 'Unlock progression, quests, economy and live survivor data.', target: '/dashboard.html#players/account', tone: 'warning' }));
    }
    actions.slice(0, profile.linked ? 4 : 3).forEach((item) => {
      body.append(row({
        title: item.title || 'WWZ action',
        value: titleCase(item.priority || item.status || 'Action'),
        detail: item.detail || 'Open the related workspace to continue.',
        meta: item.due_at ? relative(item.due_at) : (item.created_at ? relative(item.created_at) : ''),
        target: item.target_url || '/dashboard.html#actioncentre/inbox',
        tone: String(item.priority || '').toLowerCase(),
      }));
    });
    if (!body.childElementCount) {
      const event = home.events?.upcoming?.[0];
      if (event) {
        body.append(row({ title: event.title || 'Upcoming community event', value: event.status === 'active' ? 'LIVE' : relative(event.starts_at), detail: event.location_label || 'Server-wide', target: '/dashboard.html#community/events', tone: event.status === 'active' ? 'good' : '' }));
      } else {
        body.append(empty('Nothing urgent right now', 'Your Action Centre has no active items requiring attention.'));
      }
    }
    root.querySelector('[data-my-wwz-next-count]').textContent = `${integer(home.action_centre?.summary?.actions)} action${integer(home.action_centre?.summary?.actions) === 1 ? '' : 's'}`;
  };

  const renderWorld = (snapshot) => {
    const body = root.querySelector('[data-my-wwz-world-body]');
    body.replaceChildren();
    const status = snapshot.status || {};
    const server = snapshot.server || {};
    const world = snapshot.world || {};
    const players = status.players || {};
    const operations = status.operations || {};
    const statusLabel = titleCase(status.status || 'unknown');
    const tone = String(status.status || '').toLowerCase() === 'online' ? 'good' : 'warning';
    body.append(row({
      title: 'DayZ server',
      value: `${statusLabel} · ${formatNumber(players.current)} / ${formatNumber(players.maximum)}`,
      detail: operations.restart_countdown_seconds != null ? `Next restart in ${duration(operations.restart_countdown_seconds)}` : 'Restart schedule synchronising',
      target: '/dashboard.html#server/status',
      tone,
    }));

    if (server.map_key === 'chernarus') {
      const expedition = world.expeditions?.[0];
      const goal = world.community_goal || {};
      const passport = world.personal?.passport || {};
      if (expedition) body.append(row({ title: 'Active PvE expedition', value: expedition.name || 'Expedition', detail: expedition.ends_at ? `Ends ${relative(expedition.ends_at)}` : (expedition.tier || 'PvE operation'), target: '/dashboard.html#chernaruspve/operations', tone: 'pve' }));
      if (goal?.name) body.append(row({ title: 'Community goal', value: `${Number(goal.percent || 0).toFixed(0)}%`, detail: goal.name, target: '/dashboard.html#chernaruspve/operations', tone: goal.completed ? 'good' : 'pve' }));
      if (snapshot.home?.profile?.linked && passport.total) body.append(row({ title: 'Survivor Passport', value: `${integer(passport.discovered)} / ${integer(passport.total)}`, detail: `${Number(passport.percent || 0).toFixed(0)}% of Chernarus discovered`, target: '/dashboard.html#chernaruspve/operations', tone: 'pve' }));
      root.querySelector('[data-my-wwz-world-state]').textContent = 'Chernarus PvE';
    } else {
      const hotspot = world.hotspots?.[0];
      const wanted = world.most_wanted?.[0];
      if (hotspot) body.append(row({ title: 'Active PvP hotspot', value: hotspot.name || 'Hotspot', detail: hotspot.ends_at ? `Rotates ${relative(hotspot.ends_at)}` : 'Confirmed PvP hotspot', target: '/dashboard.html#livoniapvp/operations', tone: 'pvp' }));
      if (wanted) body.append(row({ title: 'Most Wanted', value: wanted.target_psn || 'Target', detail: `${formatNumber(wanted.amount)} credit bounty`, target: '/dashboard.html#livoniapvp/operations', tone: 'danger' }));
      const pvp = snapshot.home?.profile?.pvp || {};
      if (snapshot.home?.profile?.linked) body.append(row({ title: 'Your confirmed PvP', value: `${integer(pvp.kills)} K · ${integer(pvp.deaths)} D`, detail: `${Number(pvp.kd_ratio || 0).toFixed(2)} K/D · ${integer(pvp.current_streak)} current streak`, target: '/dashboard.html#players/activity', tone: 'pvp' }));
      root.querySelector('[data-my-wwz-world-state]').textContent = 'Livonia PvP';
    }
    if (snapshot.failures.some((item) => item.key === 'world')) body.append(empty('Live world intelligence unavailable', 'Your private account cards remain current; live world data will retry automatically.'));
  };

  const renderProgress = (snapshot) => {
    const body = root.querySelector('[data-my-wwz-progress-body]');
    body.replaceChildren();
    const progress = snapshot.home?.progression || {};
    const quests = snapshot.home?.quests || {};
    root.querySelector('[data-my-wwz-progress-level]').textContent = `Level ${integer(progress.level) || 1} · P${integer(progress.prestige)}`;
    const percent = Math.max(0, Math.min(100, Number(progress.progress_percent || 0)));
    root.querySelector('[data-my-wwz-progress-bar]').style.width = `${percent}%`;
    body.append(row({
      title: progress.survivor_title?.name || progress.prestige_title || 'Survivor progression',
      value: `${percent.toFixed(1)}%`,
      detail: progress.next_level_xp ? `${formatNumber(progress.current_level_xp)} / ${formatNumber(progress.next_level_xp)} XP to next level` : `${formatNumber(progress.lifetime_xp)} lifetime XP`,
      target: '/dashboard.html#progression/progress',
    }));
    (quests.active || []).slice(0, 3).forEach((quest) => {
      const completed = quest.status === 'completed';
      body.append(row({
        title: `${quest.cadence} · ${quest.title}`,
        value: completed ? 'CLAIM' : `${integer(quest.objectives_complete)} / ${integer(quest.objectives_total)}`,
        detail: completed ? `${formatNumber(quest.reward_money)} credits + ${formatNumber(quest.reward_xp)} XP ready` : (quest.expires_at ? `Expires ${relative(quest.expires_at)}` : 'Current quest rotation'),
        target: '/dashboard.html#objectives/quests',
        tone: completed ? 'good' : '',
      }));
    });
    if (!(quests.active || []).length) body.append(empty(quests.available === false ? 'Quests unavailable' : 'No current quests', quests.message || 'Open Objectives to review your rotation.'));
  };

  const renderFaction = (snapshot) => {
    const body = root.querySelector('[data-my-wwz-faction-body]');
    body.replaceChildren();
    const faction = snapshot.home?.faction || {};
    const state = root.querySelector('[data-my-wwz-faction-state]');
    if (faction.member) {
      state.textContent = faction.name || 'Faction member';
      body.append(row({ title: faction.name || 'Your faction', value: titleCase(faction.role || 'member'), detail: faction.motto || `${integer(faction.member_count)} members · ${integer(faction.online_count)} online`, target: '/dashboard.html#factions/directory' }));
      body.append(row({ title: 'Faction strength', value: `${integer(faction.member_count)} / ${integer(faction.member_limit) || '—'}`, detail: `${integer(faction.online_count)} online · ${formatNumber(faction.bank_balance)} bank credits`, target: '/dashboard.html#factions/directory' }));
      const stats = faction.stats || {};
      body.append(row({ title: 'Faction activity', value: `${integer(stats.flag_claims)} flags`, detail: `${integer(stats.bounties_claimed)} bounties · ${integer(stats.contracts_completed)} contracts`, target: '/dashboard.html#factions/directory' }));
      if (integer(faction.pending_officer_applications)) body.append(row({ title: 'Applications awaiting faction review', value: formatNumber(faction.pending_officer_applications), detail: 'Leader/officer action is available in the Faction Centre.', target: '/dashboard.html#factions/directory', tone: 'attention' }));
    } else {
      state.textContent = 'Independent';
      const invites = integer(faction.pending_invitations);
      const apps = integer(faction.pending_applications);
      if (invites) body.append(row({ title: 'Faction invitation waiting', value: `${invites}`, detail: 'Accept or decline from your faction workspace.', target: '/dashboard.html#factions/directory', tone: 'attention' }));
      if (apps) body.append(row({ title: 'Faction application pending', value: `${apps}`, detail: 'Your application is waiting for faction review.', target: '/dashboard.html#factions/directory' }));
      if (!invites && !apps) body.append(empty('No faction membership yet', 'Browse open factions, recruitment status and community groups from the Faction Centre.'));
    }
  };

  const renderEvents = (snapshot) => {
    const body = root.querySelector('[data-my-wwz-events-body]');
    body.replaceChildren();
    const events = snapshot.home?.events || {};
    const upcoming = events.upcoming || [];
    root.querySelector('[data-my-wwz-event-count]').textContent = `${integer(events.registered_count)} registered`;
    upcoming.slice(0, 4).forEach((event) => {
      const status = String(event.status || 'scheduled');
      const myStatus = event.my_status ? titleCase(event.my_status) : '';
      body.append(row({
        title: event.title || 'Community event',
        value: status === 'active' ? 'LIVE' : relative(event.starts_at),
        detail: `${event.location_label || 'Server-wide'}${myStatus ? ` · You: ${myStatus}` : ''}`,
        target: '/dashboard.html#community/events',
        tone: status === 'active' ? 'good' : (event.my_status === 'waitlisted' ? 'attention' : ''),
      }));
    });
    if (!upcoming.length) body.append(empty('No live or scheduled events', 'New community events will appear here automatically.'));
  };

  const renderOrders = (snapshot) => {
    const body = root.querySelector('[data-my-wwz-orders-body]');
    body.replaceChildren();
    const orders = snapshot.home?.orders || {};
    const support = snapshot.home?.support || {};
    const openTotal = integer(orders.open_total) + integer(support.open_count);
    root.querySelector('[data-my-wwz-order-count]').textContent = `${openTotal} open`;
    (orders.recent || []).slice(0, 3).forEach((orderItem) => {
      const donation = orderItem.kind === 'donation';
      body.append(row({
        title: orderItem.name || (donation ? 'Donation order' : 'Shop order'),
        value: titleCase(orderItem.status || 'pending'),
        detail: donation ? `${orderItem.id || 'Donation'} · ${orderItem.price_aud || 'AUD order'}` : `Order #${orderItem.id || '—'} · ${formatNumber(orderItem.total)} credits`,
        target: donation ? '/donations.html#orders' : '/dashboard.html#shop/orders',
        meta: relative(orderItem.created_at),
      }));
    });
    (support.recent || []).filter((ticketItem) => ['creating', 'open'].includes(String(ticketItem.status))).slice(0, 2).forEach((ticketItem) => {
      body.append(row({ title: `Ticket #${ticketItem.ticket_number || ticketItem.ticket_id || '—'} · ${ticketItem.subject || 'Support'}`, value: titleCase(ticketItem.status || 'open'), detail: ticketItem.category || 'Support ticket', target: '/dashboard.html#tickets/support', meta: relative(ticketItem.last_activity_at) }));
    });
    if (!body.childElementCount) body.append(empty('Nothing waiting on you', 'No open shop orders, donation orders or support tickets for this server.'));
  };

  const renderRecent = (snapshot) => {
    const body = root.querySelector('[data-my-wwz-recent-body]');
    body.replaceChildren();
    const activity = snapshot.home?.recent_activity || [];
    activity.slice(0, 8).forEach((item) => {
      const node = document.createElement('button');
      node.type = 'button';
      node.className = 'my-wwz-activity-item';
      const icon = document.createElement('span');
      icon.className = 'my-wwz-activity-icon';
      icon.textContent = item.kind === 'progression' ? 'XP' : item.kind === 'economy' ? '$' : '•';
      const copy = document.createElement('span');
      const strong = document.createElement('strong');
      const small = document.createElement('small');
      strong.textContent = item.title || 'WWZ activity';
      small.textContent = item.detail || titleCase(item.kind || 'activity');
      copy.append(strong, small);
      const time = document.createElement('time');
      time.textContent = relative(item.created_at);
      node.append(icon, copy, time);
      node.addEventListener('click', () => openTarget(item.target_url));
      body.append(node);
    });
    if (!activity.length) body.append(empty('No recent activity yet', 'XP, economy and notification activity will appear here as you use WWZ.'));
  };

  const renderSnapshot = (snapshot) => {
    ensureRoot();
    const home = snapshot.home || {};
    if (!home || !['ok', 'partial'].includes(String(home.status || ''))) throw new Error(home?.message || 'Your member home is unavailable.');
    lastSnapshot = snapshot;
    root.dataset.state = home.status;
    root.dataset.map = snapshot.server?.map_key || '';
    overviewPanel.classList.add('member-home-ready');
    renderHero(snapshot);
    renderMetrics(snapshot);
    renderNext(snapshot);
    renderWorld(snapshot);
    renderProgress(snapshot);
    renderFaction(snapshot);
    renderEvents(snapshot);
    renderOrders(snapshot);
    renderRecent(snapshot);
    renderQuickLinks();
  };

  const collect = async () => {
    const server = selectedServer();
    if (!server) throw new Error('Select a World War Z server first.');
    const calls = {
      home: requestJson(API.home, { auth: true }),
      status: requestJson(API.status),
      world: requestJson(server.map_key === 'livonia' ? API.livonia : API.chernarus),
    };
    const keys = Object.keys(calls);
    const settled = await Promise.allSettled(keys.map((key) => calls[key]));
    const snapshot = { server, failures: [] };
    settled.forEach((result, index) => {
      const key = keys[index];
      if (result.status === 'fulfilled') snapshot[key] = result.value;
      else {
        snapshot[key] = null;
        snapshot.failures.push({ key, message: result.reason?.message || 'Unavailable' });
      }
    });
    if (!snapshot.home) throw new Error(snapshot.failures.find((item) => item.key === 'home')?.message || 'Your member home could not be loaded.');
    return snapshot;
  };

  const renderGuest = () => {
    ensureRoot();
    overviewPanel.classList.remove('member-home-ready');
    root.dataset.state = 'guest';
    root.querySelector('[data-my-wwz-title]').textContent = 'Your personal WWZ home';
    root.querySelector('[data-my-wwz-subtitle]').textContent = 'Sign in with Discord to load your survivor, objectives, faction, events, orders and activity.';
    setMessage('Discord sign-in is required to load your personal command centre.', 'info');
  };

  const schedule = () => {
    window.clearTimeout(refreshTimer);
    refreshTimer = 0;
    if (!active || document.hidden) return;
    refreshTimer = window.setTimeout(async () => {
      await refresh();
      schedule();
    }, 60_000);
  };

  const refresh = async ({ force = false } = {}) => {
    if (refreshInProgress) return;
    ensureRoot();
    if (!token()) { renderGuest(); return; }
    if (!selectedServer()) {
      overviewPanel.classList.remove('member-home-ready');
      setMessage('Select a World War Z server to load your personal command centre.', 'info');
      return;
    }

    refreshInProgress = true;
    const refreshButton = root.querySelector('[data-my-wwz-refresh]');
    const original = refreshButton.textContent;
    refreshButton.disabled = true;
    refreshButton.textContent = 'Refreshing…';
    root.classList.add('is-loading');
    if (force || !lastSnapshot) setMessage('Refreshing your personal WWZ command centre…', 'info');
    try {
      const snapshot = await collect();
      renderSnapshot(snapshot);
      const partial = [...(snapshot.failures || []), ...(snapshot.home?.failures || [])];
      if (partial.length) {
        setMessage(`Home refreshed with ${partial.length} data source${partial.length === 1 ? '' : 's'} temporarily unavailable. Available cards remain usable.`, 'warning');
      } else {
        setMessage('Your WWZ home is up to date.', 'success', { transient: true });
      }
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) overviewPanel.classList.remove('member-home-ready');
      setMessage(error?.message || 'Your WWZ home could not be refreshed.', 'error');
    } finally {
      refreshInProgress = false;
      refreshButton.disabled = false;
      refreshButton.textContent = original;
      root.classList.remove('is-loading');
    }
  };

  const activate = () => {
    active = true;
    ensureRoot();
    refresh();
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
    if (active) refresh({ force: true });
  });
  window.addEventListener('wwz:serverchange', () => {
    lastSnapshot = null;
    renderQuickLinks();
    if (active) refresh({ force: true });
  });
  window.addEventListener('online', () => { if (active) refresh({ force: true }); });
  document.addEventListener('visibilitychange', () => {
    if (!active) return;
    if (document.hidden) {
      window.clearTimeout(refreshTimer);
      refreshTimer = 0;
    } else {
      refresh();
      schedule();
    }
  });

  window.WWZMyWwz = Object.freeze({ activate, deactivate, refresh });
  window.__wwzMyWwzReady = true;
  if (overviewPanel.classList.contains('active')) activate();
})();
