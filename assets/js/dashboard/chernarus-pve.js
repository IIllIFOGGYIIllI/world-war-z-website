(() => {
  'use strict';
  if (window.__wwzChernarusPveReady) return;

  const root = document.querySelector('[data-chernarus-pve-root]');
  if (!root) return;
  const ENDPOINT = `${DASHBOARD_API_BASE}/api/chernarus/pve`;
  const status = root.querySelector('[data-chernarus-pve-status]');
  const expeditionList = root.querySelector('[data-chernarus-expeditions]');
  const expeditionCount = root.querySelector('[data-chernarus-expedition-count]');
  const population = root.querySelector('[data-chernarus-population]');
  const countdown = root.querySelector('[data-chernarus-countdown]');
  const nextExpeditions = root.querySelector('[data-chernarus-next-expeditions]');
  const rewardXp = root.querySelector('[data-chernarus-reward-xp]');
  const rewardMoney = root.querySelector('[data-chernarus-reward-money]');
  const performance = root.querySelector('[data-chernarus-performance]');
  const performanceDetail = root.querySelector('[data-chernarus-performance-detail]');
  const goal = root.querySelector('[data-chernarus-community-goal]');
  const activity = root.querySelector('[data-chernarus-activity]');
  const periodTabs = root.querySelector('[data-chernarus-period-tabs]');
  const leaderboard = root.querySelector('[data-chernarus-leaderboard]');
  const records = root.querySelector('[data-chernarus-records]');
  const objectiveStats = root.querySelector('[data-chernarus-objective-stats]');
  const factionStandings = root.querySelector('[data-chernarus-faction-standings]');
  const heatSummary = root.querySelector('[data-chernarus-heat-summary]');
  const recentActivity = root.querySelector('[data-chernarus-recent-activity]');
  const catalogue = root.querySelector('[data-chernarus-catalogue]');
  let timer = null;
  let countdownTimer = null;
  let active = false;
  let lastPayload = null;
  let period = 'day';

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const selectedServer = () => window.WWZServerContext?.getSelectedServer?.();
  const isChernarus = () => selectedServer()?.map_key === 'chernarus';
  const sessionToken = () => { try { return storageGet(AUTH_SESSION_KEY) || ''; } catch { return ''; } };
  const fmtTime = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };
  const fmtCountdown = (value) => {
    const end = new Date(value).getTime();
    if (!Number.isFinite(end)) return '—';
    const seconds = Math.max(0, Math.floor((end - Date.now()) / 1000));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hours > 0 ? `${hours}h ${String(minutes).padStart(2,'0')}m` : `${minutes}m ${String(secs).padStart(2,'0')}s`;
  };
  const setStatus = (message = '', tone = '') => {
    if (!status) return;
    status.hidden = !message;
    status.textContent = message;
    status.dataset.tone = tone;
  };

  const fetchSnapshot = async () => {
    if (!isChernarus()) return;
    const headers = { Accept: 'application/json' };
    const token = sessionToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await authFetch(ENDPOINT, { headers, cache: 'no-store' });
    let payload = {};
    try { payload = await response.json(); } catch {}
    if (!response.ok) throw new Error(payload.message || `Chernarus PvE request failed (${response.status}).`);
    render(payload);
  };

  const renderLeaderboard = () => {
    if (!leaderboard || !lastPayload) return;
    const rows = lastPayload.competition?.leaderboards?.[period] || [];
    leaderboard.innerHTML = rows.map((item, index) => `<div class="chernarus-leader-row"><span class="chernarus-rank">${index + 1}</span><strong>${escapeHtml(item.psn)}</strong><b>${Number(item.points || 0)} pts</b><span>${Number(item.visits || 0)} visits</span><span>${Number(item.checkins || 0)} check-ins</span><small>${Number(item.objectives || 0)} expedition locations covered</small></div>`).join('') || '<p class="empty-state">No periodic expedition participation has been recorded in this period yet.</p>';
  };

  const render = (payload) => {
    lastPayload = payload;
    const rotation = payload.rotation || {};
    if (expeditionCount) expeditionCount.textContent = `${Number(rotation.active_count || (payload.expeditions || []).length)} active`;
    if (population) population.textContent = rotation.online_players === null || rotation.online_players === undefined ? 'Player count cache unavailable · safe 1-expedition fallback' : `${Number(rotation.online_players)} players online`;
    if (countdown) countdown.textContent = fmtCountdown(rotation.ends_at);
    if (nextExpeditions) nextExpeditions.textContent = (rotation.next_expeditions || []).map((item) => item.name).join(' · ') || 'Next expedition will be selected automatically.';
    if (rewardXp) rewardXp.textContent = `+${Number(payload.rewards?.first_visit_xp || 0)} XP`;
    if (rewardMoney) rewardMoney.textContent = `+$${Number(payload.rewards?.first_visit_currency || 0).toLocaleString()}`;

    if (expeditionList) {
      expeditionList.innerHTML = (payload.expeditions || []).map((item) => `<article class="chernarus-pve-card"><span class="chernarus-pve-tag ${String(item.tier || '').toLowerCase() === 'endgame' ? 'endgame' : ''}">${escapeHtml(item.tier || 'PVE')} EXPEDITION</span><strong>${escapeHtml(item.name)}</strong><small>X ${Number(item.x).toFixed(0)} / Z ${Number(item.z).toFixed(0)} · ${Number(item.radius).toFixed(0)} m radius</small><span>${escapeHtml(item.detail || '')}</span><small>Rotates in ${escapeHtml(fmtCountdown(item.ends_at))}</small></article>`).join('') || '<p class="empty-state">No active expedition data is available.</p>';
    }

    const community = payload.community_goal || {};
    if (goal) {
      goal.dataset.complete = String(Boolean(community.completed));
      goal.innerHTML = `<div class="chernarus-goal-head"><div><span class="chernarus-pve-tag">WEEKLY COMMUNITY GOAL</span><strong>${escapeHtml(community.name || 'Community Goal')}</strong><small>${escapeHtml(community.detail || '')}</small></div><b>${Number(community.percent || 0).toFixed(1)}%</b></div><div class="chernarus-goal-progress" style="--goal-progress:${Math.max(0, Math.min(100, Number(community.percent || 0)))}%"><i></i></div><div class="chernarus-goal-meta"><span>${Number(community.progress || 0).toLocaleString()} / ${Number(community.target || 0).toLocaleString()}</span><span>${community.completed ? 'Complete' : `${Number(community.remaining || 0).toLocaleString()} remaining`} · resets ${escapeHtml(fmtTime(community.ends_at))}</span></div>`;
    }

    const day = payload.activity?.day || {};
    const week = payload.activity?.week || {};
    if (activity) {
      activity.innerHTML = `<div class="chernarus-stat-row"><span>1</span><strong>24-hour participation</strong><b>${Number(day.visits || 0)} visits</b><small>${Number(day.participants || 0)} survivors · ${Number(day.checkins || 0)} periodic check-ins · ${Number(day.pve_deaths || 0)} PvE deaths</small></div><div class="chernarus-stat-row"><span>2</span><strong>7-day participation</strong><b>${Number(week.visits || 0)} visits</b><small>${Number(week.participants || 0)} survivors · ${Number(week.objectives || 0)} expedition locations · ${Number(week.pve_deaths || 0)} PvE deaths</small></div>`;
    }

    renderLeaderboard();

    const recordData = payload.competition?.records || {};
    const all = recordData.all_time_champion;
    const season = recordData.season_champion;
    const explorer = recordData.season_explorer;
    if (records) {
      records.innerHTML = `<div><span>All-Time Participant</span><strong>${all ? escapeHtml(all.psn) : '—'}</strong><small>${all ? `${Number(all.points || 0)} points · ${Number(all.visits || 0)} visits` : 'No record yet'}</small></div><div><span>${escapeHtml(payload.competition?.season?.name || 'Current Season')}</span><strong>${season ? escapeHtml(season.psn) : '—'}</strong><small>${season ? `${Number(season.points || 0)} points · ${Number(season.objectives || 0)} locations covered` : 'No seasonal record yet'}</small></div><div><span>Season Explorer</span><strong>${explorer ? escapeHtml(explorer.psn) : '—'}</strong><small>${explorer ? `${Number(explorer.visits || 0)} expedition visits this season` : 'No exploration record yet'}</small></div>`;
    }

    if (objectiveStats) {
      objectiveStats.innerHTML = (payload.competition?.objective_stats || []).map((item, index) => `<div class="chernarus-stat-row"><span>${index + 1}</span><strong>${escapeHtml(item.objective_name || item.objective_key)}</strong><b>${Number(item.visits || 0)} visits</b><small>${Number(item.participants || 0)} survivors · ${Number(item.checkins || 0)} check-ins · last 30 days</small></div>`).join('') || '<p class="empty-state">No expedition-area participation has been recorded yet.</p>';
    }

    if (factionStandings) {
      const factions = payload.competition?.faction_standings || [];
      factionStandings.innerHTML = factions.map((item, index) => `<div class="chernarus-stat-row"><span>${index + 1}</span><strong>${escapeHtml(item.faction_name || `Faction #${item.faction_id}`)}</strong><b>${Number(item.points || 0)} pts</b><small>${Number(item.visits || 0)} expedition visits · ${Number(item.checkins || 0)} check-ins · ${Number(item.participants || 0)} survivors · current season</small></div>`).join('') || '<p class="empty-state">No faction-attributed expedition participation has been recorded this season yet.</p>';
    }

    const heat = payload.competition?.heatmap?.day || [];
    if (heatSummary) {
      const total = heat.reduce((sum, item) => sum + Number(item.checkins || 0), 0);
      const peak = heat[0];
      heatSummary.innerHTML = `<div><span>Periodic check-ins</span><strong>${total}</strong><small>Last 24 hours inside active expeditions</small></div><div><span>Most active grid</span><strong>${peak ? `${Number(peak.checkins || 0)} check-ins` : '—'}</strong><small>${peak ? `${Number(peak.participants || 0)} survivors · X ${Number(peak.x).toFixed(0)} / Z ${Number(peak.z).toFixed(0)}` : 'No activity yet'}</small></div><div><span>Telemetry source</span><strong>Console ADM positions</strong><small>No NPC-kill inference is used</small></div>`;
    }

    if (recentActivity) {
      const checkins = (payload.recent_activity || []).map((item) => `<div class="chernarus-activity-row"><div><span class="chernarus-type">CHECK-IN</span><strong>${escapeHtml(item.player_psn || 'Survivor')}</strong></div><b>${escapeHtml(item.objective_name || 'Expedition')}</b><small>${item.faction_name ? `${escapeHtml(item.faction_name)} · ` : ''}${escapeHtml(fmtTime(item.recorded_at))}</small></div>`);
      const deaths = (payload.recent_pve_deaths || []).map((item) => `<div class="chernarus-activity-row"><div><span class="chernarus-type">PVE DEATH</span><strong>${escapeHtml(item.player_psn || 'Survivor')}</strong></div><b>${escapeHtml(String(item.death_type || 'pve_death').replaceAll('_', ' '))}</b><small>${item.faction_name ? `${escapeHtml(item.faction_name)} · ` : ''}${escapeHtml(fmtTime(item.recorded_at))}</small></div>`);
      recentActivity.innerHTML = [...checkins, ...deaths].slice(0, 20).join('') || '<p class="empty-state">No recent expedition participation or PvE deaths have been recorded.</p>';
    }

    if (catalogue) {
      catalogue.innerHTML = (payload.catalogue || []).map((item) => `<article class="chernarus-pve-card"><span class="chernarus-pve-tag ${String(item.tier || '').toLowerCase() === 'endgame' ? 'endgame' : ''}">${escapeHtml(item.tier || 'PVE')}</span><strong>${escapeHtml(item.name)}</strong><small>${Number(item.radius || 0).toFixed(0)} m objective radius</small><span>${escapeHtml(item.detail || '')}</span></article>`).join('');
    }

    const fps = payload.performance?.server_fps || {};
    if (performance) performance.textContent = Number(fps.samples || 0) > 0 ? `${Number(fps.average_fps || 0).toFixed(1)} avg FPS` : 'Telemetry pending';
    if (performanceDetail) performanceDetail.textContent = Number(fps.samples || 0) > 0 ? `Min ${Number(fps.minimum_fps || 0).toFixed(1)} · Max ${Number(fps.maximum_fps || 0).toFixed(1)} · ${Number(fps.samples || 0)} samples` : 'FPS telemetry appears automatically when DayZ emits it.';
    setStatus(`Chernarus PvE participation refreshed ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}.`, 'success');
  };

  const refreshCountdown = () => {
    if (!active || !lastPayload) return;
    if (countdown) countdown.textContent = fmtCountdown(lastPayload.rotation?.ends_at);
  };
  const refresh = async () => {
    if (!active || !isChernarus()) return;
    try { await fetchSnapshot(); } catch (error) { setStatus(error.message || 'Chernarus PvE intelligence is unavailable.', 'error'); }
  };
  const schedule = () => {
    window.clearTimeout(timer);
    window.clearInterval(countdownTimer);
    if (!active || !isChernarus()) return;
    countdownTimer = window.setInterval(refreshCountdown, 1000);
    timer = window.setTimeout(async () => { await refresh(); schedule(); }, 30_000);
  };
  const activate = async () => { active = true; await refresh(); schedule(); };
  const deactivate = () => { active = false; window.clearTimeout(timer); window.clearInterval(countdownTimer); timer = null; countdownTimer = null; };

  periodTabs?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-chernarus-period]');
    if (!button) return;
    period = button.dataset.chernarusPeriod || 'day';
    periodTabs.querySelectorAll('[data-chernarus-period]').forEach((item) => item.classList.toggle('is-active', item === button));
    renderLeaderboard();
  });
  window.addEventListener('wwz:viewchange', (event) => {
    if (event.detail?.view === 'chernaruspve') activate(); else deactivate();
  });
  window.addEventListener('wwz:serverchange', () => {
    if (!isChernarus()) deactivate();
  });

  window.WWZChernarusPve = Object.freeze({ activate, deactivate, refresh });
  window.__wwzChernarusPveReady = true;
})();
