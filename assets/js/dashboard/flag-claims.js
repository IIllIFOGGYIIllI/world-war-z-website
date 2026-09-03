(() => {
  'use strict';
  const ACCOUNT_URL = `${DASHBOARD_API_BASE}/api/account/flags`;
  const ACCOUNT_ACTION_URL = `${DASHBOARD_API_BASE}/api/account/flags/action`;
  const ADMIN_URL = `${DASHBOARD_API_BASE}/api/admin/flags`;
  const ADMIN_ACTION_URL = `${DASHBOARD_API_BASE}/api/admin/flags/action`;
  const root = document.querySelector('[data-flag-claims]');
  if (!root) return;

  const q = (selector) => root.querySelector(selector);
  const catalogueHost = q('[data-flag-catalogue]');
  const searchInput = q('[data-flag-search]');
  const summaryHost = q('[data-flag-summary]');
  const myClaimsHost = q('[data-my-flag-claims]');
  const myPendingHost = q('[data-my-flag-pending]');
  const myTransfersHost = q('[data-my-flag-transfers]');
  const requestForm = q('[data-flag-request-form]');
  const requestSelect = q('[data-flag-request-select]');
  const claimantInput = q('[data-flag-claimant-name]');
  const factionLink = q('[data-flag-faction-link]');
  const useFaction = q('[data-flag-use-faction]');
  const factionName = q('[data-flag-faction-name]');
  const message = q('[data-flag-message]');
  const refreshButton = q('[data-flag-refresh]');
  const adminRoot = q('[data-flag-admin]');
  const pendingHost = q('[data-flag-admin-pending]');
  const transfersHost = q('[data-flag-admin-transfers]');
  const activeHost = q('[data-flag-admin-active]');
  const recentHost = q('[data-flag-admin-recent]');
  const historyHost = q('[data-flag-admin-history]');
  const historySearch = q('[data-flag-history-search]');
  const historyAction = q('[data-flag-history-action]');
  const historyFlag = q('[data-flag-history-flag]');
  const ownerFilter = q('[data-flag-owner-filter]');
  const reviewChannel = q('[data-flag-review-channel]');
  const publicChannel = q('[data-flag-public-channel]');
  const notificationChannel = q('[data-flag-notification-channel]');
  const notificationsEnabled = q('[data-flag-notifications-enabled]');
  const inactivityDays = q('[data-flag-inactivity-days]');
  const saveChannelsButton = q('[data-flag-save-channels]');
  const saveActivityButton = q('[data-flag-save-activity]');
  const publishButton = q('[data-flag-publish]');
  const unpublishButton = q('[data-flag-unpublish]');
  const assignForm = q('[data-flag-assign-form]');
  const assignFlag = q('[data-flag-assign-select]');
  const assignName = q('[data-flag-assign-name]');
  const assignFaction = q('[data-flag-assign-faction]');
  const adminStateNote = q('[data-flag-admin-state]');
  const adminSpecialFlag = q('[data-flag-admin-special]');
  const adminSpecialLabel = q('[data-flag-admin-label]');
  const nonRaidableSpecialFlag = q('[data-flag-nonraidable-special]');
  const nonRaidableSlots = q('[data-flag-nonraidable-slots]');
  const saveSpecialsButton = q('[data-flag-save-specials]');
  const wipeClaimsButton = q('[data-flag-wipe]');

  let loading = false;
  let account = { flags: [], mine: { claims: [], pending: [], transfer_requests: [] }, server: {}, member_faction: null };
  let admin = null;

  const token = () => storageGet(AUTH_SESSION_KEY);
  const isStaff = () => ['staff', 'owner'].includes(dashboardAccessLevel);
  const showMessage = (text = '', tone = 'error') => {
    if (!message) return;
    message.hidden = !text;
    message.textContent = text;
    message.dataset.tone = tone;
  };
  const formatDate = (value) => value ? (typeof formatAccountDate === 'function' ? formatAccountDate(value) : new Date(value).toLocaleString()) : 'Unknown';
  const makeButton = (label, tone = 'secondary-action') => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `${tone} compact-action`;
    button.textContent = label;
    return button;
  };
  const emptyNote = (text) => { const p = document.createElement('p'); p.className = 'table-note'; p.textContent = text; return p; };
  const initials = (name) => String(name || 'FLAG').replace(/\([^)]*\)/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'F';
  const DAYZ_FLAG_IMAGE_BASE = 'https://dayz-store.ru/wp-content/uploads/images/large';
  const DAYZ_FLAG_IMAGE_CLASSES = Object.freeze({
    altis:'Flag_Altis',apa:'Flag_APA','baby-deer':'Flag_BabyDeer',bear:'Flag_Bear','bohemia-interactive':'Flag_Bohemia',brainz:'Flag_BrainZ',cannibals:'Flag_Cannibals',cdf:'Flag_CDF',chedaki:'Flag_Chedaki',chel:'Flag_CHEL',chernarus:'Flag_Chernarus',cmc:'Flag_CMC',crook:'Flag_Crook',dayz:'Flag_DayZ',hunterz:'Flag_HunterZ','livonia-army':'Flag_LivoniaArmy','livonia-police':'Flag_LivoniaPolice',livonia:'Flag_Livonia',napa:'Flag_NAPA','north-sahrani':'Flag_NSahrani',pirates:'Flag_Pirates','radio-zenit':'Flag_Zenit',refuge:'Flag_Refuge',rex:'Flag_Rex',rooster:'Flag_Rooster',rsta:'Flag_RSTA',sakhal:'Flag_Sakhal',snake:'Flag_Snake','south-sahrani':'Flag_SSahrani',tec:'Flag_TEC',uec:'Flag_UEC','white-surrender':'Flag_White',wolf:'Flag_Wolf',zagorky:'Flag_Zagorky'
  });
  const flagImageUrl = (item) => `${DAYZ_FLAG_IMAGE_BASE}/${encodeURIComponent(DAYZ_FLAG_IMAGE_CLASSES[String(item?.image_key || item?.key || '').toLowerCase()] || 'Flag_White')}.png`;
  const makeFlagVisual = (item) => {
    const visual = document.createElement('div'); visual.className = 'flag-claim-card-visual';
    const fallback = document.createElement('span'); fallback.className = 'flag-claim-card-fallback'; fallback.textContent = initials(item.name); fallback.hidden = true;
    const image = document.createElement('img'); image.loading = 'lazy'; image.decoding = 'async'; image.referrerPolicy = 'no-referrer'; image.alt = `${item.name} artwork`; image.src = flagImageUrl(item);
    image.addEventListener('error', () => { image.hidden = true; fallback.hidden = false; }, { once: true });
    visual.append(image, fallback); return visual;
  };
  const statusInfo = (item) => item.reserved ? ['reserved', 'Reserved'] : item.status === 'available' ? ['available', 'Available'] : item.status === 'partial' ? ['partial', `${item.claimed_count}/${item.capacity} claimed`] : ['claimed', 'Claimed'];

  const actionRequest = async (url, payload) => {
    const session = token();
    if (!session) throw new Error('Sign in with Discord to continue.');
    const response = await authFetch(url, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${session}` }, body: JSON.stringify(payload) });
    const body = await response.json().catch(() => ({}));
    if (typeof handleAdminPlayerAuthorizationResponse === 'function' && handleAdminPlayerAuthorizationResponse(response, body, { actionRequest: true })) return null;
    if (!response.ok || body.status !== 'ok') throw new Error(body.message || 'Flag claim action failed.');
    return body;
  };

  const renderSummary = () => {
    if (!summaryHost) return;
    summaryHost.replaceChildren();
    const s = admin?.summary || { total: account.flags.length, available: account.flags.filter((x) => x.status === 'available').length, claimed: account.flags.filter((x) => Number(x.claimed_count) > 0).length, pending: account.mine?.pending?.length || 0, stale: 0, transfers_pending: account.mine?.transfer_requests?.length || 0 };
    [['Flags', s.total ?? 0], ['Available', s.available ?? 0], ['In Use', s.claimed ?? 0], ['Pending Claims', s.pending ?? 0], ['Pending Transfers', s.transfers_pending ?? 0], ['Inactive Review', s.stale ?? 0]].forEach(([label, value]) => {
      const card = document.createElement('div'); card.className = 'flag-claims-stat';
      const span = document.createElement('span'); span.textContent = label;
      const strong = document.createElement('strong'); strong.textContent = value;
      card.append(span, strong); summaryHost.append(card);
    });
  };

  const renderCatalogue = () => {
    if (!catalogueHost) return;
    const needle = String(searchInput?.value || '').trim().toLowerCase();
    catalogueHost.replaceChildren();
    account.flags.filter((item) => !needle || String(item.name).toLowerCase().includes(needle)).forEach((item) => {
      const card = document.createElement('article'); card.className = 'flag-claim-card';
      const copy = document.createElement('div'); copy.className = 'flag-claim-card-copy';
      const heading = document.createElement('h3'); heading.textContent = item.name;
      const [tone, label] = statusInfo(item); const badge = document.createElement('span'); badge.className = `flag-claim-status ${tone}`; badge.textContent = label;
      const owners = document.createElement('p'); owners.className = 'flag-claim-owner';
      const claims = item.claims || [];
      owners.textContent = claims.length ? claims.map((claim) => claim.faction_name ? `${claim.claimant_name} · faction` : claim.claimant_name).join(' · ') : (item.reserved ? item.reserved_label || 'WWZ Admin Team' : `${item.remaining} slot${item.remaining === 1 ? '' : 's'} available`);
      copy.append(heading, badge, owners);
      if (item.special) { const special = document.createElement('p'); special.className = 'flag-claim-special'; special.textContent = item.special; copy.append(special); }
      if (!item.reserved && Number(item.remaining || 0) > 0) {
        const actions = document.createElement('div'); actions.className = 'flag-card-actions';
        const request = makeButton('Request', 'primary-action');
        request.addEventListener('click', () => { if (requestSelect) requestSelect.value = String(item.key || ''); requestForm?.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => claimantInput?.focus(), 200); });
        actions.append(request); copy.append(actions);
      }
      card.append(makeFlagVisual(item), copy); catalogueHost.append(card);
    });
  };

  const fillFlagSelect = (select, { availableOnly = false, blankLabel = 'Select a flag…' } = {}) => {
    if (!select) return;
    const current = select.value; select.replaceChildren();
    const blank = document.createElement('option'); blank.value = ''; blank.textContent = blankLabel; select.append(blank);
    account.flags.forEach((item) => {
      if (availableOnly && (item.reserved || Number(item.remaining) <= 0)) return;
      const option = document.createElement('option'); option.value = item.key; option.textContent = `${item.name}${item.capacity > 1 ? ` (${item.remaining} left)` : ''}`; select.append(option);
    });
    if ([...select.options].some((option) => option.value === current)) select.value = current;
  };

  const renderFactionLink = () => {
    const faction = account.member_faction;
    if (!factionLink) return;
    factionLink.hidden = !faction;
    if (factionName) factionName.textContent = faction?.name || '';
    if (!faction && useFaction) useFaction.checked = false;
  };

  const renderMine = () => {
    fillFlagSelect(requestSelect, { availableOnly: true });
    renderFactionLink();
    if (myClaimsHost) {
      myClaimsHost.replaceChildren();
      (account.mine?.claims || []).forEach((claim) => {
        const row = document.createElement('div'); row.className = 'flag-claim-row';
        const strong = document.createElement('strong'); strong.textContent = claim.flag_name || claim.flag_key;
        const small = document.createElement('small'); small.textContent = `${claim.claimant_name}${claim.faction_name ? ` · ${claim.faction_name}` : ''}`;
        const actions = document.createElement('div'); actions.className = 'flag-claim-row-actions';
        const transfer = makeButton('Request Transfer');
        transfer.addEventListener('click', () => {
          const name = prompt(`Transfer ${claim.flag_name || claim.flag_key} to which player/group?`, '') ?? '';
          if (!name.trim()) return;
          runMemberAction({ action: 'transfer_request', flag_key: claim.flag_key, new_claimant_name: name.trim() });
        });
        if (account.member_faction) {
          const factionButton = makeButton('Transfer To My Faction');
          factionButton.addEventListener('click', () => runMemberAction({ action: 'transfer_request', flag_key: claim.flag_key, new_claimant_name: account.member_faction.name, faction_id: account.member_faction.id }));
          actions.append(factionButton);
        }
        const release = makeButton('Release', 'secondary-action');
        release.addEventListener('click', () => { if (confirm(`Release ${claim.flag_name || claim.flag_key}?`)) runMemberAction({ action: 'release', flag_key: claim.flag_key }); });
        actions.append(transfer, release); row.append(strong, small, actions); myClaimsHost.append(row);
      });
      if (!(account.mine?.claims || []).length) myClaimsHost.append(emptyNote('No active flag claim.'));
    }
    if (myPendingHost) {
      myPendingHost.replaceChildren();
      (account.mine?.pending || []).forEach((request) => {
        const row = document.createElement('div'); row.className = 'flag-claim-row';
        const strong = document.createElement('strong'); strong.textContent = `#${request.id} · ${request.flag_name || request.flag_key}`;
        const small = document.createElement('small'); small.textContent = request.claimant_name;
        const cancel = makeButton('Cancel'); cancel.addEventListener('click', () => runMemberAction({ action: 'cancel', request_id: request.id }));
        row.append(strong, small, cancel); myPendingHost.append(row);
      });
      if (!(account.mine?.pending || []).length) myPendingHost.append(emptyNote('No pending claim request.'));
    }
    if (myTransfersHost) {
      myTransfersHost.replaceChildren();
      (account.mine?.transfer_requests || []).forEach((transfer) => {
        const row = document.createElement('div'); row.className = 'flag-claim-row';
        const strong = document.createElement('strong'); strong.textContent = `#${transfer.id} · ${transfer.flag_name || transfer.flag_key}`;
        const small = document.createElement('small'); small.textContent = `${transfer.current_claimant_name} → ${transfer.new_claimant_name}`;
        const cancel = makeButton('Cancel'); cancel.addEventListener('click', () => runMemberAction({ action: 'transfer_cancel', transfer_id: transfer.id }));
        row.append(strong, small, cancel); myTransfersHost.append(row);
      });
      if (!(account.mine?.transfer_requests || []).length) myTransfersHost.append(emptyNote('No pending transfer request.'));
    }
  };

  const fillChannelSelect = (select, current, blankLabel) => {
    if (!select || !admin) return;
    select.replaceChildren(); const blank = document.createElement('option'); blank.value = ''; blank.textContent = blankLabel; select.append(blank);
    (admin.channels || []).forEach((channel) => { const option = document.createElement('option'); option.value = channel.key; option.textContent = `${channel.category ? `${channel.category} / ` : ''}#${channel.name}${channel.can_publish ? '' : ' (permissions missing)'}`; option.disabled = !channel.can_publish; select.append(option); });
    select.value = current || '';
  };
  const fillFactionSelect = () => {
    if (!assignFaction || !admin) return;
    assignFaction.replaceChildren(); const blank = document.createElement('option'); blank.value = ''; blank.textContent = 'No faction link'; assignFaction.append(blank);
    (admin.factions || []).forEach((faction) => { const option = document.createElement('option'); option.value = String(faction.id); option.textContent = `${faction.name} (${faction.member_count || 0})`; assignFaction.append(option); });
  };
  const fillSpecialFlagSelect = (select, selected, blankLabel) => { fillFlagSelect(select, { blankLabel }); if (select) select.value = selected || ''; };

  const renderPending = () => {
    if (!pendingHost) return;
    pendingHost.replaceChildren();
    (admin.pending || []).forEach((request) => {
      const row = document.createElement('div'); row.className = 'flag-claim-row';
      const strong = document.createElement('strong'); strong.textContent = `#${request.id} · ${request.flag_name || request.flag_key}`;
      const small = document.createElement('small'); small.textContent = `${request.claimant_name}${request.faction_name ? ` · faction ${request.faction_name}` : ''} · requested by ${request.requester_name}`;
      const actions = document.createElement('div'); actions.className = 'flag-claim-row-actions';
      const approve = makeButton('Approve', 'primary-action'); approve.addEventListener('click', () => runAdminAction({ action: 'approve', request_id: request.id }));
      const reject = makeButton('Reject'); reject.addEventListener('click', () => { const reason = prompt('Optional rejection reason:', '') ?? null; if (reason !== null) runAdminAction({ action: 'reject', request_id: request.id, reason }); });
      actions.append(approve, reject); row.append(strong, small, actions); pendingHost.append(row);
    });
    if (!(admin.pending || []).length) pendingHost.append(emptyNote('No requests awaiting review.'));
  };

  const renderTransfers = () => {
    if (!transfersHost) return;
    transfersHost.replaceChildren();
    (admin.transfers || []).forEach((transfer) => {
      const row = document.createElement('div'); row.className = 'flag-claim-row';
      const strong = document.createElement('strong'); strong.textContent = `#${transfer.id} · ${transfer.flag_name || transfer.flag_key}`;
      const small = document.createElement('small'); small.textContent = `${transfer.current_claimant_name} → ${transfer.new_claimant_name} · ${transfer.requester_name}`;
      const actions = document.createElement('div'); actions.className = 'flag-claim-row-actions';
      const approve = makeButton('Approve', 'primary-action'); approve.addEventListener('click', () => runAdminAction({ action: 'transfer_review', transfer_id: transfer.id, approve: true }));
      const reject = makeButton('Reject'); reject.addEventListener('click', () => { const reason = prompt('Optional transfer rejection reason:', '') ?? null; if (reason !== null) runAdminAction({ action: 'transfer_review', transfer_id: transfer.id, approve: false, reason }); });
      actions.append(approve, reject); row.append(strong, small, actions); transfersHost.append(row);
    });
    if (!(admin.transfers || []).length) transfersHost.append(emptyNote('No transfers awaiting review.'));
  };

  const activeRows = () => {
    const rows = [];
    (admin?.flags || []).forEach((flag) => (flag.claims || []).forEach((claim) => rows.push({ flag, claim })));
    const filter = ownerFilter?.value || 'all';
    return rows.filter(({ claim }) => filter === 'all' || (filter === 'stale' && claim.is_stale) || (filter === 'faction' && claim.faction_id));
  };
  const renderActive = () => {
    if (!activeHost) return;
    activeHost.replaceChildren();
    activeRows().forEach(({ flag, claim }) => {
      const row = document.createElement('div'); row.className = `flag-claim-row${claim.is_stale ? ' stale' : ''}`;
      const strong = document.createElement('strong'); strong.textContent = `${flag.name} · ${claim.claimant_name}`;
      const meta = document.createElement('small');
      const bits = [];
      if (claim.faction_name) bits.push(`Faction: ${claim.faction_name}`);
      if (claim.last_seen_at) bits.push(`Last seen ${formatDate(claim.last_seen_at)}`);
      if (claim.inactive_days != null) bits.push(`${claim.inactive_days} inactive day(s)`);
      if (claim.is_stale) bits.push('REVIEW INACTIVE');
      meta.textContent = bits.join(' · ') || 'No linked activity data';
      const note = document.createElement('small'); note.className = 'flag-admin-note'; note.textContent = claim.admin_note ? `Private note: ${claim.admin_note}` : 'No private Admin note';
      const actions = document.createElement('div'); actions.className = 'flag-claim-row-actions';
      const noteButton = makeButton(claim.admin_note ? 'Edit Note' : 'Add Note');
      noteButton.addEventListener('click', () => { const value = prompt('Private Admin note (leave blank to remove):', claim.admin_note || '') ?? null; if (value !== null) runAdminAction({ action: 'note', flag_key: flag.key, claimant_name: claim.claimant_name, note: value }); });
      const transfer = makeButton('Transfer'); transfer.addEventListener('click', () => { const name = prompt(`Transfer ${flag.name} from ${claim.claimant_name} to:`, '') ?? ''; if (name.trim()) runAdminAction({ action: 'transfer', flag_key: flag.key, current_claimant: claim.claimant_name, new_claimant_name: name.trim() }); });
      const revoke = makeButton('Revoke', 'secondary-action'); revoke.addEventListener('click', () => { if (!confirm(`Revoke ${flag.name} from ${claim.claimant_name}?`)) return; const reason = prompt('Revocation reason:', claim.is_stale ? 'Inactive claim review' : 'Revoked by staff') ?? null; if (reason !== null) runAdminAction({ action: 'revoke', flag_key: flag.key, claimant_name: claim.claimant_name, reason }); });
      actions.append(noteButton, transfer, revoke); row.append(strong, meta, note, actions); activeHost.append(row);
    });
    if (!activeRows().length) activeHost.append(emptyNote(ownerFilter?.value === 'stale' ? 'No claims currently exceed the inactivity threshold.' : 'No active flag claims match this filter.'));
  };

  const renderRecent = () => {
    if (!recentHost) return; recentHost.replaceChildren();
    (admin.recent_activity || []).slice(0, 8).forEach((event) => {
      const row = document.createElement('div'); row.className = 'flag-claim-row compact';
      const strong = document.createElement('strong'); strong.textContent = `${String(event.action || '').replace(/_/g, ' ')}${event.flag_name ? ` · ${event.flag_name}` : ''}`;
      const small = document.createElement('small'); small.textContent = `${event.actor_name || 'System'} · ${formatDate(event.created_at)}`;
      row.append(strong, small); recentHost.append(row);
    });
    if (!(admin.recent_activity || []).length) recentHost.append(emptyNote('No recent flag activity.'));
  };

  const renderHistoryFilters = () => {
    if (!historyAction || !historyFlag) return;
    const currentAction = historyAction.value || 'all'; const currentFlag = historyFlag.value || 'all';
    const actions = [...new Set((admin.history || []).map((event) => String(event.action || '')).filter(Boolean))].sort();
    historyAction.replaceChildren(new Option('All actions', 'all'), ...actions.map((action) => new Option(action.replace(/_/g, ' '), action)));
    historyFlag.replaceChildren(new Option('All flags', 'all'), ...(admin.flags || []).map((flag) => new Option(flag.name, flag.key)));
    if ([...historyAction.options].some((option) => option.value === currentAction)) historyAction.value = currentAction;
    if ([...historyFlag.options].some((option) => option.value === currentFlag)) historyFlag.value = currentFlag;
  };
  const renderHistory = () => {
    if (!historyHost || !admin) return;
    renderHistoryFilters();
    const needle = String(historySearch?.value || '').trim().toLowerCase();
    const wantedAction = historyAction?.value || 'all'; const wantedFlag = historyFlag?.value || 'all';
    const rows = (admin.history || []).filter((event) => {
      if (wantedAction !== 'all' && event.action !== wantedAction) return false;
      if (wantedFlag !== 'all' && event.flag_key !== wantedFlag) return false;
      if (!needle) return true;
      return JSON.stringify(event).toLowerCase().includes(needle);
    });
    historyHost.replaceChildren();
    rows.slice(0, 120).forEach((event) => {
      const row = document.createElement('div'); row.className = 'flag-claim-row';
      const strong = document.createElement('strong'); strong.textContent = `${String(event.action || '').replace(/_/g, ' ')}${event.flag_name ? ` · ${event.flag_name}` : ''}`;
      const details = event.details || {}; const extra = details.from && details.to ? `${details.from} → ${details.to}` : details.claimant_name || details.reason || details.to || '';
      const small = document.createElement('small'); small.textContent = `${event.actor_name || 'System'} · ${formatDate(event.created_at)}${extra ? ` · ${extra}` : ''}`;
      row.append(strong, small); historyHost.append(row);
    });
    if (!rows.length) historyHost.append(emptyNote('No history matches the current filters.'));
  };

  const renderConfig = () => {
    fillChannelSelect(reviewChannel, admin.config?.review_channel_key, 'Not configured');
    fillChannelSelect(publicChannel, admin.config?.public_channel_key, 'Not configured');
    fillChannelSelect(notificationChannel, admin.config?.notification_channel_key, 'No notification channel');
    if (notificationsEnabled) notificationsEnabled.checked = Boolean(admin.config?.notifications_enabled ?? true);
    if (inactivityDays) inactivityDays.value = String(admin.config?.inactivity_days || 30);
    if (adminStateNote) adminStateNote.textContent = `${admin.config?.published_message_count || 0} WWZ flag panel message(s) currently tracked.`;
    fillSpecialFlagSelect(adminSpecialFlag, admin.config?.admin_flag_key, 'No Admin flag');
    fillSpecialFlagSelect(nonRaidableSpecialFlag, admin.config?.non_raidable_flag_key, 'No non-raidable flag');
    if (adminSpecialLabel) adminSpecialLabel.value = admin.config?.admin_flag_label || 'WWZ Admin Team';
    if (nonRaidableSlots) nonRaidableSlots.value = String(admin.config?.non_raidable_capacity || 5);
    fillFlagSelect(assignFlag, { availableOnly: true }); fillFactionSelect();
  };

  const renderAdmin = () => {
    if (!adminRoot) return;
    adminRoot.hidden = !isStaff();
    if (!isStaff() || !admin) return;
    renderPending(); renderTransfers(); renderActive(); renderRecent(); renderHistory(); renderConfig();
  };
  const render = () => { renderSummary(); renderCatalogue(); renderMine(); renderAdmin(); };

  const load = async () => {
    const session = token(); if (!session || loading) return false;
    loading = true; refreshButton?.setAttribute('disabled', ''); showMessage('');
    try {
      const response = await authFetch(ACCOUNT_URL, { headers: { Accept: 'application/json', Authorization: `Bearer ${session}` } });
      const payload = await response.json().catch(() => ({}));
      if (typeof handleAdminPlayerAuthorizationResponse === 'function' && handleAdminPlayerAuthorizationResponse(response, payload, { actionRequest: false })) return false;
      if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Flag claims unavailable.');
      account = payload;
      admin = null;
      if (isStaff()) {
        const adminResponse = await authFetch(ADMIN_URL, { headers: { Accept: 'application/json', Authorization: `Bearer ${session}` } });
        const adminPayload = await adminResponse.json().catch(() => ({}));
        if (adminResponse.ok && adminPayload.status === 'ok') admin = adminPayload;
      }
      render(); return true;
    } catch (error) { showMessage(error instanceof Error ? error.message : 'Flag claims are temporarily unavailable.', 'error'); return false; }
    finally { loading = false; refreshButton?.removeAttribute('disabled'); }
  };
  const runMemberAction = async (payload) => { if (loading) return; loading = true; showMessage(''); try { const result = await actionRequest(ACCOUNT_ACTION_URL, payload); if (!result) return; loading = false; await load(); showMessage(result.message || 'Flag claim updated.', 'success'); } catch (error) { showMessage(error instanceof Error ? error.message : 'Flag claim action failed.', 'error'); } finally { loading = false; } };
  const runAdminAction = async (payload) => { if (loading || !isStaff()) return; loading = true; showMessage(''); try { const result = await actionRequest(ADMIN_ACTION_URL, payload); if (!result) return; loading = false; await load(); showMessage(result.message || 'Flag administration updated.', 'success'); } catch (error) { showMessage(error instanceof Error ? error.message : 'Flag administration action failed.', 'error'); } finally { loading = false; } };

  requestForm?.addEventListener('submit', (event) => {
    event.preventDefault(); if (!requestSelect?.value) { showMessage('Select a flag first.'); return; }
    const faction = useFaction?.checked ? account.member_faction : null;
    runMemberAction({ action: 'request', flag_key: requestSelect.value, claimant_name: faction?.name || claimantInput?.value || '', faction_id: faction?.id || null });
  });
  useFaction?.addEventListener('change', () => { if (claimantInput) claimantInput.disabled = Boolean(useFaction.checked); });
  assignForm?.addEventListener('submit', (event) => {
    event.preventDefault(); if (!assignFlag?.value) { showMessage('Select a flag first.'); return; }
    const factionId = assignFaction?.value || '';
    if (!factionId && !assignName?.value.trim()) { showMessage('Enter a player/group name or choose a faction.'); return; }
    runAdminAction({ action: 'assign', flag_key: assignFlag.value, claimant_name: assignName?.value.trim() || 'Faction', faction_id: factionId || null });
  });
  saveChannelsButton?.addEventListener('click', () => runAdminAction({ action: 'config', review_channel_key: reviewChannel?.value || '', public_channel_key: publicChannel?.value || '' }));
  saveActivityButton?.addEventListener('click', () => runAdminAction({ action: 'activity_config', notification_channel_key: notificationChannel?.value || '', notifications_enabled: Boolean(notificationsEnabled?.checked), inactivity_days: Math.max(1, Math.min(Number(inactivityDays?.value || 30), 3650)) }));
  saveSpecialsButton?.addEventListener('click', () => {
    const adminKey = adminSpecialFlag?.value || ''; const protectedKey = nonRaidableSpecialFlag?.value || '';
    if (adminKey && protectedKey && adminKey === protectedKey) { showMessage('The Admin flag and non-raidable flag must be different flags.'); return; }
    runAdminAction({ action: 'special_config', admin_flag_key: adminKey, admin_flag_label: adminSpecialLabel?.value?.trim() || 'WWZ Admin Team', non_raidable_flag_key: protectedKey, non_raidable_capacity: Math.max(1, Math.min(Number(nonRaidableSlots?.value || 5), 25)) });
  });
  wipeClaimsButton?.addEventListener('click', () => {
    const serverName = admin?.server?.map_name || account?.server?.map_name || 'this server';
    const confirmation = prompt(`This will release ALL current flag claims on ${serverName} only. Pending requests will be kept.\n\nType WIPE to continue:`, '');
    if (String(confirmation || '').trim().toUpperCase() === 'WIPE') runAdminAction({ action: 'wipe', include_pending: false });
  });
  publishButton?.addEventListener('click', () => runAdminAction({ action: 'publish', public_channel_key: publicChannel?.value || '' }));
  unpublishButton?.addEventListener('click', () => { if (confirm('Remove only the flag-list messages previously published by WWZ? Claims will be kept.')) runAdminAction({ action: 'unpublish' }); });
  refreshButton?.addEventListener('click', load);
  searchInput?.addEventListener('input', renderCatalogue);
  ownerFilter?.addEventListener('change', renderActive);
  historySearch?.addEventListener('input', renderHistory);
  historyAction?.addEventListener('change', renderHistory);
  historyFlag?.addEventListener('change', renderHistory);
  window.addEventListener('wwz:viewchange', (event) => { if (event.detail?.view === 'flags') load(); });
  window.addEventListener('wwz:serverchange', () => { account = { flags: [], mine: { claims: [], pending: [], transfer_requests: [] }, server: {}, member_faction: null }; admin = null; if (location.hash.startsWith('#flags')) load(); });
  window.WWZFlagClaims = Object.freeze({ activate: load });
  window.__wwzFlagClaimsReady = true;
})();
