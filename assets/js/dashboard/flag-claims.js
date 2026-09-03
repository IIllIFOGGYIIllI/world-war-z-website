(() => {
  'use strict';
  const ACCOUNT_URL = `${DASHBOARD_API_BASE}/api/account/flags`;
  const ACCOUNT_ACTION_URL = `${DASHBOARD_API_BASE}/api/account/flags/action`;
  const ADMIN_URL = `${DASHBOARD_API_BASE}/api/admin/flags`;
  const ADMIN_ACTION_URL = `${DASHBOARD_API_BASE}/api/admin/flags/action`;
  const root = document.querySelector('[data-flag-claims]');
  if (!root) return;

  const catalogueHost = root.querySelector('[data-flag-catalogue]');
  const searchInput = root.querySelector('[data-flag-search]');
  const summaryHost = root.querySelector('[data-flag-summary]');
  const myClaimsHost = root.querySelector('[data-my-flag-claims]');
  const myPendingHost = root.querySelector('[data-my-flag-pending]');
  const requestForm = root.querySelector('[data-flag-request-form]');
  const requestSelect = root.querySelector('[data-flag-request-select]');
  const claimantInput = root.querySelector('[data-flag-claimant-name]');
  const message = root.querySelector('[data-flag-message]');
  const refreshButton = root.querySelector('[data-flag-refresh]');
  const adminRoot = root.querySelector('[data-flag-admin]');
  const pendingHost = root.querySelector('[data-flag-admin-pending]');
  const activeHost = root.querySelector('[data-flag-admin-active]');
  const historyHost = root.querySelector('[data-flag-admin-history]');
  const reviewChannel = root.querySelector('[data-flag-review-channel]');
  const publicChannel = root.querySelector('[data-flag-public-channel]');
  const saveChannelsButton = root.querySelector('[data-flag-save-channels]');
  const publishButton = root.querySelector('[data-flag-publish]');
  const unpublishButton = root.querySelector('[data-flag-unpublish]');
  const assignForm = root.querySelector('[data-flag-assign-form]');
  const assignFlag = root.querySelector('[data-flag-assign-select]');
  const assignName = root.querySelector('[data-flag-assign-name]');
  const adminStateNote = root.querySelector('[data-flag-admin-state]');

  let loading = false;
  let account = { flags: [], mine: { claims: [], pending: [] }, server: {} };
  let admin = null;

  const token = () => storageGet(AUTH_SESSION_KEY);
  const isStaff = () => ['staff', 'owner'].includes(dashboardAccessLevel);
  const showMessage = (text = '', tone = 'error') => {
    if (!message) return;
    message.hidden = !text;
    message.textContent = text;
    message.dataset.tone = tone;
  };
  const initials = (name) => String(name || 'FLAG').replace(/\([^)]*\)/g, '').split(/\s+/).filter(Boolean).slice(0,2).map((part) => part[0]?.toUpperCase() || '').join('') || 'F';
  const DAYZ_FLAG_IMAGE_BASE = 'https://dayz-store.ru/wp-content/uploads/images/large';
  const DAYZ_FLAG_IMAGE_CLASSES = Object.freeze({
    "altis": "Flag_Altis",
    "apa": "Flag_APA",
    "baby-deer": "Flag_BabyDeer",
    "bear": "Flag_Bear",
    "bohemia-interactive": "Flag_Bohemia",
    "brainz": "Flag_BrainZ",
    "cannibals": "Flag_Cannibals",
    "cdf": "Flag_CDF",
    "chedaki": "Flag_Chedaki",
    "chel": "Flag_CHEL",
    "chernarus": "Flag_Chernarus",
    "cmc": "Flag_CMC",
    "crook": "Flag_Crook",
    "dayz": "Flag_DayZ",
    "hunterz": "Flag_HunterZ",
    "livonia-army": "Flag_LivoniaArmy",
    "livonia-police": "Flag_LivoniaPolice",
    "livonia": "Flag_Livonia",
    "napa": "Flag_NAPA",
    "north-sahrani": "Flag_NSahrani",
    "pirates": "Flag_Pirates",
    "radio-zenit": "Flag_Zenit",
    "refuge": "Flag_Refuge",
    "rex": "Flag_Rex",
    "rooster": "Flag_Rooster",
    "rsta": "Flag_RSTA",
    "sakhal": "Flag_Sakhal",
    "snake": "Flag_Snake",
    "south-sahrani": "Flag_SSahrani",
    "tec": "Flag_TEC",
    "uec": "Flag_UEC",
    "white-surrender": "Flag_White",
    "wolf": "Flag_Wolf",
    "zagorky": "Flag_Zagorky",
  });
  const flagImageUrl = (item) => {
    const key = String(item?.image_key || item?.key || '').trim().toLowerCase();
    const className = DAYZ_FLAG_IMAGE_CLASSES[key] || 'Flag_White';
    return `${DAYZ_FLAG_IMAGE_BASE}/${encodeURIComponent(className)}.png`;
  };
  const makeFlagVisual = (item) => {
    const visual = document.createElement('div'); visual.className = 'flag-claim-card-visual'; visual.title = `${item.name} flag artwork`;
    const fallback = document.createElement('span'); fallback.className = 'flag-claim-card-fallback'; fallback.textContent = initials(item.name); fallback.hidden = true;
    const image = document.createElement('img'); image.loading = 'lazy'; image.decoding = 'async'; image.referrerPolicy = 'no-referrer'; image.alt = `${item.name} artwork`; image.src = flagImageUrl(item);
    image.addEventListener('error', () => { image.hidden = true; fallback.hidden = false; }, { once: true });
    visual.append(image, fallback); return visual;
  };
  const statusInfo = (item) => {
    if (item.reserved) return ['reserved', 'Reserved'];
    if (item.status === 'available') return ['available', 'Available'];
    if (item.status === 'partial') return ['partial', `${item.claimed_count}/${item.capacity} claimed`];
    return ['claimed', 'Claimed'];
  };
  const actionRequest = async (url, payload) => {
    const session = token();
    if (!session) throw new Error('Sign in with Discord to continue.');
    const response = await authFetch(url, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${session}` }, body: JSON.stringify(payload) });
    const body = await response.json().catch(() => ({}));
    if (typeof handleAdminPlayerAuthorizationResponse === 'function' && handleAdminPlayerAuthorizationResponse(response, body, { actionRequest: true })) return null;
    if (!response.ok || body.status !== 'ok') throw new Error(body.message || 'Flag claim action failed.');
    return body;
  };
  const makeButton = (label, tone = 'secondary-action') => { const button = document.createElement('button'); button.type = 'button'; button.className = `${tone} compact-action`; button.textContent = label; return button; };

  const renderSummary = () => {
    if (!summaryHost) return; summaryHost.replaceChildren();
    const values = admin?.summary || {
      total: account.flags.length,
      available: account.flags.filter((item) => item.status === 'available').length,
      claimed: account.flags.filter((item) => Number(item.claimed_count) > 0).length,
      pending: account.mine?.pending?.length || 0,
    };
    [['Flags', values.total ?? account.flags.length], ['Available', values.available ?? 0], ['In Use', values.claimed ?? 0], ['Pending', values.pending ?? 0]].forEach(([label, value]) => {
      const card = document.createElement('div'); card.className = 'flag-claims-stat'; const span = document.createElement('span'); span.textContent = label; const strong = document.createElement('strong'); strong.textContent = value; card.append(span, strong); summaryHost.append(card);
    });
  };
  const renderCatalogue = () => {
    if (!catalogueHost) return; const needle = String(searchInput?.value || '').trim().toLowerCase(); catalogueHost.replaceChildren();
    account.flags.filter((item) => !needle || String(item.name).toLowerCase().includes(needle)).forEach((item) => {
      const card = document.createElement('article'); card.className = 'flag-claim-card';
      const visual = makeFlagVisual(item);
      const copy = document.createElement('div'); copy.className = 'flag-claim-card-copy'; const heading = document.createElement('h3'); heading.textContent = item.name;
      const [tone, label] = statusInfo(item); const status = document.createElement('span'); status.className = `flag-claim-status ${tone}`; status.textContent = label;
      const owners = document.createElement('p'); owners.className = 'flag-claim-owner'; const claims = item.claims || []; owners.textContent = claims.length ? claims.map((claim) => claim.claimant_name).join(' · ') : (item.reserved ? item.reserved_label || 'WWZ Admin Team' : `${item.remaining} slot${item.remaining === 1 ? '' : 's'} available`);
      copy.append(heading, status, owners); if (item.special) { const special = document.createElement('p'); special.className = 'flag-claim-special'; special.textContent = item.special; copy.append(special); }
      if (!item.reserved && Number(item.remaining || 0) > 0) {
        const actions = document.createElement('div'); actions.className = 'flag-card-actions'; const request = makeButton('Request', 'primary-action');
        request.addEventListener('click', () => { if (requestSelect) requestSelect.value = String(item.key || ''); requestForm?.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => claimantInput?.focus(), 250); });
        actions.append(request); copy.append(actions);
      }
      card.append(visual, copy); catalogueHost.append(card);
    });
  };
  const fillFlagSelect = (select, { availableOnly = false } = {}) => {
    if (!select) return; const current = select.value; select.replaceChildren(); const blank = document.createElement('option'); blank.value = ''; blank.textContent = 'Select a flag…'; select.append(blank);
    account.flags.forEach((item) => { if (availableOnly && (item.reserved || Number(item.remaining) <= 0)) return; const option = document.createElement('option'); option.value = item.key; option.textContent = `${item.name}${item.capacity > 1 ? ` (${item.remaining} left)` : ''}`; select.append(option); });
    if ([...select.options].some((option) => option.value === current)) select.value = current;
  };
  const renderMine = () => {
    if (myClaimsHost) { myClaimsHost.replaceChildren(); const claims = account.mine?.claims || []; claims.forEach((claim) => { const row = document.createElement('div'); row.className = 'flag-claim-row'; const strong = document.createElement('strong'); strong.textContent = claim.flag_name || claim.flag_key; const small = document.createElement('small'); small.textContent = `Claimed as ${claim.claimant_name}`; const actions = document.createElement('div'); actions.className = 'flag-claim-row-actions'; const release = makeButton('Release', 'secondary-action'); release.addEventListener('click', async () => { if (!confirm(`Release ${claim.flag_name || claim.flag_key}?`)) return; await runMemberAction({ action: 'release', flag_key: claim.flag_key }); }); actions.append(release); row.append(strong, small, actions); myClaimsHost.append(row); }); if (!claims.length) { const row = document.createElement('p'); row.className = 'table-note'; row.textContent = 'No active flag claim on this server.'; myClaimsHost.append(row); } }
    if (myPendingHost) { myPendingHost.replaceChildren(); const pending = account.mine?.pending || []; pending.forEach((request) => { const row = document.createElement('div'); row.className = 'flag-claim-row'; const strong = document.createElement('strong'); strong.textContent = `#${request.id} · ${request.flag_name || request.flag_key}`; const small = document.createElement('small'); small.textContent = `Pending for ${request.claimant_name}`; const actions = document.createElement('div'); actions.className = 'flag-claim-row-actions'; const cancel = makeButton('Cancel'); cancel.addEventListener('click', () => runMemberAction({ action: 'cancel', request_id: request.id })); actions.append(cancel); row.append(strong, small, actions); myPendingHost.append(row); }); if (!pending.length) { const row = document.createElement('p'); row.className = 'table-note'; row.textContent = 'No pending request.'; myPendingHost.append(row); } }
    fillFlagSelect(requestSelect, { availableOnly: true }); fillFlagSelect(assignFlag);
  };
  const renderChannels = () => {
    if (!admin) return; [reviewChannel, publicChannel].forEach((select) => { if (!select) return; const current = select === reviewChannel ? admin.config?.review_channel_key : admin.config?.public_channel_key; select.replaceChildren(); const blank = document.createElement('option'); blank.value = ''; blank.textContent = 'Not configured'; select.append(blank); (admin.channels || []).forEach((channel) => { const option = document.createElement('option'); option.value = channel.key; option.textContent = `${channel.category ? `${channel.category} / ` : ''}#${channel.name}${channel.can_publish ? '' : ' (permissions missing)'}`; option.disabled = !channel.can_publish; select.append(option); }); select.value = current || ''; });
    if (adminStateNote) adminStateNote.textContent = `${admin.config?.published_message_count || 0} WWZ flag panel message(s) currently tracked.`;
  };
  const renderAdmin = () => {
    if (!adminRoot) return; adminRoot.hidden = !isStaff(); if (!isStaff() || !admin) return;
    if (pendingHost) { pendingHost.replaceChildren(); (admin.pending || []).forEach((request) => { const row = document.createElement('div'); row.className = 'flag-claim-row'; const strong = document.createElement('strong'); strong.textContent = `#${request.id} · ${request.flag_name || request.flag_key}`; const small = document.createElement('small'); small.textContent = `${request.claimant_name} · requested by ${request.requester_name}`; const actions = document.createElement('div'); actions.className = 'flag-claim-row-actions'; const approve = makeButton('Approve', 'primary-action'); const reject = makeButton('Reject'); approve.addEventListener('click', () => runAdminAction({ action: 'approve', request_id: request.id })); reject.addEventListener('click', () => { const reason = prompt('Optional rejection reason:', '') ?? null; if (reason === null) return; runAdminAction({ action: 'reject', request_id: request.id, reason }); }); actions.append(approve, reject); row.append(strong, small, actions); pendingHost.append(row); }); if (!(admin.pending || []).length) { const p = document.createElement('p'); p.className = 'table-note'; p.textContent = 'No requests awaiting review.'; pendingHost.append(p); } }
    if (activeHost) { activeHost.replaceChildren(); (admin.flags || []).forEach((flag) => (flag.claims || []).forEach((claim) => { const row = document.createElement('div'); row.className = 'flag-claim-row'; const strong = document.createElement('strong'); strong.textContent = flag.name; const small = document.createElement('small'); small.textContent = claim.claimant_name; const actions = document.createElement('div'); actions.className = 'flag-claim-row-actions'; const transfer = makeButton('Transfer'); const revoke = makeButton('Revoke', 'secondary-action'); transfer.addEventListener('click', () => { const name = prompt(`Transfer ${flag.name} from ${claim.claimant_name} to:`, '') ?? ''; if (!name.trim()) return; runAdminAction({ action: 'transfer', flag_key: flag.key, current_claimant: claim.claimant_name, new_claimant_name: name.trim() }); }); revoke.addEventListener('click', () => { if (!confirm(`Revoke ${flag.name} from ${claim.claimant_name}?`)) return; const reason = prompt('Revocation reason:', 'Inactive or revoked by staff') ?? null; if (reason === null) return; runAdminAction({ action: 'revoke', flag_key: flag.key, claimant_name: claim.claimant_name, reason }); }); actions.append(transfer, revoke); row.append(strong, small, actions); activeHost.append(row); })); }
    if (historyHost) { historyHost.replaceChildren(); (admin.history || []).slice(0,60).forEach((event) => { const row = document.createElement('div'); row.className = 'flag-claim-row'; const strong = document.createElement('strong'); strong.textContent = `${String(event.action || '').replace(/_/g,' ')}${event.flag_name ? ` · ${event.flag_name}` : ''}`; const small = document.createElement('small'); small.textContent = `${event.actor_name || 'System'} · ${event.created_at ? formatAccountDate(event.created_at) : ''}`; row.append(strong, small); historyHost.append(row); }); }
    renderChannels();
  };
  const render = () => { renderSummary(); renderCatalogue(); renderMine(); renderAdmin(); };

  const load = async () => {
    const session = token(); if (!session || loading) return false; loading = true; refreshButton?.setAttribute('disabled',''); showMessage('');
    try {
      const response = await authFetch(ACCOUNT_URL, { headers: { Accept: 'application/json', Authorization: `Bearer ${session}` } }); const payload = await response.json().catch(() => ({})); if (typeof handleAdminPlayerAuthorizationResponse === 'function' && handleAdminPlayerAuthorizationResponse(response, payload, { actionRequest: false })) return false; if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Flag claims unavailable.'); account = payload;
      admin = null;
      if (isStaff()) { const adminResponse = await authFetch(ADMIN_URL, { headers: { Accept: 'application/json', Authorization: `Bearer ${session}` } }); const adminPayload = await adminResponse.json().catch(() => ({})); if (adminResponse.ok && adminPayload.status === 'ok') admin = adminPayload; }
      render(); return true;
    } catch (error) { showMessage(error instanceof Error ? error.message : 'Flag claims are temporarily unavailable.', 'error'); return false; }
    finally { loading = false; refreshButton?.removeAttribute('disabled'); }
  };
  const runMemberAction = async (payload) => { if (loading) return; loading = true; showMessage(''); try { const result = await actionRequest(ACCOUNT_ACTION_URL, payload); if (!result) return; loading = false; await load(); showMessage(result.message || 'Flag claim updated.', 'success'); } catch (error) { showMessage(error instanceof Error ? error.message : 'Flag claim action failed.', 'error'); } finally { loading = false; } };
  const runAdminAction = async (payload) => { if (loading || !isStaff()) return; loading = true; showMessage(''); try { const result = await actionRequest(ADMIN_ACTION_URL, payload); if (!result) return; loading = false; await load(); showMessage(result.message || 'Flag administration updated.', 'success'); } catch (error) { showMessage(error instanceof Error ? error.message : 'Flag administration action failed.', 'error'); } finally { loading = false; } };

  requestForm?.addEventListener('submit', (event) => { event.preventDefault(); if (!requestSelect?.value) { showMessage('Select a flag first.'); return; } runMemberAction({ action: 'request', flag_key: requestSelect.value, claimant_name: claimantInput?.value || '' }); });
  assignForm?.addEventListener('submit', (event) => { event.preventDefault(); if (!assignFlag?.value || !assignName?.value.trim()) { showMessage('Select a flag and enter a player/group name.'); return; } runAdminAction({ action: 'assign', flag_key: assignFlag.value, claimant_name: assignName.value.trim() }); });
  saveChannelsButton?.addEventListener('click', () => runAdminAction({ action: 'config', review_channel_key: reviewChannel?.value || '', public_channel_key: publicChannel?.value || '' }));
  publishButton?.addEventListener('click', () => runAdminAction({ action: 'publish', public_channel_key: publicChannel?.value || '' }));
  unpublishButton?.addEventListener('click', () => { if (confirm('Remove only the flag-list messages previously published by WWZ? Claims will be kept.')) runAdminAction({ action: 'unpublish' }); });
  refreshButton?.addEventListener('click', load); searchInput?.addEventListener('input', renderCatalogue);
  window.addEventListener('wwz:viewchange', (event) => { if (event.detail?.view === 'flags') load(); });
  window.addEventListener('wwz:serverchange', () => { account = { flags: [], mine: { claims: [], pending: [] }, server: {} }; admin = null; if (location.hash.startsWith('#flags')) load(); });
  window.WWZFlagClaims = Object.freeze({ activate: load });
  window.__wwzFlagClaimsReady = true;
})();
