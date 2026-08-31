(() => {
  'use strict';
  if (window.__wwzLivoniaPvpReady) return;

  const root = document.querySelector('[data-livonia-pvp-root]');
  if (!root) return;
  const ENDPOINT = `${DASHBOARD_API_BASE}/api/livonia/pvp`;
  const status = root.querySelector('[data-livonia-pvp-status]');
  const hotspotList = root.querySelector('[data-livonia-hotspots]');
  const hotspotCount = root.querySelector('[data-livonia-hotspot-count]');
  const population = root.querySelector('[data-livonia-population]');
  const countdown = root.querySelector('[data-livonia-hotspot-countdown]');
  const nextHotspots = root.querySelector('[data-livonia-next-hotspots]');
  const objective = root.querySelector('[data-livonia-faction-objective]');
  const scoreboard = root.querySelector('[data-livonia-faction-scores]');
  const bounties = root.querySelector('[data-livonia-most-wanted]');
  const worldEvents = root.querySelector('[data-livonia-world-events]');
  const adminIntel = root.querySelector('[data-livonia-admin-intel]');
  const combatFlags = root.querySelector('[data-livonia-combat-flags]');
  const spawnFlags = root.querySelector('[data-livonia-spawn-flags]');
  const rewardXp = root.querySelector('[data-livonia-reward-xp]');
  const rewardMoney = root.querySelector('[data-livonia-reward-money]');
  const performance = root.querySelector('[data-livonia-performance]');
  const performanceDetail = root.querySelector('[data-livonia-performance-detail]');
  const periodTabs = root.querySelector('[data-livonia-period-tabs]');
  const leaderboard = root.querySelector('[data-livonia-leaderboard]');
  const records = root.querySelector('[data-livonia-records]');
  const weapons = root.querySelector('[data-livonia-weapons]');
  const heatSummary = root.querySelector('[data-livonia-heat-summary]');
  const factionMatchups = root.querySelector('[data-livonia-faction-matchups]');
  let timer = null;
  let countdownTimer = null;
  let active = false;
  let lastPayload = null;
  let period = 'day';

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const selectedServer = () => window.WWZServerContext?.getSelectedServer?.();
  const isLivonia = () => selectedServer()?.map_key === 'livonia';
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
    if (!isLivonia()) return;
    const headers = { Accept: 'application/json' };
    const token = sessionToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await authFetch(ENDPOINT, { headers, cache: 'no-store' });
    let payload = {};
    try { payload = await response.json(); } catch {}
    if (!response.ok) throw new Error(payload.message || `Livonia PvP request failed (${response.status}).`);
    render(payload);
  };

  const renderLeaderboard = () => {
    if (!leaderboard || !lastPayload) return;
    const rows = lastPayload.competition?.leaderboards?.[period] || [];
    leaderboard.innerHTML = rows.map((item, index) => `<div class="livonia-leader-row"><span class="livonia-rank">${index + 1}</span><strong>${escapeHtml(item.psn)}</strong><b>${Number(item.kills || 0)} K</b><span>${Number(item.deaths || 0)} D</span><span>${Number(item.kd || 0).toFixed(2)} K/D</span><small>${Number(item.hotspot_kills || 0)} hotspot · ${Number(item.objective_kills || 0)} objective · ${Number(item.most_wanted_kills || 0)} Most Wanted</small></div>`).join('') || '<p class="empty-state">No confirmed PvP kills have been recorded in this period yet.</p>';
  };

  const render = (payload) => {
    lastPayload = payload;
    if (rewardXp) rewardXp.textContent = `+${Number(payload.rewards?.hotspot_xp || 0)} XP`;
    if (rewardMoney) rewardMoney.textContent = `+$${Number(payload.rewards?.hotspot_currency || 0).toLocaleString()}`;

    const rotation = payload.hotspot_rotation || {};
    if (hotspotCount) hotspotCount.textContent = `${Number(rotation.active_count || (payload.hotspots || []).length)} active`;
    if (population) population.textContent = rotation.online_players === null || rotation.online_players === undefined ? 'Player count cache unavailable · safe 2-hotspot fallback' : `${Number(rotation.online_players)} players online`;
    if (countdown) countdown.textContent = fmtCountdown(rotation.ends_at);
    if (nextHotspots) nextHotspots.textContent = (rotation.next_hotspots || []).map((item) => item.name).join(' · ') || 'Next rotation will be selected automatically.';

    if (hotspotList) {
      hotspotList.innerHTML = (payload.hotspots || []).map((item) => `
        <article class="livonia-pvp-card"><span class="livonia-pvp-tag">ACTIVE HOTSPOT</span><strong>${escapeHtml(item.name)}</strong>
        <small>X ${Number(item.x).toFixed(0)} / Z ${Number(item.z).toFixed(0)} · ${Number(item.radius).toFixed(0)} m radius</small>
        <span>Rotates in <b>${escapeHtml(fmtCountdown(item.ends_at))}</b></span></article>`).join('') || '<p class="empty-state">No active hotspot data is available.</p>';
    }

    if (objective) {
      const item = payload.faction_objective;
      objective.innerHTML = item ? `<span class="livonia-pvp-tag">FACTION CONTROL</span><strong>${escapeHtml(item.name)}</strong><small>${Number(item.radius).toFixed(0)} m objective · ${Number(item.points_per_kill || 0)} points per PvP kill</small><span>Rotation ends ${escapeHtml(fmtTime(item.ends_at))}</span>` : '<p class="empty-state">No faction objective is active.</p>';
    }

    if (scoreboard) {
      scoreboard.innerHTML = (payload.faction_scores || []).map((item, index) => `<div class="livonia-score-row"><span>${index + 1}</span><i style="--faction-colour:${escapeHtml(item.colour || '#8F1D1D')}"></i><strong>${escapeHtml(item.name)}</strong><b>${Number(item.points || 0)} pts</b><small>${Number(item.kills || 0)} kills</small></div>`).join('') || '<p class="empty-state">No faction has scored in this rotation yet.</p>';
    }

    if (bounties) {
      bounties.innerHTML = (payload.most_wanted || []).map((item) => `<article class="livonia-wanted-card"><div><span class="livonia-pvp-tag danger">MOST WANTED</span><strong>${escapeHtml(item.target_psn)}</strong></div><b>$${Number(item.amount || 0).toLocaleString()}</b><small>Expires ${escapeHtml(fmtTime(item.expires_at))}</small></article>`).join('') || '<p class="empty-state">No automatic Most Wanted bounty is active.</p>';
    }

    if (worldEvents) {
      worldEvents.innerHTML = (payload.contested_objectives || []).map((item) => `<article class="livonia-event-card"><span>${escapeHtml(item.tier)}</span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.detail)}</small></article>`).join('');
    }

    renderLeaderboard();

    const recordData = payload.competition?.records || {};
    if (records) {
      const longest = recordData.longest_kill;
      const streak = recordData.best_streak;
      const hot = recordData.hottest_hotspot;
      records.innerHTML = `<div><span>Longest Kill</span><strong>${longest ? `${Number(longest.distance_metres || 0).toFixed(1)} m` : '—'}</strong><small>${longest ? `${escapeHtml(longest.killer_psn)} · ${escapeHtml(longest.weapon || 'Unknown')}` : 'No distance record yet'}</small></div><div><span>Best Streak</span><strong>${streak ? Number(streak.killer_streak || 0) : '—'}</strong><small>${streak ? escapeHtml(streak.killer_psn) : 'No streak record yet'}</small></div><div><span>Hottest Hotspot</span><strong>${hot ? escapeHtml(hot.hotspot_key) : '—'}</strong><small>${hot ? `${Number(hot.kills || 0)} confirmed kills` : 'No hotspot record yet'}</small></div>`;
    }

    if (weapons) {
      weapons.innerHTML = (payload.competition?.weapon_stats || []).map((item, index) => `<div class="livonia-stat-row"><span>${index + 1}</span><strong>${escapeHtml(item.weapon)}</strong><b>${Number(item.kills || 0)} kills</b><small>Longest ${Number(item.longest_kill || 0).toFixed(1)} m</small></div>`).join('') || '<p class="empty-state">No weapon statistics yet.</p>';
    }

    const heat = payload.competition?.heatmap?.day || [];
    if (heatSummary) {
      const total = heat.reduce((sum, item) => sum + Number(item.kills || 0), 0);
      const peak = heat[0];
      heatSummary.innerHTML = `<div><span>Confirmed kills</span><strong>${total}</strong><small>Last 24 hours with usable position data</small></div><div><span>Hottest grid</span><strong>${peak ? `${Number(peak.kills || 0)} kills` : '—'}</strong><small>${peak ? `X ${Number(peak.x).toFixed(0)} / Z ${Number(peak.z).toFixed(0)}` : 'No heatmap activity yet'}</small></div><div><span>Map layer</span><strong>PvP Heatmap</strong><small>Toggle separately on the Livonia collaborative map</small></div>`;
    }

    if (factionMatchups) {
      factionMatchups.innerHTML = (payload.competition?.faction_matchups || []).map((item) => `<div class="livonia-matchup-row"><strong>${escapeHtml(item.killer_faction_name || `Faction ${item.killer_faction_id}`)}</strong><span>→</span><strong>${escapeHtml(item.victim_faction_name || `Faction ${item.victim_faction_id}`)}</strong><b>${Number(item.kills || 0)}</b></div>`).join('') || '<p class="empty-state">No cross-faction PvP kills recorded in the last 30 days.</p>';
    }

    const perf = payload.performance || {};
    const fps = perf.server_fps || {};
    if (performance) performance.textContent = fps.available ? `${Number(fps.average || 0).toFixed(1)} avg FPS` : 'Telemetry pending';
    if (performanceDetail) performanceDetail.textContent = fps.available ? `Min ${Number(fps.minimum || 0).toFixed(1)} · Latest ${Number(fps.latest || 0).toFixed(1)} · ${Number(fps.samples || 0)} samples` : (fps.message || 'FPS telemetry appears automatically when DayZ emits it.');

    const flags = Array.isArray(payload.combat_log_flags) ? payload.combat_log_flags : null;
    const spawn = Array.isArray(payload.spawn_camp_flags) ? payload.spawn_camp_flags : null;
    if (adminIntel) adminIntel.hidden = flags === null && spawn === null;
    if (combatFlags && flags !== null) {
      combatFlags.innerHTML = flags.map((item) => `<div class="livonia-combat-row" data-severity="${escapeHtml(item.severity || 'low')}"><div><strong>${escapeHtml(item.player_psn)}</strong><small>${escapeHtml(String(item.severity || 'low').toUpperCase())} confidence · ${Number(item.recent_flags_in_view || 1)} recent flag(s)</small></div><span>${Number(item.seconds_since_combat || 0)}s after combat</span><small>${item.movement_metres === null || item.movement_metres === undefined ? 'Movement unavailable' : `${Number(item.movement_metres).toFixed(1)} m from last combat point`} · ${escapeHtml(fmtTime(item.detected_at))}</small></div>`).join('') || '<p class="empty-state">No recent possible combat-log flags.</p>';
    }
    if (spawnFlags && spawn !== null) {
      spawnFlags.innerHTML = spawn.map((item) => `<div class="livonia-combat-row"><div><strong>${escapeHtml(item.killer_psn)}</strong><small>${escapeHtml(item.spawn_area_name)}</small></div><span>${Number(item.kills_in_window || 0)} kills / ${Number(item.window_minutes || 0)}m</span><small>${escapeHtml(fmtTime(item.detected_at))}</small></div>`).join('') || '<p class="empty-state">No possible spawn-camping patterns detected.</p>';
    }
    setStatus(`Livonia PvP intelligence refreshed ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}.`, 'success');
  };

  const refreshCountdown = () => {
    if (!active || !lastPayload) return;
    const endsAt = lastPayload.hotspot_rotation?.ends_at;
    if (countdown) countdown.textContent = fmtCountdown(endsAt);
  };
  const refresh = async () => {
    if (!active || !isLivonia()) return;
    try { await fetchSnapshot(); } catch (error) { setStatus(error.message || 'Livonia PvP intelligence is unavailable.', 'error'); }
  };
  const schedule = () => {
    window.clearTimeout(timer);
    window.clearInterval(countdownTimer);
    if (!active || !isLivonia()) return;
    countdownTimer = window.setInterval(refreshCountdown, 1000);
    timer = window.setTimeout(async () => { await refresh(); schedule(); }, 30_000);
  };
  const activate = async () => { active = true; await refresh(); schedule(); };
  const deactivate = () => { active = false; window.clearTimeout(timer); window.clearInterval(countdownTimer); timer = null; countdownTimer = null; };

  periodTabs?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-livonia-period]');
    if (!button) return;
    period = button.dataset.livoniaPeriod || 'day';
    periodTabs.querySelectorAll('[data-livonia-period]').forEach((item) => item.classList.toggle('is-active', item === button));
    renderLeaderboard();
  });
  window.addEventListener('wwz:viewchange', (event) => {
    if (event.detail?.view === 'livoniapvp') activate(); else deactivate();
  });
  window.addEventListener('wwz:serverchange', () => {
    if (!isLivonia()) deactivate();
  });

  window.WWZLivoniaPvp = Object.freeze({ activate, deactivate, refresh });
  window.__wwzLivoniaPvpReady = true;
})();
