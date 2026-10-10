(() => {
  'use strict';
  const root = document.querySelector('[data-dashboard-section="world-manager"]');
  if (!root) { window.__wwzWorldManagerReady = true; return; }
  const find = (query) => root.querySelector(query);
  const profilesRoot = find('[data-world-profiles]');
  const checksRoot = find('[data-world-checks]');
  const warning = find('[data-world-error]');
  const domainsRoot = find('[data-world-domains]');
  const refresh = find('[data-world-refresh]');
  const cleanCount = (value) => value == null ? 'Not available' : Number(value).toLocaleString();
  let loading = false;
  const element = (tag, className, value) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = String(value);
    return node;
  };
  const render = (payload) => {
    profilesRoot.replaceChildren();
    checksRoot.replaceChildren();
    domainsRoot.replaceChildren();
    const primary = payload.primary === true;
    find('[data-world-mode]').textContent = primary ? 'Primary server · Chernarus live' : 'Independent server · Livonia';
    find('[data-world-activation]').textContent = 'Activation locked — preparation only';
    find('[data-world-notice]').textContent = String(payload.message || 'No activation in this version.');
    (Array.isArray(payload.profiles) ? payload.profiles : []).forEach((profile) => {
      const card = element('article', 'world-profile-card');
      const head = element('div','world-profile-head');
      head.append(element('h3','',profile.name || profile.key));
      const status = element('span','world-profile-status',profile.lifecycle || 'unknown');
      status.dataset.state = profile.lifecycle === 'active' ? 'active' : 'staging';
      head.append(status);
      card.append(head, element('p','',profile.notes || (profile.isolated ? 'Independent server. No Badlands migration planned.' : '')));
      if (profile.key === 'badlands') {
        const stats = element('div','world-profile-stats');
        [['Starting level', profile.level_start], ['Starting XP', profile.xp_start], ['Prestige', profile.prestige_start], ['Staged members', profile.staged_members]].forEach(([label,value])=> {
          const item=element('div');item.append(element('span','',label),element('strong','',cleanCount(value)));stats.append(item);
        });
        card.append(stats);
        card.append(element('small','world-muted','Fresh wallets, bank balances, factions, quests, rankings and claims are planned; no live records are reset.'));
      }
      if (profile.key === 'chernarus' && profile.live_legacy_counts) {
        const stats = element('div','world-profile-stats');
        [['XP records',profile.live_legacy_counts.progression_members],['Economy accounts',profile.live_legacy_counts.economy_accounts],['Factions',profile.live_legacy_counts.factions],['Faction members',profile.live_legacy_counts.faction_members]].forEach(([label,value]) => {
          const item=element('div');item.append(element('span','',label),element('strong','',cleanCount(value)));stats.append(item);
        });
        card.append(stats);
      }
      profilesRoot.append(card);
    });
    if (!primary) {
      find('[data-world-coverage-summary]').textContent = 'Livonia is independent; no Badlands migration scheduled.';
      checksRoot.append(element('p','world-muted','World Profiles migration preparation applies to the Chernarus primary server only. Livonia is unchanged.'));
      find('[data-world-role-preview]').hidden = true;
      return;
    }
    const coverage = payload.domain_coverage || {};
    const domains = Array.isArray(coverage.domains) ? coverage.domains : [];
    find('[data-world-coverage-summary]').textContent = `${domains.filter(item => item.status === 'transactional_stage').length} transactional staging domains · ${domains.filter(item => item.production_routed).length} live integrations · ${domains.length} tracked domains`;
    domains.forEach(item => {
      const node = element('div','world-domain');
      node.dataset.stage = item.status === 'transactional_stage' ? 'transactional' : 'pending';
      const label = element('strong','',item.label || item.key);
      const status = element('span','world-domain-state',item.production_routed ? 'Production ready' : item.status === 'transactional_stage' ? 'Transactional staging' : item.status === 'schema_stage' ? 'Schema only' : 'Dry run only');
      node.append(label,status);domainsRoot.append(node);
    });
    (Array.isArray(payload.checks) ? payload.checks : []).forEach((check)=> {
      const item=element('li','world-check');
      item.dataset.state=check.state==='ready'?'ready':'blocked';
      item.append(element('span','world-check-icon',check.state==='ready'?'✓':'!'));
      const body=element('div');body.append(element('strong','',check.label),element('small','',check.detail));item.append(body);checksRoot.append(item);
    });
    const role=payload.role_preview || {};
    const rolePanel=find('[data-world-role-preview]');rolePanel.hidden=false;
    find('[data-world-member-count]').textContent=cleanCount(role.cached_human_members);
    find('[data-world-role-count]').textContent=cleanCount(role.affected_cached_members);
    find('[data-world-role-removals]').textContent=cleanCount(role.roles_to_remove_from_cached_members);
    find('[data-world-cache-warning]').textContent=role.member_cache_complete
      ? 'Current guild member cache appears complete; this remains a dry run.'
      : 'Member cache may be incomplete. A real migration requires a full fetch and persistent retries.';
    find('[data-world-pending]').textContent = Object.values(payload.pending_transactions || {}).some(v => v == null)
      ? 'Delivery state cannot be fully verified from current tables.'
      : `${Object.values(payload.pending_transactions || {}).reduce((sum,v)=>sum+Math.max(0,Number(v)||0),0)} unresolved delivery/rental records`;
    if (warning) warning.hidden=true;
  };
  const load = async () => {
    const token=typeof storageGet==='function'?storageGet(AUTH_SESSION_KEY):'';
    if (!token || loading || (typeof hasServerActionAccess === 'function' && !hasServerActionAccess())) return;
    loading=true; if(refresh) refresh.disabled=true;
    try {
      const response=await authFetch(`${DASHBOARD_API_BASE}/api/admin/world-profiles`,{method:'GET', headers:{Accept:'application/json', Authorization:`Bearer ${token}`}});
      const payload=await response.json().catch(()=>({}));
      if (response.status===401 || response.status===403) {
        storageRemove(AUTH_SESSION_KEY);applySignedOutState();return;
      }
      if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Readiness unavailable');
      render(payload);
      find('[data-world-updated]').textContent=`Checked ${new Date().toLocaleTimeString()}`;
    } catch (error) {
      if(warning){warning.hidden=false;warning.textContent=String(error?.message||'World Manager unavailable');}
      find('[data-world-updated]').textContent='Readiness unavailable';
    } finally {loading=false;if(refresh) refresh.disabled=false;}
  };
  refresh?.addEventListener('click',load);
  const activate=({view='',section=''}={})=> {if(view==='staff'&&section==='world-manager') load();};
  window.addEventListener('wwz:viewchange',(event)=>activate(event.detail||{}));
  window.WWZWorldManager=Object.freeze({activate,refresh:load});
  window.__wwzWorldManagerReady=true;
})();
