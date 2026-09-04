(() => {
  const panel = document.querySelector('[data-view-panel="objectives"]');
  if (!panel) return;

  const guest = panel.querySelector('[data-objectives-guest]');
  const unlinked = panel.querySelector('[data-objectives-unlinked]');
  const content = panel.querySelector('[data-objectives-content]');
  const message = panel.querySelector('[data-objectives-message]');
  const dailyList = panel.querySelector('[data-objectives-daily-list]');
  const weeklyList = panel.querySelector('[data-objectives-weekly-list]');
  const historyList = panel.querySelector('[data-objectives-history]');
  const bountyList = panel.querySelector('[data-objectives-bounties]');
  const myBountyList = panel.querySelector('[data-objectives-my-bounties]');
  const contractsList = panel.querySelector('[data-objectives-contracts]');
  const myContractsList = panel.querySelector('[data-objectives-my-contracts]');
  const adminList = panel.querySelector('[data-objectives-admin-list]');
  const refreshButton = panel.querySelector('[data-refresh-objectives]');
  const bountyForm = panel.querySelector('[data-bounty-create-form]');
  const contractForm = panel.querySelector('[data-contract-create-form]');
  const settingsForm = panel.querySelector('[data-quest-settings-form]');

  let loaded = false;
  let adminLoaded = false;
  let working = false;
  let memberData = null;
  let adminData = null;

  const token = () => storageGet(AUTH_SESSION_KEY);
  const money = (value) => `$${Number(value || 0).toLocaleString()}`;
  const number = (value) => Number(value || 0).toLocaleString();
  const hasAdmin = () => ['staff', 'owner'].includes(dashboardAccessLevel);
  const isOwner = () => dashboardAccessLevel === 'owner';

  const setMessage = (text = '', state = '') => {
    if (!message) return;
    message.textContent = text;
    message.hidden = !text;
    if (state) message.dataset.state = state;
    else delete message.dataset.state;
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

  const relative = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    const seconds = Math.max(0, Math.round((date.getTime() - Date.now()) / 1000));
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days) return `${days}d ${hours}h`;
    if (hours) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const objectiveValue = (objective, key) => {
    const value = Number(objective?.[key] || 0);
    if (objective?.type === 'shop_spend') return money(value);
    if (objective?.type === 'location_dwell_minutes' || objective?.type === 'playtime_minutes') return `${Math.floor(value)} min`;
    return Number.isInteger(value) ? number(value) : value.toFixed(1);
  };

  const locationText = (objective) => {
    const locations = Array.isArray(objective?.qualifier?.locations) ? objective.qualifier.locations : [];
    return locations.map((location) => String(location?.name || '')).filter(Boolean).join(', ');
  };

  const button = (label, action, id, extraClass = 'secondary-action compact-action') => {
    const node = document.createElement('button');
    node.type = 'button';
    node.disabled = false;
    node.className = extraClass;
    node.textContent = label;
    node.dataset.objectiveAction = action;
    node.dataset.objectiveId = String(id);
    return node;
  };

  const renderQuestList = (target, quests, emptySelector) => {
    if (!target) return;
    target.replaceChildren();
    const rows = Array.isArray(quests) ? quests : [];
    const empty = panel.querySelector(emptySelector);
    if (empty) empty.hidden = rows.length !== 0;
    rows.forEach((quest) => {
      const card = document.createElement('article');
      card.className = `quest-card${quest.status === 'completed' ? ' is-complete' : ''}`;
      const head = document.createElement('div'); head.className = 'quest-card-head';
      const heading = document.createElement('div');
      const title = document.createElement('h3'); title.textContent = `#${quest.quest_id} · ${quest.title}`;
      const description = document.createElement('p'); description.textContent = quest.description || '';
      heading.append(title, description);
      const state = document.createElement('span'); state.className = `objective-status ${quest.status || ''}`; state.textContent = String(quest.status || 'active');
      head.append(heading, state);
      const objectives = document.createElement('div'); objectives.className = 'quest-objectives';
      (quest.objectives || []).forEach((objective) => {
        const row = document.createElement('div'); row.className = 'quest-objective-row';
        const copy = document.createElement('div'); copy.className = 'quest-objective-copy';
        const label = document.createElement('strong'); label.textContent = `${objective.complete ? '✓ ' : ''}${objective.label || 'Objective'}`;
        const location = locationText(objective);
        const detail = document.createElement('small'); detail.textContent = location || (objective?.qualifier?.minimum_metres ? `Minimum ${number(objective.qualifier.minimum_metres)} m` : 'Automatically tracked');
        const track = document.createElement('div'); track.className = 'quest-progress';
        const fill = document.createElement('span');
        const targetValue = Math.max(1, Number(objective.target || 1));
        fill.style.width = `${Math.max(0, Math.min(100, (Number(objective.progress || 0) / targetValue) * 100))}%`;
        track.append(fill); copy.append(label, detail, track);
        const progress = document.createElement('span'); progress.textContent = `${objectiveValue(objective, 'progress')} / ${objectiveValue(objective, 'target')}`;
        row.append(copy, progress); objectives.append(row);
      });
      const reward = document.createElement('div'); reward.className = 'quest-reward';
      const rewardText = document.createElement('strong'); rewardText.textContent = `${money(quest.reward_money)} + ${number(quest.reward_xp)} XP`;
      reward.append(rewardText);
      if (quest.status === 'completed') reward.append(button('Claim Reward', 'claim_quest', quest.quest_id, 'primary-action compact-action'));
      card.append(head, objectives, reward); target.append(card);
    });
  };

  const renderBounties = (payload) => {
    if (!bountyList) return;
    bountyList.replaceChildren();
    myBountyList?.replaceChildren();
    const active = Array.isArray(payload?.active) ? payload.active : [];
    const mine = Array.isArray(payload?.mine) ? payload.mine : [];
    const cancellable = new Set(mine.filter((item) => item.can_cancel).map((item) => Number(item.bounty_id)));
    panel.querySelector('[data-objectives-bounties-empty]')?.toggleAttribute('hidden', active.length !== 0);
    panel.querySelector('[data-objectives-my-bounties-empty]')?.toggleAttribute('hidden', mine.length !== 0);
    active.forEach((bounty) => {
      const card = document.createElement('article'); card.className = 'objective-card';
      const head = document.createElement('div'); head.className = 'objective-card-head';
      const title = document.createElement('h3'); title.textContent = `#${bounty.bounty_id} · ${bounty.target_psn}`;
      const amount = document.createElement('strong'); amount.textContent = money(bounty.amount);
      head.append(title, amount);
      const detail = document.createElement('p'); detail.textContent = `Placed by ${bounty.creator_psn} · expires in ${relative(bounty.expires_at)}`;
      const actions = document.createElement('div'); actions.className = 'objective-card-actions';
      if (cancellable.has(Number(bounty.bounty_id))) actions.append(button('Cancel & Refund', 'cancel_bounty', bounty.bounty_id, 'danger-action compact-action'));
      card.append(head, detail, actions); bountyList.append(card);
    });
    if (myBountyList) mine.forEach((bounty) => {
      const card = document.createElement('article'); card.className = 'objective-card';
      const head = document.createElement('div'); head.className = 'objective-card-head';
      const title = document.createElement('h3'); title.textContent = `#${bounty.bounty_id} · ${bounty.target_psn}`;
      const state = document.createElement('span'); state.className = `objective-status ${bounty.status || ''}`; state.textContent = String(bounty.status || 'unknown');
      head.append(title, state);
      const detail = document.createElement('p');
      const claimant = bounty.claimed_by_psn ? ` · claimed by ${bounty.claimed_by_psn}` : '';
      detail.textContent = `${money(bounty.amount)} · placed by ${bounty.creator_psn}${claimant}`;
      const actions = document.createElement('div'); actions.className = 'objective-card-actions';
      if (bounty.can_cancel) actions.append(button('Cancel & Refund', 'cancel_bounty', bounty.bounty_id, 'danger-action compact-action'));
      card.append(head, detail, actions); myBountyList.append(card);
    });
  };

  const renderContracts = (payload) => {
    if (!contractsList || !myContractsList) return;
    contractsList.replaceChildren(); myContractsList.replaceChildren();
    const available = Array.isArray(payload?.available) ? payload.available : [];
    const mine = Array.isArray(payload?.mine) ? payload.mine : [];
    const acceptedIds = new Set(mine.map((item) => Number(item.contract_id)));
    panel.querySelector('[data-objectives-contracts-empty]')?.toggleAttribute('hidden', available.length !== 0);
    panel.querySelector('[data-objectives-my-contracts-empty]')?.toggleAttribute('hidden', mine.length !== 0);
    available.forEach((contract) => {
      const card = document.createElement('article'); card.className = 'objective-card';
      const head = document.createElement('div'); head.className = 'objective-card-head';
      const title = document.createElement('h3'); title.textContent = `#${contract.contract_id} · ${contract.title}`;
      const reward = document.createElement('strong'); reward.textContent = money(contract.reward);
      head.append(title, reward);
      const desc = document.createElement('p'); desc.textContent = contract.description || '';
      const meta = document.createElement('div'); meta.className = 'objective-card-meta';
      [`Goal ${number(contract.target_count)}`, String(contract.contract_type || '').replaceAll('_', ' '), `Expires ${relative(contract.expires_at)}`].forEach((text) => { const span = document.createElement('span'); span.textContent = text; meta.append(span); });
      const actions = document.createElement('div'); actions.className = 'objective-card-actions';
      if (!acceptedIds.has(Number(contract.contract_id))) actions.append(button('Accept Contract', 'accept_contract', contract.contract_id, 'primary-action compact-action'));
      card.append(head, desc, meta, actions); contractsList.append(card);
    });
    mine.forEach((contract) => {
      const card = document.createElement('article'); card.className = 'objective-card';
      const head = document.createElement('div'); head.className = 'objective-card-head';
      const title = document.createElement('h3'); title.textContent = `#${contract.contract_id} · ${contract.title}`;
      const state = document.createElement('span'); state.className = `objective-status ${contract.status || ''}`; state.textContent = contract.status || 'active';
      head.append(title, state);
      const progress = document.createElement('p'); progress.textContent = `Progress ${number(contract.progress)} / ${number(contract.target_count)} · Reward ${money(contract.reward)}`;
      const actions = document.createElement('div'); actions.className = 'objective-card-actions';
      if (Number(contract.progress) >= Number(contract.target_count) && contract.status !== 'claimed') actions.append(button('Claim Contract', 'claim_contract', contract.contract_id, 'primary-action compact-action'));
      card.append(head, progress, actions); myContractsList.append(card);
    });
  };

  const renderHistory = (history) => {
    if (!historyList) return;
    historyList.replaceChildren();
    const rows = Array.isArray(history) ? history : [];
    panel.querySelector('[data-objectives-history-empty]')?.toggleAttribute('hidden', rows.length !== 0);
    rows.forEach((quest) => {
      const row = document.createElement('div'); row.className = 'objective-history-item';
      const copy = document.createElement('div');
      const title = document.createElement('strong'); title.textContent = `${quest.title} · ${String(quest.cadence || '').toUpperCase()}`;
      const detail = document.createElement('small'); detail.textContent = quest.claimed_at ? `Claimed ${new Date(quest.claimed_at).toLocaleString('en-AU')}` : `Ended ${new Date(quest.expires_at).toLocaleString('en-AU')}`;
      copy.append(title, detail);
      const summary = document.createElement('span');
      const status = document.createElement('strong'); status.className = `objective-status ${String(quest.status || '')}`; status.textContent = String(quest.status || 'unknown');
      const rewards = document.createElement('small'); rewards.textContent = `${money(quest.reward_money)} + ${number(quest.reward_xp)} XP`;
      summary.append(status, rewards); row.append(copy, summary); historyList.append(row);
    });
  };

  const renderCareer = (career = {}) => {
    const set = (selector, value) => { const node = panel.querySelector(selector); if (node) node.textContent = String(value); };
    const pct = (value) => `${Math.max(0, Math.min(100, Number(value) || 0)).toFixed(Number(value) % 1 ? 1 : 0)}%`;
    set('[data-quest-career-assigned]', number(career.assigned));
    set('[data-quest-career-completed]', number(career.completed));
    set('[data-quest-career-claimed]', number(career.claimed));
    set('[data-quest-career-rate]', pct(career.completion_rate));
    set('[data-quest-career-rewards]', `${money(career.claimed_reward_money)} + ${number(career.claimed_reward_xp)} XP`);
    set('[data-quest-career-claimable]', `${money(career.claimable_reward_money)} + ${number(career.claimable_reward_xp)} XP`);
    set('[data-quest-claim-all-count]', `${number(career.claimable)} ready`);
    const claimAll = panel.querySelector('[data-objective-action="claim_all_quests"]');
    if (claimAll) claimAll.disabled = Number(career.claimable || 0) < 1 || working;

    const rotations = [
      ['daily', career.daily || {}, career.streaks?.daily || {}],
      ['weekly', career.weekly || {}, career.streaks?.weekly || {}]
    ];
    rotations.forEach(([key, rotation, streak]) => {
      set(`[data-quest-${key}-progress-label]`, `${number(rotation.completed)} / ${number(rotation.total)} complete`);
      set(`[data-quest-${key}-streak]`, `Perfect streak: ${number(streak.current)} · Best ${number(streak.best)}`);
      const track = panel.querySelector(`[data-quest-${key}-track]`);
      if (track) track.style.setProperty('--quest-career-progress', pct(rotation.progress_percent));
    });

    const milestones = panel.querySelector('[data-quest-milestones]');
    if (milestones) {
      milestones.replaceChildren();
      (career.milestones || []).forEach((entry) => {
        const badge = document.createElement('span');
        badge.className = `quest-milestone${entry.achieved ? ' achieved' : ''}`;
        badge.textContent = `${entry.achieved ? '✓' : '○'} ${entry.label} · ${number(entry.target)}`;
        milestones.append(badge);
      });
    }
    const next = career.next_milestone;
    set('[data-quest-next-milestone]', next
      ? `${next.label}: ${number(career.claimed)} / ${number(next.target)} claimed quests`
      : (Number(career.claimed || 0) ? 'All current Quest Career milestones achieved.' : 'Complete quests to begin your objective career.'));
  };

  const renderMember = (payload) => {
    memberData = payload;
    const signedIn = Boolean(token());
    if (guest) guest.hidden = signedIn;
    const linked = payload?.status === 'ok';
    if (unlinked) unlinked.hidden = !signedIn || linked;
    if (content) content.hidden = !linked;
    if (!linked) return;
    renderCareer(payload.quests?.career || {});
    renderQuestList(dailyList, payload.quests?.daily, '[data-objectives-daily-empty]');
    renderQuestList(weeklyList, payload.quests?.weekly, '[data-objectives-weekly-empty]');
    renderHistory(payload.quests?.history);
    renderBounties(payload.bounties || {});
    renderContracts(payload.contracts || {});
    const dailyCount = panel.querySelector('[data-objectives-daily-count]'); if (dailyCount) dailyCount.textContent = `${payload.quests?.daily?.length || 0} quests`;
    const weeklyCount = panel.querySelector('[data-objectives-weekly-count]'); if (weeklyCount) weeklyCount.textContent = `${payload.quests?.weekly?.length || 0} quests`;
    const dailyReset = panel.querySelector('[data-objectives-daily-reset]'); if (dailyReset) dailyReset.textContent = `Resets in ${relative(payload.quests?.daily_resets_at)}`;
    const weeklyReset = panel.querySelector('[data-objectives-weekly-reset]'); if (weeklyReset) weeklyReset.textContent = `Resets in ${relative(payload.quests?.weekly_resets_at)}`;
  };

  const renderAdmin = (payload) => {
    adminData = payload;
    if (!payload || payload.status !== 'ok') return;
    const settings = payload.quest_settings || {};
    const enabled = panel.querySelector('[data-quest-enabled]'); if (enabled) enabled.checked = Boolean(settings.enabled);
    const daily = panel.querySelector('[data-quest-daily-count]'); if (daily) daily.value = String(settings.daily_count || 3);
    const weekly = panel.querySelector('[data-quest-weekly-count]'); if (weekly) weekly.value = String(settings.weekly_count || 5);
    const analytics = payload.quest_analytics || {};
    const setAdmin = (selector, value) => { const node = panel.querySelector(selector); if (node) node.textContent = String(value); };
    setAdmin('[data-quest-admin-survivors]', number(analytics.tracked_survivors));
    setAdmin('[data-quest-admin-lifetime]', number(analytics.assignments_lifetime));
    setAdmin('[data-quest-admin-current]', `${number(analytics.current_completed)} / ${number(analytics.current_assignments)}`);
    setAdmin('[data-quest-admin-claimable]', number(analytics.current_claimable));
    setAdmin('[data-quest-admin-rate]', `${Number(analytics.thirty_day_completion_rate || 0).toFixed(Number(analytics.thirty_day_completion_rate || 0) % 1 ? 1 : 0)}%`);
    setAdmin('[data-quest-admin-rewards]', `${money(analytics.claimable_reward_money)} + ${number(analytics.claimable_reward_xp)} XP`);
    if (!adminList) return;
    adminList.replaceChildren();

    const addHeading = (text) => {
      const heading = document.createElement('h4');
      heading.className = 'objective-subheading';
      heading.textContent = text;
      adminList.append(heading);
    };

    const activeBounties = (payload.bounties || []).filter((item) => item.status === 'active');
    addHeading('Active Bounties');
    if (!activeBounties.length) {
      const empty = document.createElement('p'); empty.className = 'empty-state'; empty.textContent = 'No active bounties.'; adminList.append(empty);
    }
    activeBounties.slice(0, 20).forEach((bounty) => {
      const card = document.createElement('article'); card.className = 'objective-card';
      const head = document.createElement('div'); head.className = 'objective-card-head';
      const title = document.createElement('h3'); title.textContent = `Bounty #${bounty.bounty_id} · ${bounty.target_psn}`;
      const reward = document.createElement('strong'); reward.textContent = money(bounty.amount);
      head.append(title, reward);
      const detail = document.createElement('p'); detail.textContent = `Placed by ${bounty.creator_psn} · expires in ${relative(bounty.expires_at)}`;
      const actions = document.createElement('div'); actions.className = 'objective-card-actions';
      actions.append(button('Admin Cancel & Refund', 'admin_cancel_bounty', bounty.bounty_id, 'danger-action compact-action'));
      card.append(head, detail, actions); adminList.append(card);
    });

    addHeading('Contracts');
    (payload.contracts || []).slice(0, 20).forEach((contract) => {
      const card = document.createElement('article'); card.className = 'objective-card';
      const head = document.createElement('div'); head.className = 'objective-card-head';
      const title = document.createElement('h3'); title.textContent = `Contract #${contract.contract_id} · ${contract.title}`;
      const state = document.createElement('span'); state.className = `objective-status ${contract.status || ''}`; state.textContent = contract.status || 'unknown';
      head.append(title, state);
      const detail = document.createElement('p'); detail.textContent = `${money(contract.reward)} · ${number(contract.claim_count)} claims · created by ${contract.created_by_name}`;
      const actions = document.createElement('div'); actions.className = 'objective-card-actions';
      if (contract.status === 'active') actions.append(button('Cancel Contract', 'admin_cancel_contract', contract.contract_id, 'danger-action compact-action'));
      card.append(head, detail, actions); adminList.append(card);
    });

    addHeading('Recent Objective Activity');
    (payload.recent_events || []).slice(0, 15).forEach((event) => {
      const row = document.createElement('div'); row.className = 'objective-history-item';
      const copy = document.createElement('div');
      const title = document.createElement('strong'); title.textContent = `${event.actor_name || 'System'} · ${event.target_label || 'Objectives'}`;
      const detail = document.createElement('small'); detail.textContent = `${String(event.event_type || '').replaceAll('_', ' ')} · ${event.details || ''}`;
      copy.append(title, detail);
      const state = document.createElement('span');
      const status = document.createElement('strong'); status.className = `objective-status ${String(event.result || '')}`; status.textContent = String(event.result || 'success');
      state.append(status); row.append(copy, state); adminList.append(row);
    });

    addHeading('Recent Quest Rotations');
    (payload.recent_quests || []).slice(0, 10).forEach((quest) => {
      const row = document.createElement('div'); row.className = 'objective-history-item';
      const copy = document.createElement('div');
      const title = document.createElement('strong'); title.textContent = `${quest.psn_id} · ${quest.title}`;
      const detail = document.createElement('small'); detail.textContent = `${String(quest.cadence || '').toUpperCase()} · ${new Date(quest.assigned_at).toLocaleString('en-AU')}`;
      copy.append(title, detail);
      const state = document.createElement('span');
      const status = document.createElement('strong'); status.className = `objective-status ${String(quest.status || '')}`; status.textContent = String(quest.status || '');
      state.append(status); row.append(copy, state); adminList.append(row);
    });
  };

  const loadMember = async ({ force = false } = {}) => {
    if (loaded && !force) return;
    const sessionToken = token();
    if (!sessionToken) {
      renderMember({ status: 'guest' });
      loaded = false;
      return;
    }

    // The dashboard header and Objectives workspace must use the same authenticated
    // session. Always pass the bearer token to Railway for private member data.
    if (guest) guest.hidden = true;
    try {
      const payload = await requestJson(ACCOUNT_OBJECTIVES_URL, {
        method: 'GET',
        headers: { Accept: 'application/json', Authorization: `Bearer ${sessionToken}` }
      });
      renderMember(payload);
      loaded = true;
      setMessage('');
    } catch (error) {
      loaded = false;
      if (error?.status === 401 || error?.status === 403) {
        renderMember({ status: 'guest' });
        setMessage('Your dashboard session expired. Sign in again to view Objectives.', 'error');
      } else {
        if (guest) guest.hidden = true;
        setMessage(error.message || 'Objectives could not be loaded.', 'error');
      }
    }
  };

  const loadAdmin = async ({ force = false } = {}) => {
    if (!hasAdmin() || (adminLoaded && !force)) return;
    const sessionToken = token();
    if (!sessionToken) return;
    try {
      const payload = await requestJson(ADMIN_OBJECTIVES_URL, {
        method: 'GET',
        headers: { Accept: 'application/json', Authorization: `Bearer ${sessionToken}` }
      });
      renderAdmin(payload);
      adminLoaded = true;
    } catch (error) {
      adminLoaded = false;
      setMessage(error.message || 'Objective administration could not be loaded.', 'error');
    }
  };

  const postMember = async (body) => requestJson(ACCOUNT_OBJECTIVES_ACTION_URL, {
    method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }, body: JSON.stringify(body)
  }, true);
  const postAdmin = async (body) => requestJson(ADMIN_OBJECTIVES_ACTION_URL, {
    method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }, body: JSON.stringify(body)
  }, true);

  panel.addEventListener('click', async (event) => {
    const trigger = event.target.closest('[data-objective-action]');
    if (!trigger || working) return;
    const action = trigger.dataset.objectiveAction;
    const id = Number(trigger.dataset.objectiveId || 0);
    working = true; trigger.disabled = true; setMessage(action === 'claim_all_quests' ? 'Claiming every completed quest reward…' : 'Processing objective action…');
    try {
      let result = null;
      if (action === 'claim_all_quests') result = await postMember({ action });
      else if (action === 'claim_quest') result = await postMember({ action, quest_id: id });
      else if (action === 'cancel_bounty') result = await postMember({ action, bounty_id: id });
      else if (action === 'accept_contract' || action === 'claim_contract') result = await postMember({ action, contract_id: id });
      else if (action === 'admin_cancel_contract') result = await postAdmin({ action: 'cancel_contract', contract_id: id });
      else if (action === 'admin_cancel_bounty') result = await postAdmin({ action: 'cancel_bounty', bounty_id: id });
      loaded = false; adminLoaded = false;
      await loadMember({ force: true }); await loadAdmin({ force: true });
      setMessage(result?.message || 'Objective action completed.', 'success');
    } catch (error) { setMessage(error.message || 'The objective action failed.', 'error'); }
    finally { working = false; trigger.disabled = false; }
  });

  bountyForm?.addEventListener('submit', async (event) => {
    event.preventDefault(); if (working) return;
    working = true; setMessage('Placing bounty…');
    try {
      await postMember({ action: 'create_bounty', target_psn: panel.querySelector('[data-bounty-target]')?.value || '', amount: Number(panel.querySelector('[data-bounty-amount]')?.value || 0) });
      bountyForm.reset(); loaded = false; adminLoaded = false; await loadMember({ force: true }); await loadAdmin({ force: true }); setMessage('Bounty placed and escrow funded.', 'success');
    } catch (error) { setMessage(error.message || 'The bounty could not be placed.', 'error'); }
    finally { working = false; }
  });

  contractForm?.addEventListener('submit', async (event) => {
    event.preventDefault(); if (working || !hasAdmin()) return;
    working = true; setMessage('Creating contract…');
    try {
      await postAdmin({ action: 'create_contract', title: panel.querySelector('[data-contract-title]')?.value || '', description: panel.querySelector('[data-contract-description]')?.value || '', contract_type: panel.querySelector('[data-contract-type]')?.value || '', target_count: Number(panel.querySelector('[data-contract-target]')?.value || 1), qualifier: panel.querySelector('[data-contract-qualifier]')?.value || '', reward: Number(panel.querySelector('[data-contract-reward]')?.value || 0), days: Number(panel.querySelector('[data-contract-days]')?.value || 14), max_claims: Number(panel.querySelector('[data-contract-max-claims]')?.value || 0) });
      contractForm.reset(); adminLoaded = false; loaded = false; await loadAdmin({ force: true }); await loadMember({ force: true }); setMessage('Contract created.', 'success');
    } catch (error) { setMessage(error.message || 'The contract could not be created.', 'error'); }
    finally { working = false; }
  });

  settingsForm?.addEventListener('submit', async (event) => {
    event.preventDefault(); if (working || !isOwner()) return;
    working = true; setMessage('Saving quest rotation…');
    try {
      await postAdmin({ action: 'quest_settings', enabled: Boolean(panel.querySelector('[data-quest-enabled]')?.checked), daily_count: Number(panel.querySelector('[data-quest-daily-count]')?.value || 3), weekly_count: Number(panel.querySelector('[data-quest-weekly-count]')?.value || 5) });
      adminLoaded = false; loaded = false; await loadAdmin({ force: true }); await loadMember({ force: true }); setMessage('Quest rotation settings saved.', 'success');
    } catch (error) { setMessage(error.message || 'Quest settings could not be saved.', 'error'); }
    finally { working = false; }
  });

  refreshButton?.addEventListener('click', async () => { loaded = false; adminLoaded = false; setMessage(''); await loadMember({ force: true }); await loadAdmin({ force: true }); });

  const activate = () => { loadMember(); loadAdmin(); };
  window.addEventListener('wwz:viewchange', (event) => { if (event.detail?.view === 'objectives') activate(); });
  window.addEventListener('wwz:authchange', () => { loaded = false; adminLoaded = false; if (panel.classList.contains('active')) activate(); });
  setInterval(() => {
    if (!memberData?.quests) return;
    const dailyReset = panel.querySelector('[data-objectives-daily-reset]'); if (dailyReset) dailyReset.textContent = `Resets in ${relative(memberData.quests.daily_resets_at)}`;
    const weeklyReset = panel.querySelector('[data-objectives-weekly-reset]'); if (weeklyReset) weeklyReset.textContent = `Resets in ${relative(memberData.quests.weekly_resets_at)}`;
  }, 30000);
  window.__wwzObjectivesReady = true;
  if (panel.classList.contains('active')) activate();
})();
