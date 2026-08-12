(() => {
  const panel = document.querySelector('[data-view-panel="progression"]');
  if (!panel) return;

  const guest = panel.querySelector('[data-progression-guest]');
  const content = panel.querySelector('[data-progression-content]');
  const adminPanel = panel.querySelector('[data-progression-admin]');
  const adminMessage = panel.querySelector('[data-progression-admin-message]');
  const leaderboard = panel.querySelector('[data-progression-leaderboard]');
  const leaderboardEmpty = panel.querySelector('[data-progression-leaderboard-empty]');
  const leaderboardMetric = panel.querySelector('[data-progression-leaderboard-metric]');
  const historyList = panel.querySelector('[data-progression-history]');
  const historyEmpty = panel.querySelector('[data-progression-history-empty]');
  const badgeGrid = panel.querySelector('[data-progression-badges]');
  const prestigeHistory = panel.querySelector('[data-progression-prestige-history]');
  const prestigeEmpty = panel.querySelector('[data-progression-prestige-empty]');
  const refreshButton = panel.querySelector('[data-refresh-progression]');
  const saveAllButton = panel.querySelector('[data-save-progression-all]');
  const saveSettingsButton = panel.querySelector('[data-save-progression-settings]');
  const saveExclusionsButton = panel.querySelector('[data-save-progression-exclusions]');
  const syncRolesButton = panel.querySelector('[data-progression-sync-roles]');
  const levelRoleList = panel.querySelector('[data-progression-level-roles]');
  const prestigeRoleList = panel.querySelector('[data-progression-prestige-roles]');
  const customLevelInput = panel.querySelector('[data-progression-custom-level]');
  const customLevelRoleSearch = panel.querySelector('[data-progression-custom-role-search]');
  const customLevelRole = panel.querySelector('[data-progression-custom-role]');
  const customLevelSave = panel.querySelector('[data-progression-custom-save]');
  const levelupChannel = panel.querySelector('[data-progression-levelup-channel]');
  const excludedText = panel.querySelector('[data-progression-excluded-text]');
  const excludedVoice = panel.querySelector('[data-progression-excluded-voice]');

  let memberLoaded = false;
  let adminLoaded = false;
  let adminData = null;
  let requestInProgress = false;
  let memberPayload = null;

  const token = () => storageGet(AUTH_SESSION_KEY);
  const setTextLocal = (selector, value) => {
    panel.querySelectorAll(selector).forEach((node) => { node.textContent = value; });
  };
  const formatNumber = (value) => Number(value || 0).toLocaleString();
  const hasAdminAccess = () => ['staff', 'owner'].includes(dashboardAccessLevel);

  const setAdminMessage = (message = '', state = '') => {
    if (!adminMessage) return;
    adminMessage.textContent = message;
    adminMessage.hidden = !message;
    if (state) adminMessage.dataset.state = state;
    else delete adminMessage.dataset.state;
  };

  const requestJson = async (url, options = {}, protectedRequest = false) => {
    const response = await (protectedRequest ? protectedActionFetch : authFetch)(url, options);
    let payload = {};
    try { payload = await response.json(); } catch (_) { payload = {}; }
    if (!response.ok) {
      const error = new Error(payload?.message || `Request failed (${response.status})`);
      error.status = response.status;
      throw error;
    }
    return payload;
  };

  const sourceMeta = (source) => ({
    text: ['💬', 'Text'], voice: ['🎙️', 'Voice'], combat: ['☠️', 'Combat'],
    event: ['🏆', 'Event'], event_win: ['🏆', 'Event'], bounty: ['🎯', 'Bounty'],
    contract: ['📜', 'Contract'], quest: ['◎', 'Quest'], prestige: ['☣️', 'Prestige'], bonus: ['⭐', 'Bonus']
  }[String(source || '').toLowerCase()] || ['⭐', String(source || 'Bonus').replaceAll('_', ' ')]);

  const relativeDate = (value) => {
    if (!value) return 'Recently';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Recently';
    const seconds = Math.round((date.getTime() - Date.now()) / 1000);
    const absolute = Math.abs(seconds);
    const rtf = new Intl.RelativeTimeFormat('en-AU', { numeric: 'auto' });
    if (absolute < 60) return rtf.format(seconds, 'second');
    if (absolute < 3600) return rtf.format(Math.round(seconds / 60), 'minute');
    if (absolute < 86400) return rtf.format(Math.round(seconds / 3600), 'hour');
    return rtf.format(Math.round(seconds / 86400), 'day');
  };

  const renderLeaderboard = (rows, metric = 'overall') => {
    if (!leaderboard) return;
    leaderboard.replaceChildren();
    const safeRows = Array.isArray(rows) ? rows : [];
    if (leaderboardEmpty) leaderboardEmpty.hidden = safeRows.length !== 0;
    const titleMap = { overall: 'Overall Progression Leaderboard', daily: 'Last 24 Hours XP Leaderboard', weekly: 'Last 7 Days XP Leaderboard', lifetime: 'Lifetime XP Leaderboard', combat: 'Combat XP Leaderboard', prestige: 'Prestige Leaderboard' };
    setTextLocal('[data-progression-leaderboard-title]', titleMap[metric] || titleMap.overall);
    safeRows.forEach((row) => {
      const item = document.createElement('li');
      const place = document.createElement('span');
      const copy = document.createElement('div');
      const name = document.createElement('strong');
      const detail = document.createElement('small');
      const xp = document.createElement('strong');
      const position = Number(row.position) || 0;
      place.className = 'place';
      place.textContent = ({ 1: '🥇', 2: '🥈', 3: '🥉' })[position] || `#${position || '—'}`;
      name.textContent = `${String(row.prestige_icon || '🩸')} ${String(row.display_name || 'Unknown Member')}`;
      detail.textContent = `Prestige ${Number(row.prestige) || 0} · Level ${Number(row.level) || 1}`;
      if (metric === 'weekly' || metric === 'daily') xp.textContent = `+${formatNumber(row.period_xp)} XP`;
      else if (metric === 'combat') xp.textContent = `${formatNumber(row.combat_xp)} XP`;
      else if (metric === 'prestige') xp.textContent = `P${Number(row.prestige) || 0} · L${Number(row.level) || 1}`;
      else xp.textContent = `${formatNumber(row.lifetime_xp)} XP`;
      copy.append(name, detail);
      item.append(place, copy, xp);
      leaderboard.append(item);
    });
  };

  const renderHistory = (rows) => {
    if (!historyList) return;
    historyList.replaceChildren();
    const events = (Array.isArray(rows) ? rows : []).filter((row) => Number(row.amount) !== 0).slice(0, 10);
    if (historyEmpty) historyEmpty.hidden = events.length !== 0;
    events.forEach((row) => {
      const [icon, label] = sourceMeta(row.source_type);
      const item = document.createElement('li');
      const amount = Number(row.amount) || 0;
      item.innerHTML = `<span class="progression-history-icon">${icon}</span><div><strong>${amount > 0 ? '+' : ''}${amount.toLocaleString()} XP · ${label}</strong><small></small></div><time></time>`;
      item.querySelector('small').textContent = String(row.details || 'Progression activity');
      item.querySelector('time').textContent = relativeDate(row.created_at);
      historyList.append(item);
    });
  };

  const renderBadges = (badges) => {
    if (!badgeGrid) return;
    badgeGrid.replaceChildren();
    const rows = Array.isArray(badges) ? badges : [];
    const achieved = rows.filter((badge) => badge.achieved);
    setTextLocal('[data-progression-badge-count]', formatNumber(achieved.length));
    rows.forEach((badge) => {
      const card = document.createElement('div');
      card.className = `progression-badge${badge.achieved ? ' earned' : ' locked'}`;
      card.innerHTML = `<span>${badge.icon || '🎖️'}</span><div><strong></strong><small></small><i><b></b></i></div>`;
      card.querySelector('strong').textContent = badge.name || 'Achievement';
      card.querySelector('small').textContent = badge.achieved ? badge.description : `${formatNumber(badge.current)} / ${formatNumber(badge.target)} · ${badge.description}`;
      card.querySelector('i').style.setProperty('--badge-progress', `${Math.max(0, Math.min(100, Number(badge.progress_percent) || 0))}%`);
      badgeGrid.append(card);
    });
  };

  const renderPrestigeHistory = (rows) => {
    if (!prestigeHistory) return;
    prestigeHistory.replaceChildren();
    const safeRows = Array.isArray(rows) ? rows : [];
    if (prestigeEmpty) prestigeEmpty.hidden = safeRows.length !== 0;
    safeRows.forEach((row) => {
      const item = document.createElement('div');
      item.className = 'prestige-history-item';
      item.innerHTML = `<span>☣️</span><div><strong></strong><small></small></div>`;
      item.querySelector('strong').textContent = `Prestige ${Number(row.prestige) || 0}`;
      item.querySelector('small').textContent = relativeDate(row.created_at);
      prestigeHistory.append(item);
    });
  };

  const resetProfileProgression = (message = 'Loading progression…') => {
    const set = (selector, value) => document.querySelectorAll(selector).forEach((node) => { node.textContent = value; });
    set('[data-profile-progression-title]', 'Survivor');
    set('[data-profile-progression-rank]', '—');
    set('[data-profile-progression-level]', '—');
    set('[data-profile-progression-prestige]', '—');
    set('[data-profile-progression-24h]', '—');
    set('[data-profile-progression-7d]', '—');
    set('[data-profile-progression-lifetime]', '—');
    set('[data-profile-progression-progress]', message);
    document.querySelectorAll('[data-profile-progression-track]').forEach((node) => node.style.setProperty('--xp-progress', '0%'));
    document.querySelectorAll('[data-profile-progression-badges]').forEach((strip) => strip.replaceChildren());
  };

  const renderProfileProgression = (payload) => {
    const member = payload?.member || {};
    const analytics = payload?.analytics || {};
    const title = member.survivor_title || {};
    const set = (selector, value) => document.querySelectorAll(selector).forEach((node) => { node.textContent = value; });
    set('[data-profile-progression-title]', `${title.icon || '🩸'} ${title.name || 'Survivor'}`);
    set('[data-profile-progression-rank]', payload?.rank_position ? `#${Number(payload.rank_position).toLocaleString()}` : 'Unranked');
    set('[data-profile-progression-level]', `Level ${Number(member.level) || 1}`);
    set('[data-profile-progression-prestige]', `${member.prestige_icon || '🩸'} Prestige ${Number(member.prestige) || 0} — ${member.prestige_title || 'Survivor'}`);
    set('[data-profile-progression-24h]', `+${formatNumber(analytics.xp_24h)} XP`);
    set('[data-profile-progression-7d]', `+${formatNumber(analytics.xp_7d)} XP`);
    set('[data-profile-progression-lifetime]', `${formatNumber(member.lifetime_xp)} XP`);
    set('[data-profile-progression-progress]', Number(member.level) >= 100 ? (Number(member.prestige) >= 10 ? 'Maximum progression reached' : 'Level 100 complete — prestige ready') : `${formatNumber(member.current_level_xp)} / ${formatNumber(member.next_level_xp)} XP to Level ${(Number(member.level) || 1) + 1}`);
    document.querySelectorAll('[data-profile-progression-track]').forEach((node) => node.style.setProperty('--xp-progress', `${Math.max(0, Math.min(100, Number(member.progress_percent) || 0))}%`));
    document.querySelectorAll('[data-profile-progression-badges]').forEach((strip) => {
      strip.replaceChildren();
      (member.badges || []).filter((badge) => badge.achieved).slice(-5).forEach((badge) => {
        const pill = document.createElement('span');
        pill.textContent = `${badge.icon || '🎖️'} ${badge.name}`;
        strip.append(pill);
      });
      if (!strip.children.length) {
        const pill = document.createElement('span');
        pill.className = 'muted';
        pill.textContent = 'First achievement in progress';
        strip.append(pill);
      }
    });
  };


  const renderMember = (payload) => {
    memberPayload = payload;
    const member = payload?.member || {};
    const analytics = payload?.analytics || {};
    const rewards = payload?.rewards || {};
    const currentTier = member.current_tier || { icon: '🩸', name: 'Fresh Survivor', level: 1 };
    const nextTier = member.next_tier;
    const nextPrestige = member.next_prestige;
    setTextLocal('[data-progression-name]', member.display_name || 'Survivor');
    setTextLocal('[data-progression-prestige]', `${member.prestige_icon || '🩸'} Prestige ${Number(member.prestige) || 0} — ${member.prestige_title || 'Survivor'}`);
    setTextLocal('[data-progression-level]', `Level ${Number(member.level) || 1}`);
    setTextLocal('[data-progression-current-icon]', currentTier.icon || '🩸');
    setTextLocal('[data-progression-current-role]', `${currentTier.name || 'Fresh Survivor'} · Level ${Number(currentTier.level) || 1}+`);
    setTextLocal('[data-progression-rank]', payload?.rank_position ? `#${Number(payload.rank_position).toLocaleString()}` : 'Unranked');
    setTextLocal('[data-progression-lifetime]', formatNumber(member.lifetime_xp));
    setTextLocal('[data-progression-current-xp]', formatNumber(member.current_level_xp));
    setTextLocal('[data-progression-required-xp]', formatNumber(member.next_level_xp));
    setTextLocal('[data-progression-text-xp]', formatNumber(member.text_xp));
    setTextLocal('[data-progression-voice-xp]', formatNumber(member.voice_xp));
    setTextLocal('[data-progression-combat-xp]', formatNumber(member.combat_xp));
    setTextLocal('[data-progression-event-xp]', formatNumber(member.event_xp));
    setTextLocal('[data-progression-bonus-xp]', formatNumber(member.bonus_xp));
    setTextLocal('[data-progression-messages]', formatNumber(member.messages_credited));
    setTextLocal('[data-progression-voice-minutes]', `${formatNumber(member.voice_minutes_credited)} min`);
    setTextLocal('[data-progression-kills]', formatNumber(member.combat_kills_credited));
    setTextLocal('[data-progression-xp-24h]', formatNumber(analytics.xp_24h));
    setTextLocal('[data-progression-xp-7d]', formatNumber(analytics.xp_7d));
    setTextLocal('[data-progression-events-24h]', `${formatNumber(analytics.events_24h)} XP event${Number(analytics.events_24h) === 1 ? '' : 's'}`);
    setTextLocal('[data-progression-events-7d]', `${formatNumber(analytics.events_7d)} XP event${Number(analytics.events_7d) === 1 ? '' : 's'}`);
    const survivorTitle = member.survivor_title || {};
    setTextLocal('[data-progression-survivor-title]', `${survivorTitle.icon || '🩸'} ${survivorTitle.name || 'Survivor'}`);
    const nextReward = rewards.next || null;
    setTextLocal('[data-progression-next-reward]', nextReward && Number(nextReward.amount) > 0 ? `$${Number(nextReward.amount).toLocaleString()}` : '—');

    const track = panel.querySelector('[data-progression-xp-track]');
    if (track) track.style.setProperty('--xp-progress', `${Math.max(0, Math.min(100, Number(member.progress_percent) || 0))}%`);
    const target = panel.querySelector('[data-progression-next-milestone]');
    if (target) {
      if (nextTier) target.textContent = `${nextTier.icon} Level ${nextTier.level} — ${nextTier.name}`;
      else if (nextPrestige) target.textContent = `${nextPrestige.icon} Prestige ${nextPrestige.prestige} — ${nextPrestige.name}`;
      else target.textContent = '👑 Maximum progression reached';
    }
    const progressLabel = panel.querySelector('[data-progression-progress-label]');
    if (progressLabel) {
      progressLabel.textContent = Number(member.level) >= 100
        ? (Number(member.prestige) >= 10
          ? 'Maximum progression reached'
          : 'Level 100 complete — prestige ready')
        : `${formatNumber(member.current_level_xp)} / ${formatNumber(member.next_level_xp)} XP to Level ${(Number(member.level) || 1) + 1}`;
    }
    const metric = leaderboardMetric?.value || 'overall';
    renderLeaderboard(payload?.leaderboards?.[metric] || payload?.leaderboard, metric);
    renderHistory(payload?.recent_xp);
    renderBadges(member.badges);
    renderPrestigeHistory(payload?.prestige_history);
    renderProfileProgression(payload);
    guest?.setAttribute('hidden', '');
    content?.removeAttribute('hidden');
  };

  const loadMember = async ({ force = false } = {}) => {
    if (memberLoaded && !force) return;
    const sessionToken = token();
    if (!sessionToken) {
      memberLoaded = false;
      memberPayload = null;
      resetProfileProgression('Sign in to load progression');
      content?.setAttribute('hidden', '');
      guest?.removeAttribute('hidden');
      return;
    }
    const selectedServer = window.WWZServerContext?.getSelectedServer?.();
    if (!selectedServer) {
      memberLoaded = false;
      memberPayload = null;
      resetProfileProgression('Select a server to load progression');
      content?.setAttribute('hidden', '');
      guest?.removeAttribute('hidden');
      setTextLocal('[data-progression-guest-copy]', 'Select a World War Z server to view progression.');
      return;
    }
    resetProfileProgression();
    try {
      const payload = await requestJson(ACCOUNT_PROGRESSION_URL, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${sessionToken}` }
      });
      renderMember(payload);
      memberLoaded = true;
    } catch (error) {
      memberLoaded = false;
      memberPayload = null;
      resetProfileProgression('Progression data is temporarily unavailable');
      content?.setAttribute('hidden', '');
      guest?.removeAttribute('hidden');
      setTextLocal('[data-progression-guest-copy]', error.status === 401
        ? 'Your dashboard session expired. Sign in again to view progression.'
        : 'Progression data is temporarily unavailable.');
    }
  };

  const fillSelect = (select, options, selectedValues = [], { multiple = false, blankLabel = '' } = {}) => {
    if (!select) return;
    const selected = new Set((selectedValues || []).map(String));
    select.replaceChildren();
    if (!multiple && blankLabel) {
      const blank = document.createElement('option');
      blank.value = '';
      blank.textContent = blankLabel;
      blank.selected = selected.has('') || !selected.size;
      select.append(blank);
    }
    (options || []).forEach((option) => {
      const node = document.createElement('option');
      node.value = String(option.key || '');
      const manageable = option.manageable !== false;
      node.textContent = manageable
        ? String(option.name || 'Unknown')
        : `${String(option.name || 'Unknown')} — move bot role above this role`;
      node.selected = selected.has(node.value);
      node.disabled = !manageable && !node.selected;
      if (!manageable) node.dataset.unmanageable = 'true';
      select.append(node);
    });
  };

  const filterRoleOptions = (roles, query, selectedKey = '') => {
    const term = String(query || '').trim().toLocaleLowerCase();
    const selected = String(selectedKey || '');
    if (!term) return roles || [];
    return (roles || []).filter((role) => (
      String(role.key || '') === selected
      || String(role.name || '').toLocaleLowerCase().includes(term)
    ));
  };

  const searchableRoleSelect = (roles, selectedKey = '', { blankLabel = 'No role bound' } = {}) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'progression-role-picker';
    const search = document.createElement('input');
    search.type = 'search';
    search.placeholder = 'Search roles…';
    search.autocomplete = 'off';
    search.setAttribute('aria-label', 'Search Discord roles');
    const select = document.createElement('select');
    let currentValue = String(selectedKey || '');
    const renderOptions = () => {
      const filtered = filterRoleOptions(roles, search.value, currentValue);
      fillSelect(select, filtered, [currentValue], { blankLabel });
    };
    select.addEventListener('change', () => { currentValue = select.value; });
    search.addEventListener('input', renderOptions);
    renderOptions();
    wrapper.append(search, select);
    return { wrapper, search, select };
  };

  const refreshCustomRolePicker = () => {
    const roles = adminData?.resources?.roles || [];
    const currentValue = customLevelRole?.value || '';
    fillSelect(
      customLevelRole,
      filterRoleOptions(roles, customLevelRoleSearch?.value || '', currentValue),
      [currentValue],
      { blankLabel: 'Select role' }
    );
  };

  const saveRole = async ({ type, milestone, roleKey }) => {
    if (requestInProgress) return;
    const sessionToken = token();
    if (!sessionToken) return;
    requestInProgress = true;
    setAdminMessage('Saving role binding…');
    try {
      const body = type === 'level'
        ? { action: 'set_level_role', level: Number(milestone), role_key: roleKey }
        : { action: 'set_prestige_role', prestige: Number(milestone), role_key: roleKey };
      const payload = await postProgressionAction(sessionToken, body);
      adminData = payload;
      renderAdmin(payload);
      setAdminMessage('Role binding saved.', 'success');
    } catch (error) {
      setAdminMessage(error.message || 'Role binding could not be saved.', 'error');
    } finally {
      requestInProgress = false;
    }
  };

  const renderRoleRows = (container, recommendations, mappings, type) => {
    if (!container) return;
    container.replaceChildren();
    const map = new Map((mappings || []).map((row) => [Number(row[type]), row]));
    const appendRow = (milestone, recommendation, mapping = {}) => {
      const row = document.createElement('div');
      row.className = 'progression-role-row';
      const label = document.createElement('div');
      label.className = 'role-label';
      const icon = document.createElement('span');
      icon.textContent = String(recommendation?.icon || '◇');
      const copy = document.createElement('strong');
      copy.textContent = recommendation?.role_name || (type === 'level'
        ? `Level ${milestone} · ${recommendation?.name || 'Custom milestone'}`
        : `Prestige ${milestone} · ${recommendation?.name || 'Custom prestige'}`);
      label.append(icon, copy);
      const picker = searchableRoleSelect(adminData?.resources?.roles || [], mapping.role_key || '');
      const select = picker.select;
      select.dataset.progressionRoleType = type;
      select.dataset.progressionRoleMilestone = String(milestone);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'secondary-action compact-action';
      button.textContent = 'Save';
      button.addEventListener('click', () => saveRole({ type, milestone, roleKey: select.value }));
      row.append(label, picker.wrapper, button);
      container.append(row);
    };

    const recommendedMilestones = new Set();
    (recommendations || []).forEach((recommendation) => {
      const milestone = Number(recommendation[type]);
      recommendedMilestones.add(milestone);
      appendRow(milestone, recommendation, map.get(milestone) || {});
    });
    if (type === 'level') {
      [...map.entries()]
        .filter(([milestone]) => !recommendedMilestones.has(milestone))
        .sort((a, b) => a[0] - b[0])
        .forEach(([milestone, mapping]) => appendRow(milestone, null, mapping));
    }
  };

  const renderAdmin = (payload) => {
    adminData = payload;
    if (!hasAdminAccess()) {
      adminPanel?.setAttribute('hidden', '');
      return;
    }
    adminPanel?.removeAttribute('hidden');
    setTextLocal('[data-progression-tracked-members]', formatNumber(payload?.tracked_members));
    const settings = payload?.settings || {};
    panel.querySelectorAll('[data-progression-toggle]').forEach((input) => {
      input.checked = Boolean(Number(settings[input.dataset.progressionToggle] || 0));
    });
    panel.querySelectorAll('[data-progression-rate]').forEach((input) => {
      const key = input.dataset.progressionRate;
      input.value = Number(settings[key] ?? 0);
    });
    fillSelect(levelupChannel, payload?.resources?.text_channels || [], [payload?.levelup_channel_key || ''], { blankLabel: 'Automatic / source channel' });
    fillSelect(excludedText, payload?.resources?.text_channels || [], payload?.excluded_text_channel_keys || [], { multiple: true });
    fillSelect(excludedVoice, payload?.resources?.voice_channels || [], payload?.excluded_voice_channel_keys || [], { multiple: true });
    fillSelect(customLevelRole, payload?.resources?.roles || [], [customLevelRole?.value || ''], { blankLabel: 'Select role' });
    refreshCustomRolePicker();
    renderRoleRows(levelRoleList, payload?.level_recommendations || [], payload?.level_roles || [], 'level');
    renderRoleRows(prestigeRoleList, payload?.prestige_tiers || [], payload?.prestige_roles || [], 'prestige');
  };

  const loadAdmin = async ({ force = false } = {}) => {
    if (!hasAdminAccess()) {
      adminLoaded = false;
      adminPanel?.setAttribute('hidden', '');
      return;
    }
    if (adminLoaded && !force) return;
    const sessionToken = token();
    if (!sessionToken) return;
    try {
      const payload = await requestJson(ADMIN_PROGRESSION_CONFIG_URL, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${sessionToken}` }
      });
      renderAdmin(payload);
      adminLoaded = true;
    } catch (error) {
      adminLoaded = false;
      setAdminMessage(error.message || 'Progression configuration is temporarily unavailable.', 'error');
    }
  };

  const selectedValues = (select) => [...(select?.selectedOptions || [])].map((option) => option.value).filter(Boolean);

  customLevelRoleSearch?.addEventListener('input', refreshCustomRolePicker);

  const buildSettingsBody = () => {
    const body = { action: 'save_settings', levelup_channel_key: levelupChannel?.value || '' };
    panel.querySelectorAll('[data-progression-toggle]').forEach((input) => {
      body[input.dataset.progressionToggle] = Boolean(input.checked);
    });
    panel.querySelectorAll('[data-progression-rate]').forEach((input) => {
      body[input.dataset.progressionRate] = Number(input.value);
    });
    return body;
  };

  const collectRoleBindings = () => {
    const bindings = [...panel.querySelectorAll('select[data-progression-role-type]')].map((select) => ({
      type: String(select.dataset.progressionRoleType || ''),
      milestone: Number(select.dataset.progressionRoleMilestone || 0),
      roleKey: select.value || ''
    }));
    const customLevel = Number(customLevelInput?.value || 0);
    if (customLevelInput?.value && (!Number.isInteger(customLevel) || customLevel < 1 || customLevel > 100)) {
      throw new Error('Custom level milestones must be between 1 and 100.');
    }
    if (Number.isInteger(customLevel) && customLevel >= 1 && customLevel <= 100 && customLevelRole?.value) {
      const existing = bindings.find((row) => row.type === 'level' && row.milestone === customLevel);
      if (existing) existing.roleKey = customLevelRole.value;
      else bindings.push({ type: 'level', milestone: customLevel, roleKey: customLevelRole.value });
    }
    return bindings;
  };

  const postProgressionAction = async (sessionToken, body) => requestJson(ADMIN_PROGRESSION_CONFIG_URL, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
    body: JSON.stringify(body)
  }, true);

  saveAllButton?.addEventListener('click', async () => {
    if (requestInProgress) return;
    const sessionToken = token();
    if (!sessionToken) return;
    let roleBindings = [];
    try {
      roleBindings = collectRoleBindings();
    } catch (error) {
      setAdminMessage(error.message || 'Check the progression role settings.', 'error');
      return;
    }
    requestInProgress = true;
    saveAllButton.disabled = true;
    saveSettingsButton && (saveSettingsButton.disabled = true);
    saveExclusionsButton && (saveExclusionsButton.disabled = true);
    setAdminMessage('Saving all XP, economy, role and channel changes…');
    try {
      let payload = await postProgressionAction(sessionToken, buildSettingsBody());
      for (const binding of roleBindings) {
        payload = await postProgressionAction(sessionToken, binding.type === 'level'
          ? { action: 'set_level_role', level: binding.milestone, role_key: binding.roleKey }
          : { action: 'set_prestige_role', prestige: binding.milestone, role_key: binding.roleKey });
      }
      payload = await postProgressionAction(sessionToken, {
        action: 'save_exclusions',
        text_channel_keys: selectedValues(excludedText),
        voice_channel_keys: selectedValues(excludedVoice)
      });
      adminData = payload;
      renderAdmin(payload);
      if (customLevelInput) customLevelInput.value = '';
      if (customLevelRoleSearch) customLevelRoleSearch.value = '';
      setAdminMessage(`All progression changes saved (${roleBindings.length} role binding${roleBindings.length === 1 ? '' : 's'} checked).`, 'success');
    } catch (error) {
      setAdminMessage(error.message || 'One or more progression changes could not be saved.', 'error');
    } finally {
      requestInProgress = false;
      saveAllButton.disabled = false;
      if (saveSettingsButton) saveSettingsButton.disabled = false;
      if (saveExclusionsButton) saveExclusionsButton.disabled = false;
    }
  });

  saveSettingsButton?.addEventListener('click', async () => {
    if (requestInProgress) return;
    const sessionToken = token();
    if (!sessionToken) return;
    const body = buildSettingsBody();
    requestInProgress = true;
    saveSettingsButton.disabled = true;
    setAdminMessage('Saving XP rates and system settings…');
    try {
      const payload = await requestJson(ADMIN_PROGRESSION_CONFIG_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(body)
      }, true);
      adminData = payload;
      renderAdmin(payload);
      setAdminMessage('XP system settings saved.', 'success');
    } catch (error) {
      setAdminMessage(error.message || 'XP settings could not be saved.', 'error');
    } finally {
      requestInProgress = false;
      saveSettingsButton.disabled = false;
    }
  });

  saveExclusionsButton?.addEventListener('click', async () => {
    if (requestInProgress) return;
    const sessionToken = token();
    if (!sessionToken) return;
    requestInProgress = true;
    saveExclusionsButton.disabled = true;
    setAdminMessage('Saving channel exclusions…');
    try {
      const payload = await requestJson(ADMIN_PROGRESSION_CONFIG_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({
          action: 'save_exclusions',
          text_channel_keys: selectedValues(excludedText),
          voice_channel_keys: selectedValues(excludedVoice)
        })
      }, true);
      adminData = payload;
      renderAdmin(payload);
      setAdminMessage('Channel exclusions saved.', 'success');
    } catch (error) {
      setAdminMessage(error.message || 'Channel exclusions could not be saved.', 'error');
    } finally {
      requestInProgress = false;
      saveExclusionsButton.disabled = false;
    }
  });

  syncRolesButton?.addEventListener('click', async () => {
    if (requestInProgress) return;
    const sessionToken = token();
    if (!sessionToken) return;
    requestInProgress = true;
    syncRolesButton.disabled = true;
    setAdminMessage('Finding existing progression roles, binding milestones and syncing member roles…');
    try {
      const payload = await requestJson(ADMIN_PROGRESSION_CONFIG_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ action: 'sync_roles' })
      }, true);
      adminData = payload;
      renderAdmin(payload);
      const sync = payload?.role_sync || {};
      const missingAchievements = Array.isArray(sync.missing_roles) ? sync.missing_roles.length : 0;
      const missingDividers = Array.isArray(sync.missing_dividers) ? sync.missing_dividers.length : 0;
      const missing = missingAchievements + missingDividers;
      const dividerFound = Number(sync.divider_roles_found || 0);
      const dividerExpected = Number(sync.expected_dividers || 4);
      const suffix = missing
        ? ` ${missing} existing progression role${missing === 1 ? '' : 's'} could not be found by exact name.`
        : ' All existing progression roles were found.';
      setAdminMessage(
        `Role sync complete: ${sync.bound_level_roles || 0} level roles, ${sync.bound_prestige_roles || 0} prestige roles, ${dividerFound}/${dividerExpected} header/footer roles found, ${sync.synced_members || 0} member${Number(sync.synced_members) === 1 ? '' : 's'} updated. No roles were created.${suffix}`,
        missing ? 'error' : 'success'
      );
    } catch (error) {
      setAdminMessage(error.message || 'Progression roles could not be synchronized.', 'error');
    } finally {
      requestInProgress = false;
      syncRolesButton.disabled = false;
    }
  });

  customLevelSave?.addEventListener('click', () => {
    const level = Number(customLevelInput?.value || 0);
    if (!Number.isInteger(level) || level < 1 || level > 100) {
      setAdminMessage('Custom level milestones must be between 1 and 100.', 'error');
      return;
    }
    saveRole({ type: 'level', milestone: level, roleKey: customLevelRole?.value || '' });
  });

  leaderboardMetric?.addEventListener('change', () => {
    const metric = leaderboardMetric.value || 'overall';
    renderLeaderboard(memberPayload?.leaderboards?.[metric] || memberPayload?.leaderboard || [], metric);
  });

  refreshButton?.addEventListener('click', () => {
    memberLoaded = false;
    adminLoaded = false;
    loadMember({ force: true });
    loadAdmin({ force: true });
  });

  const activate = ({ admin = true } = {}) => {
    loadMember();
    if (admin) loadAdmin();
  };

  window.addEventListener('wwz:viewchange', (event) => {
    if (event.detail?.view === 'progression') activate({ admin: true });
    if (event.detail?.view === 'players') activate({ admin: false });
  });
  window.addEventListener('wwz:authchange', (event) => {
    memberLoaded = false;
    adminLoaded = false;
    memberPayload = null;
    if (!event.detail?.authenticated) {
      resetProfileProgression('Sign in to load progression');
      return;
    }
    if (!window.WWZServerContext?.getSelectedServer?.()) {
      resetProfileProgression('Select a server to load progression');
      return;
    }
    if (document.querySelector('[data-view-panel="progression"].active')) activate({ admin: true });
    else if (document.querySelector('[data-view-panel="players"].active')) activate({ admin: false });
  });
  window.addEventListener('wwz:serverchange', () => {
    memberLoaded = false;
    adminLoaded = false;
    memberPayload = null;
    loadMember({ force: true });
    if (document.querySelector('[data-view-panel="progression"].active')) loadAdmin({ force: true });
  });

  if (panel.classList.contains('active')) activate();
  else if (document.querySelector('[data-view-panel="players"].active')) activate({ admin: false });
})();
