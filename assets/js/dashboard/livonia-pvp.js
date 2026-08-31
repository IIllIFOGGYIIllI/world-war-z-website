(() => {
  'use strict';
  if (window.__wwzLivoniaPvpReady) return;

  const root = document.querySelector('[data-livonia-pvp-root]');
  if (!root) return;
  const ENDPOINT = `${DASHBOARD_API_BASE}/api/livonia/pvp`;
  const status = root.querySelector('[data-livonia-pvp-status]');
  const hotspotList = root.querySelector('[data-livonia-hotspots]');
  const objective = root.querySelector('[data-livonia-faction-objective]');
  const scoreboard = root.querySelector('[data-livonia-faction-scores]');
  const bounties = root.querySelector('[data-livonia-most-wanted]');
  const worldEvents = root.querySelector('[data-livonia-world-events]');
  const combatWrap = root.querySelector('[data-livonia-combat-wrap]');
  const combatFlags = root.querySelector('[data-livonia-combat-flags]');
  const rewardXp = root.querySelector('[data-livonia-reward-xp]');
  const rewardMoney = root.querySelector('[data-livonia-reward-money]');
  let timer = null;
  let active = false;

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const selectedServer = () => window.WWZServerContext?.getSelectedServer?.();
  const isLivonia = () => selectedServer()?.map_key === 'livonia';
  const sessionToken = () => { try { return storageGet(AUTH_SESSION_KEY) || ''; } catch { return ''; } };
  const fmtTime = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
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

  const render = (payload) => {
    if (rewardXp) rewardXp.textContent = `+${Number(payload.rewards?.hotspot_xp || 0)} XP`;
    if (rewardMoney) rewardMoney.textContent = `+$${Number(payload.rewards?.hotspot_currency || 0).toLocaleString()}`;

    if (hotspotList) {
      hotspotList.innerHTML = (payload.hotspots || []).map((item) => `
        <article class="livonia-pvp-card"><span class="livonia-pvp-tag">ACTIVE HOTSPOT</span><strong>${escapeHtml(item.name)}</strong>
        <small>X ${Number(item.x).toFixed(0)} / Z ${Number(item.z).toFixed(0)} · ${Number(item.radius).toFixed(0)} m radius</small>
        <span>Rotates ${escapeHtml(fmtTime(item.ends_at))}</span></article>`).join('') || '<p class="empty-state">No active hotspot data is available.</p>';
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

    const flags = Array.isArray(payload.combat_log_flags) ? payload.combat_log_flags : null;
    if (combatWrap) combatWrap.hidden = flags === null;
    if (combatFlags && flags !== null) {
      combatFlags.innerHTML = flags.map((item) => `<div class="livonia-combat-row"><strong>${escapeHtml(item.player_psn)}</strong><span>${Number(item.seconds_since_combat || 0)}s after combat</span><small>${escapeHtml(fmtTime(item.detected_at))}</small></div>`).join('') || '<p class="empty-state">No recent possible combat-log flags.</p>';
    }
    setStatus(`Livonia PvP intelligence refreshed ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}.`, 'success');
  };

  const refresh = async () => {
    if (!active || !isLivonia()) return;
    try { await fetchSnapshot(); } catch (error) { setStatus(error.message || 'Livonia PvP intelligence is unavailable.', 'error'); }
  };
  const schedule = () => {
    window.clearTimeout(timer);
    if (!active || !isLivonia()) return;
    timer = window.setTimeout(async () => { await refresh(); schedule(); }, 45_000);
  };
  const activate = async () => { active = true; await refresh(); schedule(); };
  const deactivate = () => { active = false; window.clearTimeout(timer); timer = null; };

  window.addEventListener('wwz:viewchange', (event) => {
    if (event.detail?.view === 'livoniapvp') activate(); else deactivate();
  });
  window.addEventListener('wwz:serverchange', () => {
    if (!isLivonia()) deactivate();
  });

  window.WWZLivoniaPvp = Object.freeze({ activate, deactivate, refresh });
  window.__wwzLivoniaPvpReady = true;
})();
