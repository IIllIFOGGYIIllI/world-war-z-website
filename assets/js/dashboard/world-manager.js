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
  let scanBusy = false;
  let scanAvailable = false;
  let lastSavedJobId = 0;
  const scanButton = find('[data-world-role-scan]');
  const scanTarget = find('[data-world-role-target]');
  const scanStatus = find('[data-world-role-scan-status]');
  const scanHistory = find('[data-world-role-job-history]');
  const memberForm = find('[data-world-member-form]');
  const memberInput = find('[data-world-member-id]');
  const memberResult = find('[data-world-member-preview]');
  const memberError = find('[data-world-member-error]');
  const memberSubmit = find('[data-world-member-submit]');

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
    const branding = payload.world_branding || {};
    const brandedPrimary = branding.primary || {};
    const brandingLive = find('[data-world-branding-current]');
    const brandingPreview = find('[data-world-branding-preview]');
    if (brandingLive) brandingLive.textContent = `Primary world: ${brandedPrimary.world_name || 'Chernarus'} · Secondary world: Livonia`;
    if (brandingPreview) brandingPreview.textContent = `Badlands name preview: ${branding.badlands_preview?.server_name || 'World War Z | Badlands'} (staging only; no activation)`;
    const inventory = payload.managed_messages || {};
    const inventoryPanel = find('[data-world-managed-messages]');
    if (inventoryPanel) {
      inventoryPanel.hidden = payload.primary !== true;
      const summary = find('[data-world-managed-message-summary]');
      const refreshLocked = inventory.refresh_execution_enabled !== true;
      // No execute control exists even if an API incorrectly claims readiness.
      if (summary) summary.textContent = `${cleanCount(inventory.tracked_messages ?? 0)} tracked message(s) · ${cleanCount(inventory.audit_entries ?? 0)} registry audit entry/entries · ${refreshLocked ? 'Refresh locked' : 'Preview only'}`;
      const itemsRoot = find('[data-world-managed-message-items]');
      if (itemsRoot) {
        itemsRoot.replaceChildren();
        (Array.isArray(inventory.items) ? inventory.items : []).forEach((item) => {
          const card = element('div','world-managed-message');
          card.append(element('strong','',String(item.surface_key || 'Unknown managed surface')));
          card.append(element('small','',`Channel ${item.channel_id || '—'} · Message ${item.message_id || '—'}`));
          card.append(element('small','',`World ${item.world_key || '—'} · Last registered ${item.updated_at || '—'}`));
          itemsRoot.append(card);
        });
        if (!itemsRoot.children.length) itemsRoot.append(element('p','world-muted','No Bot-owned messages have been recorded yet. Existing panels remain untouched until their next verified publication.'));
      }
      const safety = find('[data-world-managed-message-safety]');
      if (safety) safety.textContent = 'Preview only: no Discord edits, channel changes, migration execution or historical message rewriting. Fresh author and permission verification is required before a future refresh.';
    }
    const primary = payload.primary === true;
    find('[data-world-mode]').textContent = primary ? `Primary server · ${brandedPrimary.world_name || 'Chernarus'} live` : 'Independent server · Livonia';
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
    if (memberForm) memberForm.hidden = !primary;
    if (!primary) {
      find('[data-world-coverage-summary]').textContent = 'Livonia is independent; no Badlands migration scheduled.';
      checksRoot.append(element('p','world-muted','World Profiles migration preparation applies to the Chernarus primary server only. Livonia is unchanged.'));
      find('[data-world-role-preview]').hidden = true;
      find('[data-world-member-panel]').hidden = true;
      return;
    }
    find('[data-world-member-panel]').hidden = false;
    const route = payload.routing_capabilities || {};
    find('[data-world-routing-summary]').textContent = route.write_gateway_available === true
      ? (route.write_gateway_producers_integrated === true
        ? 'Four XP/wallet reward producers are now guarded by live server/world identity. Remaining gameplay, banking, shops, workers and activation stay blocked.'
        : 'Guarded XP/prestige and wallet/bank write adapters built. Existing gameplay commands/workers and world activation remain locked.')
      : route.member_progression_reads === 'world_scoped_preview'
      ? 'Read-only XP and wallet/bank routing available. Gameplay writes and world activation remain locked.'
      : 'Awaiting world-aware account read adapter.';
    const memberCompare = payload.member_route_preview;
    if (memberResult) {
      memberResult.replaceChildren();
      memberResult.hidden = !memberCompare;
      if (memberCompare) {
        for (const world of ['chernarus','badlands']) {
          const data=memberCompare[world] || {};
          const card=element('div','world-profile-card');
          card.append(element('strong','',world === 'chernarus' ? 'Chernarus · Preserved' : 'Badlands · Staging'));
          const info=element('div','world-profile-stats');
          [['Level',data.level],['XP',data.current_xp],['Prestige',data.prestige],['Wallet',data.wallet],['Bank',data.bank_balance]].forEach(([label,value])=>{
            const cell=element('div');cell.append(element('span','',label),element('strong','',cleanCount(value)));info.append(cell);
          });
          card.append(info,element('small','world-muted',data.member_exists?'Existing world record':'No account row · fresh-start defaults only'));
          memberResult.append(card);
        }
      }
    }
    if (memberError) memberError.hidden=true;
    const coverage = payload.domain_coverage || {};
    const domains = Array.isArray(coverage.domains) ? coverage.domains : [];
    find('[data-world-coverage-summary]').textContent = `${domains.filter(item => item.status === 'transactional_stage').length} transactional staging domains · ${domains.filter(item => item.production_routed).length} live integrations · ${domains.length} tracked domains`;
    domains.forEach(item => {
      const node = element('div','world-domain');
      node.dataset.stage = item.status === 'transactional_stage' ? 'transactional' : 'pending';
      const label = element('strong','',item.label || item.key);
      const status = element('span','world-domain-state',item.production_routed ? 'Production ready' : item.write_adapter ? 'Guarded write gateway · producers pending' : item.preview_routed ? 'Read-only routing + staging' : item.status === 'transactional_stage' ? 'Transactional staging' : item.status === 'schema_stage' ? 'Schema only' : 'Dry run only');
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
    const renderRolePlan = (target,plan) => {
      if (!target) return;
      target.replaceChildren();
      [['Affected members',plan.affected_members],['Role removals',plan.roles_to_remove],['Role additions',plan.roles_to_add]].forEach(([label,value]) => {
        const stat=element('div','world-role-plan-stat');
        stat.append(element('span','',label),element('strong','',cleanCount(value)));
        target.append(stat);
      });
    };
    renderRolePlan(find('[data-world-badlands-plan]'),role.badlands || {});
    renderRolePlan(find('[data-world-chernarus-rollback]'),role.chernarus_rollback || {});
    find('[data-world-role-bindings]').textContent = `${cleanCount(role.safe_managed_role_ids)} safe role bindings · ${cleanCount(role.excluded_role_bindings)} excluded · ${cleanCount(role.missing_role_bindings)} missing · ${cleanCount(role.hierarchy_blocked_bindings)} hierarchy blocked`;
    const roleWarnings=find('[data-world-role-warnings]');
    roleWarnings.replaceChildren();
    (Array.isArray(role.warnings)?role.warnings:[]).forEach(message=>roleWarnings.append(element('li','',message)));
    const roleSync = payload.role_sync || {};
    const savedJobs = Array.isArray(roleSync.jobs) ? roleSync.jobs : [];
    scanAvailable = roleSync.roster_scan_available === true;
    lastSavedJobId = savedJobs.reduce((latest, job) => Math.max(latest, Number(job.job_id) || 0), 0);
    if (scanHistory) {
      scanHistory.replaceChildren();
      const makeRecord = (job) => {
        const record=element('div', 'world-role-job-entry');
        record.append(element('strong','',`Dry run #${job.job_id} · ${job.target_world} · ${job.status}`));
        record.append(element('small','',`${cleanCount(job.scanned_members)} scanned · ${cleanCount(job.pending_changes)} planned member changes · ${job.created_at || 'Date unavailable'}`));
        return record;
      };
      if (savedJobs.length) {
        scanHistory.append(makeRecord(savedJobs[0]));
        if (savedJobs.length > 1) {
          const older=element('details', 'world-role-job-older');
          older.append(element('summary','',`Show ${savedJobs.length - 1} earlier dry runs`));
          savedJobs.slice(1).forEach(job => older.append(makeRecord(job)));
          scanHistory.append(older);
        }
      } else scanHistory.append(element('p','world-muted','No saved full-guild scans yet.'));
    }
    if (scanStatus && !scanBusy) {
      scanStatus.textContent = savedJobs.length
        ? `Latest saved dry run #${savedJobs[0].job_id}: ${cleanCount(savedJobs[0].scanned_members)} members scanned, ${cleanCount(savedJobs[0].pending_changes)} planned changes. No roles changed.`
        : (scanAvailable ? 'No full-roster dry runs saved yet.' : 'Full-roster scanning is currently unavailable.');
    }
    if (scanButton) scanButton.disabled = scanBusy || !scanAvailable;
    find('[data-world-cache-warning]').textContent=role.member_cache_complete
      ? 'The cached guild roster appears complete; this remains read-only and requires a fresh full-member scan before activation.'
      : 'Member cache may be incomplete. A real migration requires a full fetch and persistent retries.';
    find('[data-world-pending]').textContent = Object.values(payload.pending_transactions || {}).some(v => v == null)
      ? 'Delivery state cannot be fully verified from current tables.'
      : `${Object.values(payload.pending_transactions || {}).reduce((sum,v)=>sum+Math.max(0,Number(v)||0),0)} unresolved delivery/rental records`;
    if (warning) warning.hidden=true;
  };
  const load = async (memberId = '') => {
    const token=typeof storageGet==='function'?storageGet(AUTH_SESSION_KEY):'';
    if (!token || loading || (typeof hasServerActionAccess === 'function' && !hasServerActionAccess())) return;
    loading=true; if(refresh) refresh.disabled=true; if(memberSubmit) memberSubmit.disabled=true;
    try {
      const memberQuery = memberId ? `?discord_id=${encodeURIComponent(memberId)}` : '';
      const response=await authFetch(`${DASHBOARD_API_BASE}/api/admin/world-profiles${memberQuery}`,{method:'GET', headers:{Accept:'application/json', Authorization:`Bearer ${token}`}});
      const payload=await response.json().catch(()=>({}));
      if (response.status===401 || response.status===403) {
        storageRemove(AUTH_SESSION_KEY);applySignedOutState();return;
      }
      if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Readiness unavailable');
      render(payload);
      find('[data-world-updated]').textContent=`Checked ${new Date().toLocaleTimeString()}`;
      return payload;
    } catch (error) {
      if(warning){warning.hidden=false;warning.textContent=String(error?.message||'World Manager unavailable');}
      if(memberError && memberId){memberError.hidden=false;memberError.textContent=String(error?.message||'Comparison unavailable');}
      find('[data-world-updated]').textContent='Readiness unavailable';
      return null;
    } finally {loading=false;if(refresh) refresh.disabled=false;if(memberSubmit) memberSubmit.disabled=false;}
  };
  scanButton?.addEventListener('click',async ()=>{
    const token=typeof storageGet==='function'?storageGet(AUTH_SESSION_KEY):'';
    if (!token || scanBusy || (typeof hasServerActionAccess==='function' && !hasServerActionAccess())) return;
    scanBusy=true;
    scanButton.disabled=true;
    const target=String(scanTarget?.value || 'badlands');
    const priorJobId = lastSavedJobId;
    if (scanStatus) scanStatus.textContent='Fetching complete Discord roster and staging read-only plan… Please wait.';
    try {
      const response=await authFetch(`${DASHBOARD_API_BASE}/api/admin/world-profiles/role-dry-run`,{
        method:'POST',headers:{Accept:'application/json',Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
        body:JSON.stringify({action:'stage_dry_run',target_world:target}),
      });
      const result=await response.json().catch(()=>({}));
      if (response.status===401 || response.status===403) {
        storageRemove(AUTH_SESSION_KEY);applySignedOutState();return;
      }
      if (!response.ok || result.status!=='ok') throw new Error(result.message||`Full-roster request returned HTTP ${response.status}.`);
      const saved = await load();
      if (scanStatus) scanStatus.textContent = result.reused
        ? `Identical role plan already saved as dry run #${result.job_id}. No duplicate created and no roles changed.`
        : `Dry run #${result.job_id} saved: ${cleanCount(result.scanned_members)} scanned, ${cleanCount(result.affected_members)} affected. No roles changed.`;
      if (!saved && scanStatus) scanStatus.textContent += ' Refresh to review job history.';
    } catch(error) {
      // Railway/edge timeouts can occur after the Bot already committed a plan.
      // Refresh the read-only history before claiming the scan did not persist.
      const refreshed = await load();
      if (scanStatus) scanStatus.textContent = lastSavedJobId > priorJobId
        ? `Dry run #${lastSavedJobId} was saved despite a connection interruption. No roles changed.`
        : `${String(error?.message || 'Full roster scan request failed.')} ${refreshed ? 'No new job was confirmed.' : 'Check saved history before retrying.'}`;
    } finally {
      scanBusy=false;
      if (scanButton) scanButton.disabled = !scanAvailable;
    }
  });
  refresh?.addEventListener('click',()=>load());
  memberForm?.addEventListener('submit',(event)=>{
    event.preventDefault();
    const value = String(memberInput?.value || '').trim();
    if(!/^[0-9]{15,22}$/.test(value)){
      if(memberError){memberError.hidden=false;memberError.textContent='Enter a valid Discord user ID (15–22 digits).';}
      return;
    }
    load(value);
  });
  const activate=({view='',section=''}={})=> {if(view==='staff'&&section==='world-manager') load();};
  window.addEventListener('wwz:viewchange',(event)=>activate(event.detail||{}));
  window.WWZWorldManager=Object.freeze({activate,refresh:load});
  window.__wwzWorldManagerReady=true;
})();
