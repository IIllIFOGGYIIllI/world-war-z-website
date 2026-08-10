(() => {
  'use strict';

  const panel = document.querySelector('[data-view-panel="factions"]');
  if (!panel) return;

  const ACCOUNT_URL = `${DASHBOARD_API_BASE}/api/account/factions`;
  const ADMIN_URL = `${DASHBOARD_API_BASE}/api/admin/factions`;
  const ADMIN_ACTION_URL = `${DASHBOARD_API_BASE}/api/admin/factions/action`;
  const PLAYER_SEARCH_URL = `${DASHBOARD_API_BASE}/api/admin/players/search`;

  const guest = panel.querySelector('[data-faction-guest]');
  const content = panel.querySelector('[data-faction-content]');
  const directory = panel.querySelector('[data-faction-directory]');
  const empty = panel.querySelector('[data-faction-empty]');
  const errorBox = panel.querySelector('[data-faction-error]');
  const refreshButton = panel.querySelector('[data-refresh-factions]');
  const adminRefreshButton = panel.querySelector('[data-refresh-faction-admin]');
  const adminList = panel.querySelector('[data-faction-admin-list]');
  const adminEmpty = panel.querySelector('[data-faction-admin-empty]');
  const adminMessage = panel.querySelector('[data-faction-admin-message]');
  const createButton = panel.querySelector('[data-create-faction]');

  const editorDialog = document.querySelector('[data-faction-editor-dialog]');
  const editorForm = document.querySelector('[data-faction-editor-form]');
  const editorTitle = document.querySelector('[data-faction-editor-title]');
  const editorId = document.querySelector('[data-faction-editor-id]');
  const editorName = document.querySelector('[data-faction-name]');
  const editorLeader = document.querySelector('[data-faction-leader]');
  const editorLeaderField = document.querySelector('[data-faction-leader-field]');
  const editorArmband = document.querySelector('[data-faction-armband]');
  const editorFlag = document.querySelector('[data-faction-flag]');
  const editorLimit = document.querySelector('[data-faction-member-limit]');
  const editorColour = document.querySelector('[data-faction-colour]');
  const editorRole = document.querySelector('[data-faction-discord-role]');
  const editorZone = document.querySelector('[data-faction-zone-id]');
  const editorMarker = document.querySelector('[data-faction-map-marker]');
  const editorInvite = document.querySelector('[data-faction-invite]');
  const editorIcon = document.querySelector('[data-faction-icon]');
  const editorMessage = document.querySelector('[data-faction-editor-message]');
  const editorCancel = [...document.querySelectorAll('[data-faction-editor-cancel]')];

  const membersDialog = document.querySelector('[data-faction-members-dialog]');
  const membersTitle = document.querySelector('[data-faction-members-title]');
  const membersCurrent = document.querySelector('[data-faction-member-current]');
  const memberSearch = document.querySelector('[data-faction-member-search]');
  const memberSearchButton = document.querySelector('[data-faction-member-search-button]');
  const memberResults = document.querySelector('[data-faction-member-results]');
  const memberSearchEmpty = document.querySelector('[data-faction-member-search-empty]');
  const membersMessage = document.querySelector('[data-faction-members-message]');
  const membersClose = [...document.querySelectorAll('[data-faction-members-close]')];

  let memberPayload = null;
  let adminPayload = null;
  let activeFactionId = null;
  let loading = false;

  const token = () => storageGet(AUTH_SESSION_KEY);
  const isStaff = () => ['staff', 'owner'].includes(dashboardAccessLevel);
  const openDialog = (dialog) => {
    if (typeof dialog?.showModal === 'function') dialog.showModal();
    else dialog?.setAttribute('open', '');
  };
  const closeDialog = (dialog) => {
    if (typeof dialog?.close === 'function') dialog.close();
    else dialog?.removeAttribute('open');
  };
  const showMessage = (element, message = '', state = 'error') => {
    if (!element) return;
    element.textContent = String(message || '');
    element.dataset.state = state;
    element.hidden = !message;
  };
  const safeUrl = (value) => {
    try {
      const url = new URL(String(value || ''));
      return url.protocol === 'https:' ? url.href : '';
    } catch {
      return '';
    }
  };
  const formatDate = (value) => {
    if (!value) return 'Not recorded';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not recorded';
    return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  };

  const apiJson = async (url, options = {}) => {
    const sessionToken = token();
    if (!sessionToken) throw new Error('Sign in with Discord to continue.');
    const response = await authFetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${sessionToken}`,
        ...(options.headers || {})
      }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status !== 'ok') {
      const error = new Error(payload.message || 'The faction service could not complete that request.');
      error.status = response.status;
      throw error;
    }
    return payload;
  };

  const clearNode = (node) => { if (node) node.replaceChildren(); };
  const button = (label, handler, className = 'secondary-action compact-action') => {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = className;
    node.textContent = label;
    if (typeof handler === 'function') node.addEventListener('click', handler);
    else node.disabled = true;
    return node;
  };

  const factionInitials = (name) => String(name || 'F')
    .split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'F';

  const focusFactionMarker = async (faction) => {
    const marker = faction?.map_marker;
    if (!marker) return;
    document.querySelector('[data-view="map"][data-section="explorer"]')?.click();
    try {
      const instance = await window.WWZDashboardMap?.initialise?.();
      if (instance?.focus) {
        window.setTimeout(() => instance.focus(Number(marker.x), Number(marker.z), 7), 80);
      }
    } catch {
      // The map loader owns its visible error state.
    }
  };

  const memberRow = (member, { admin = false, faction = null } = {}) => {
    const row = document.createElement('div');
    row.className = 'faction-member-row';
    const identity = document.createElement('div');
    identity.className = 'faction-member-identity';
    const strong = document.createElement('strong');
    strong.textContent = member.psn_id || 'Unknown Survivor';
    const small = document.createElement('small');
    const state = member.online ? 'Online' : 'Offline';
    small.textContent = `${member.discord_name || 'Discord linked'} · ${member.role === 'leader' ? 'Leader' : 'Member'} · ${state}`;
    identity.append(strong, small);
    row.append(identity);
    if (admin && faction) {
      const actions = document.createElement('div');
      actions.className = 'faction-member-actions';
      if (member.role !== 'leader') {
        const leader = button('Make Leader', () => memberAction('set_leader', faction, member));
        const remove = button('Remove', () => memberAction('remove_member', faction, member), 'secondary-action compact-action danger-action');
        actions.append(leader, remove);
      } else {
        const tag = document.createElement('span');
        tag.className = 'muted-label';
        tag.textContent = 'Faction Leader';
        actions.append(tag);
      }
      row.append(actions);
    }
    return row;
  };

  const buildFactionCard = (faction) => {
    const card = document.createElement('article');
    card.className = 'faction-card';
    card.style.setProperty('--faction-colour', faction.colour || '#8F1D1D');

    const header = document.createElement('div');
    header.className = 'faction-card-header';
    const heading = document.createElement('div');
    heading.className = 'faction-card-heading';
    const mark = document.createElement('span');
    mark.className = 'faction-mark';
    mark.textContent = factionInitials(faction.name);
    const titleWrap = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = faction.name;
    const subtitle = document.createElement('p');
    subtitle.className = 'faction-card-subtitle';
    subtitle.textContent = faction.leader?.psn_id ? `Led by ${faction.leader.psn_id}` : 'Leader not assigned';
    titleWrap.append(title, subtitle);
    heading.append(mark, titleWrap);
    const capacity = document.createElement('span');
    capacity.className = 'muted-label';
    capacity.textContent = `${faction.member_count}/${faction.member_limit}`;
    header.append(heading, capacity);

    const meta = document.createElement('div');
    meta.className = 'faction-meta';
    const entries = [
      ['Armband', faction.armband || 'Not specified'],
      ['Flag', faction.flag || 'Not specified'],
      ['Zone ID', faction.zone_id || 'Not linked'],
      ['Map marker', faction.map_marker?.name || 'Not linked']
    ];
    entries.forEach(([label, value]) => {
      const cell = document.createElement('div');
      const span = document.createElement('span'); span.textContent = label;
      const strong = document.createElement('strong'); strong.textContent = value;
      cell.append(span, strong); meta.append(cell);
    });

    const members = document.createElement('div');
    members.className = 'faction-member-list';
    (faction.members || []).slice(0, 8).forEach((member) => members.append(memberRow(member)));
    if ((faction.members || []).length > 8) {
      const note = document.createElement('p');
      note.className = 'table-note';
      note.textContent = `+ ${(faction.members || []).length - 8} more member(s)`;
      members.append(note);
    }

    const progress = document.createElement('div');
    progress.className = 'faction-capacity';
    const bar = document.createElement('span');
    bar.style.setProperty('--faction-capacity', `${Math.min(100, Math.round((Number(faction.member_count || 0) / Math.max(1, Number(faction.member_limit || 1))) * 100))}%`);
    progress.append(bar);

    const footer = document.createElement('div');
    footer.className = 'faction-card-footer';
    const inviteUrl = safeUrl(faction.discord_invite_url);
    if (inviteUrl) {
      const link = document.createElement('a');
      link.className = 'secondary-action compact-action';
      link.href = inviteUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Discord Invite';
      footer.append(link);
    }
    if (faction.map_marker) {
      const map = button('View on Chernarus Map', () => focusFactionMarker(faction));
      footer.append(map);
    }
    const iconUrl = safeUrl(faction.icon_url);
    if (iconUrl) {
      const iconLink = document.createElement('a');
      iconLink.className = 'text-action';
      iconLink.href = iconUrl;
      iconLink.target = '_blank';
      iconLink.rel = 'noopener noreferrer';
      iconLink.textContent = 'Faction icon ↗';
      footer.append(iconLink);
    }

    card.append(header, meta, members, progress, footer);
    return card;
  };

  const renderDirectory = () => {
    const factions = Array.isArray(memberPayload?.factions) ? memberPayload.factions : [];
    clearNode(directory);
    factions.forEach((faction) => directory.append(buildFactionCard(faction)));
    if (empty) empty.hidden = factions.length !== 0;
    const totalMembers = factions.reduce((sum, faction) => sum + Number(faction.member_count || 0), 0);
    const mapped = factions.filter((faction) => faction.map_marker || faction.zone_id).length;
    const roleCount = Array.isArray(adminPayload?.factions)
      ? adminPayload.factions.filter((faction) => faction.discord_role_key).length
      : factions.filter((faction) => faction.discord_role_configured).length;
    const set = (selector, value) => { const node = panel.querySelector(selector); if (node) node.textContent = String(value); };
    set('[data-faction-count]', factions.length);
    set('[data-faction-member-count]', totalMembers);
    set('[data-faction-zone-count]', mapped);
    set('[data-faction-role-count]', roleCount || '—');

    const current = memberPayload?.my_faction;
    set('[data-my-faction-name]', current?.name || 'No Faction');
    set('[data-my-faction-role]', current ? (current.my_role === 'leader' ? 'Faction Leader' : 'Faction Member') : 'Unassigned');
    const copy = panel.querySelector('[data-my-faction-copy]');
    if (copy) {
      if (!current) copy.textContent = 'You are not currently assigned to a faction.';
      else {
        copy.textContent = `${current.member_count}/${current.member_limit} members · Leader ${current.leader?.psn_id || 'unassigned'}${current.zone_id ? ` · Zone ${current.zone_id}` : ''}.`;
      }
    }
    const actions = panel.querySelector('[data-my-faction-actions]');
    clearNode(actions);
    if (current?.map_marker) {
      const map = button('View Faction Marker', () => focusFactionMarker(current));
      actions?.append(map);
    }
  };

  const roleName = (key) => adminPayload?.roles?.find((role) => role.key === key)?.name || 'No Discord role';
  const markerName = (key) => adminPayload?.map_markers?.find((marker) => marker.key === key)?.name || 'No map marker';

  const renderAdmin = () => {
    if (!isStaff() || !adminPayload) return;
    const factions = Array.isArray(adminPayload.factions) ? adminPayload.factions : [];
    clearNode(adminList);
    factions.forEach((faction) => {
      const card = document.createElement('article');
      card.className = 'faction-admin-card';
      card.style.setProperty('--faction-colour', faction.colour || '#8F1D1D');
      const header = document.createElement('div');
      header.className = 'faction-admin-header';
      const titleWrap = document.createElement('div');
      const title = document.createElement('h3'); title.textContent = faction.name;
      const sub = document.createElement('p'); sub.className = 'faction-card-subtitle';
      sub.textContent = `${faction.member_count}/${faction.member_limit} members · ${roleName(faction.discord_role_key)} · ${markerName(faction.map_marker_key)}`;
      titleWrap.append(title, sub);
      const actions = document.createElement('div'); actions.className = 'faction-admin-actions';
      const edit = button('Edit', () => openEditor(faction));
      const manage = button('Manage Members', () => openMembers(faction));
      const remove = button('Delete', () => deleteFaction(faction), 'secondary-action compact-action danger-action');
      actions.append(edit, manage, remove);
      header.append(titleWrap, actions);
      const meta = document.createElement('div'); meta.className = 'faction-meta';
      [['Leader', faction.leader?.psn_id || 'Unassigned'], ['Armband', faction.armband || '—'], ['Flag', faction.flag || '—'], ['Zone ID', faction.zone_id || '—']].forEach(([label, value]) => {
        const cell = document.createElement('div'); const span = document.createElement('span'); span.textContent = label; const strong = document.createElement('strong'); strong.textContent = value; cell.append(span, strong); meta.append(cell);
      });
      card.append(header, meta);
      adminList.append(card);
    });
    if (adminEmpty) adminEmpty.hidden = factions.length !== 0;
  };

  const fillSelect = (select, items, selected = '') => {
    if (!select) return;
    select.replaceChildren();
    (items || []).forEach((item) => {
      const option = document.createElement('option');
      option.value = item.key || '';
      option.textContent = item.category ? `${item.name} · ${item.category}` : item.name;
      option.selected = (item.key || '') === (selected || '');
      select.append(option);
    });
  };

  const openEditor = (faction = null) => {
    if (!isStaff() || !adminPayload) return;
    const editing = Boolean(faction);
    editorId.value = editing ? String(faction.faction_id) : '';
    editorTitle.textContent = editing ? `Edit ${faction.name}` : 'Create Faction';
    editorName.value = faction?.name || '';
    editorLeader.value = faction?.leader?.psn_id || '';
    editorLeaderField.hidden = editing;
    editorLeader.required = !editing;
    editorArmband.value = faction?.armband || '';
    editorFlag.value = faction?.flag || '';
    editorLimit.value = String(faction?.member_limit || 10);
    editorColour.value = String(faction?.colour || '#8F1D1D').toLowerCase();
    editorZone.value = faction?.zone_id || '';
    editorInvite.value = faction?.discord_invite_url || '';
    editorIcon.value = faction?.icon_url || '';
    fillSelect(editorRole, adminPayload.roles, faction?.discord_role_key || '');
    fillSelect(editorMarker, adminPayload.map_markers, faction?.map_marker_key || '');
    showMessage(editorMessage, '');
    openDialog(editorDialog);
  };

  const saveFaction = async (event) => {
    event.preventDefault();
    const editing = Boolean(editorId.value);
    const payload = {
      action: editing ? 'update' : 'create',
      faction_id: editing ? Number(editorId.value) : undefined,
      name: editorName.value,
      leader_psn: editing ? undefined : editorLeader.value,
      armband: editorArmband.value,
      flag: editorFlag.value,
      member_limit: Number(editorLimit.value),
      colour: editorColour.value,
      discord_role_key: editorRole.value,
      zone_id: editorZone.value,
      map_marker_key: editorMarker.value,
      discord_invite_url: editorInvite.value,
      icon_url: editorIcon.value
    };
    try {
      showMessage(editorMessage, 'Saving faction…', 'loading');
      await apiJson(ADMIN_ACTION_URL, { method: 'POST', body: JSON.stringify(payload) });
      closeDialog(editorDialog);
      await loadAll({ forceAdmin: true });
      showMessage(adminMessage, editing ? 'Faction updated.' : 'Faction created.', 'success');
    } catch (error) {
      showMessage(editorMessage, error.message, 'error');
    }
  };

  const deleteFaction = async (faction) => {
    const confirmation = window.prompt(`Delete faction “${faction.name}”? Type the exact faction name to confirm.`);
    if (confirmation === null) return;
    try {
      showMessage(adminMessage, `Deleting ${faction.name}…`, 'loading');
      await apiJson(ADMIN_ACTION_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'delete', faction_id: faction.faction_id, confirmation })
      });
      await loadAll({ forceAdmin: true });
      showMessage(adminMessage, `${faction.name} deleted.`, 'success');
    } catch (error) {
      showMessage(adminMessage, error.message, 'error');
    }
  };

  const activeFaction = () => adminPayload?.factions?.find((faction) => Number(faction.faction_id) === Number(activeFactionId)) || null;

  const renderMembersDialog = () => {
    const faction = activeFaction();
    if (!faction) return;
    membersTitle.textContent = `${faction.name} Members`;
    clearNode(membersCurrent);
    (faction.members || []).forEach((member) => membersCurrent.append(memberRow(member, { admin: true, faction })));
    clearNode(memberResults);
    if (memberSearchEmpty) memberSearchEmpty.hidden = true;
  };

  const openMembers = (faction) => {
    activeFactionId = Number(faction.faction_id);
    memberSearch.value = '';
    showMessage(membersMessage, '');
    renderMembersDialog();
    openDialog(membersDialog);
  };

  const memberAction = async (action, faction, member) => {
    const label = action === 'set_leader' ? `make ${member.psn_id} leader of ${faction.name}` : `remove ${member.psn_id} from ${faction.name}`;
    if (!window.confirm(`Confirm: ${label}?`)) return;
    try {
      showMessage(membersMessage, 'Updating faction membership…', 'loading');
      const result = await apiJson(ADMIN_ACTION_URL, {
        method: 'POST',
        body: JSON.stringify({ action, faction_id: faction.faction_id, psn_id: member.psn_id })
      });
      await loadAll({ forceAdmin: true });
      renderMembersDialog();
      const warning = Array.isArray(result.warnings) && result.warnings.length ? ` ${result.warnings.join(' ')}` : '';
      showMessage(membersMessage, `Faction membership updated.${warning}`, warning ? 'warning' : 'success');
    } catch (error) {
      showMessage(membersMessage, error.message, 'error');
    }
  };

  const addMember = async (faction, player) => {
    try {
      showMessage(membersMessage, `Adding ${player.psn_id}…`, 'loading');
      const result = await apiJson(ADMIN_ACTION_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'add_member', faction_id: faction.faction_id, psn_id: player.psn_id })
      });
      await loadAll({ forceAdmin: true });
      renderMembersDialog();
      memberSearch.value = '';
      const warning = Array.isArray(result.warnings) && result.warnings.length ? ` ${result.warnings.join(' ')}` : '';
      showMessage(membersMessage, `${player.psn_id} added.${warning}`, warning ? 'warning' : 'success');
    } catch (error) {
      showMessage(membersMessage, error.message, 'error');
    }
  };

  const searchMembers = async () => {
    const faction = activeFaction();
    if (!faction) return;
    const query = String(memberSearch.value || '').trim();
    if (query.length < 3) {
      showMessage(membersMessage, 'Enter at least 3 characters of a PlayStation ID or Discord display name.', 'error');
      return;
    }
    try {
      showMessage(membersMessage, 'Searching linked survivors…', 'loading');
      const payload = await apiJson(`${PLAYER_SEARCH_URL}?q=${encodeURIComponent(query)}`);
      const existing = new Set((faction.members || []).map((member) => String(member.psn_id || '').toLowerCase()));
      const players = (payload.players || []).filter((player) => player.linked && player.verified && !existing.has(String(player.psn_id || '').toLowerCase()));
      clearNode(memberResults);
      players.forEach((player) => {
        const row = document.createElement('div'); row.className = 'faction-member-row';
        const identity = document.createElement('div'); identity.className = 'faction-member-identity';
        const strong = document.createElement('strong'); strong.textContent = player.psn_id;
        const small = document.createElement('small'); small.textContent = `${player.discord_name || 'Discord linked'}${player.online ? ' · Online' : ''}`;
        identity.append(strong, small);
        const add = button('Add Member', () => addMember(faction, player), 'primary-action compact-action');
        row.append(identity, add); memberResults.append(row);
      });
      if (memberSearchEmpty) memberSearchEmpty.hidden = players.length !== 0;
      showMessage(membersMessage, players.length ? '' : 'No eligible linked survivors match this search.', players.length ? 'success' : 'warning');
    } catch (error) {
      showMessage(membersMessage, error.message, 'error');
    }
  };

  const loadAll = async ({ forceAdmin = false } = {}) => {
    if (loading) return;
    const sessionToken = token();
    if (!sessionToken) {
      memberPayload = null;
      adminPayload = null;
      if (guest) guest.hidden = false;
      if (content) content.hidden = true;
      return;
    }
    loading = true;
    refreshButton?.setAttribute('disabled', '');
    try {
      memberPayload = await apiJson(ACCOUNT_URL);
      if (isStaff() || forceAdmin) {
        adminPayload = await apiJson(ADMIN_URL);
      } else {
        adminPayload = null;
      }
      if (guest) guest.hidden = true;
      if (content) content.hidden = false;
      if (errorBox) errorBox.hidden = true;
      renderDirectory();
      renderAdmin();
    } catch (error) {
      if (error.status === 401) {
        if (guest) guest.hidden = false;
        if (content) content.hidden = true;
      } else {
        if (errorBox) { errorBox.textContent = error.message; errorBox.hidden = false; }
      }
    } finally {
      loading = false;
      refreshButton?.removeAttribute('disabled');
    }
  };

  refreshButton?.addEventListener('click', () => loadAll({ forceAdmin: isStaff() }));
  adminRefreshButton?.addEventListener('click', () => loadAll({ forceAdmin: true }));
  createButton?.addEventListener('click', () => openEditor(null));
  editorForm?.addEventListener('submit', saveFaction);
  editorCancel.forEach((node) => node.addEventListener('click', () => closeDialog(editorDialog)));
  membersClose.forEach((node) => node.addEventListener('click', () => closeDialog(membersDialog)));
  memberSearchButton?.addEventListener('click', searchMembers);
  memberSearch?.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); searchMembers(); } });

  window.addEventListener('wwz:viewchange', (event) => {
    if (event.detail?.view === 'factions') loadAll({ forceAdmin: event.detail?.section === 'administration' });
  });
  window.addEventListener('wwz:authchange', () => {
    memberPayload = null; adminPayload = null; activeFactionId = null;
    if (panel.classList.contains('active')) loadAll({ forceAdmin: isStaff() });
  });
  window.addEventListener('wwz:accesschange', () => {
    adminPayload = null;
    if (panel.classList.contains('active')) loadAll({ forceAdmin: isStaff() });
  });

  if (panel.classList.contains('active')) loadAll({ forceAdmin: isStaff() });
})();
