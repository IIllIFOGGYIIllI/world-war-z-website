(() => {
  'use strict';

  const panel = document.querySelector('[data-view-panel="factions"]');
  if (!panel) return;

  const ACCOUNT_URL = `${DASHBOARD_API_BASE}/api/account/factions`;
  const ACCOUNT_ACTION_URL = `${DASHBOARD_API_BASE}/api/account/factions/action`;
  const ADMIN_URL = `${DASHBOARD_API_BASE}/api/admin/factions`;
  const ADMIN_ACTION_URL = `${DASHBOARD_API_BASE}/api/admin/factions/action`;
  const PLAYER_SEARCH_URL = `${DASHBOARD_API_BASE}/api/admin/players/search`;

  const q = (selector, root = panel) => root?.querySelector(selector) || null;
  const qa = (selector, root = document) => [...(root?.querySelectorAll(selector) || [])];
  const token = () => storageGet(AUTH_SESSION_KEY);
  const isStaff = () => ['staff', 'owner'].includes(dashboardAccessLevel);
  const clear = (node) => node?.replaceChildren();

  const guest = q('[data-faction-guest]');
  const content = q('[data-faction-content]');
  const directory = q('[data-faction-directory]');
  const empty = q('[data-faction-empty]');
  const errorBox = q('[data-faction-error]');
  const refreshButton = q('[data-refresh-factions]');
  const adminRefreshButton = q('[data-refresh-faction-admin]');
  const adminList = q('[data-faction-admin-list]');
  const adminEmpty = q('[data-faction-admin-empty]');
  const adminMessage = q('[data-faction-admin-message]');
  const createButton = q('[data-create-faction]');
  const inviteInbox = q('[data-my-faction-invites]');
  const inviteInboxEmpty = q('[data-my-faction-invites-empty]');
  const applicationInbox = q('[data-my-faction-applications]');
  const applicationInboxEmpty = q('[data-my-faction-applications-empty]');
  const governance = q('[data-faction-governance]');
  const governanceRoster = q('[data-my-faction-roster]');
  const governanceRecruitment = q('[data-my-faction-recruitment]');
  const governanceRecruitmentList = q('[data-my-faction-recruitment-list]');
  const governanceRecruitmentEmpty = q('[data-my-faction-recruitment-empty]');
  const governanceHistory = q('[data-my-faction-history]');
  const governanceHistoryEmpty = q('[data-my-faction-history-empty]');
  const adminApplications = q('[data-faction-admin-applications]');
  const adminApplicationsEmpty = q('[data-faction-admin-applications-empty]');
  const adminRenames = q('[data-faction-admin-renames]');
  const adminRenamesEmpty = q('[data-faction-admin-renames-empty]');

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
  const editorDescription = document.querySelector('[data-faction-description]');
  const editorMotto = document.querySelector('[data-faction-motto]');
  const editorApplicationsOpen = document.querySelector('[data-faction-applications-open]');
  const editorInvitesEnabled = document.querySelector('[data-faction-invites-enabled]');
  const editorMessage = document.querySelector('[data-faction-editor-message]');
  const editorCancel = qa('[data-faction-editor-cancel]');

  const membersDialog = document.querySelector('[data-faction-members-dialog]');
  const membersTitle = document.querySelector('[data-faction-members-title]');
  const membersCurrent = document.querySelector('[data-faction-member-current]');
  const memberSearch = document.querySelector('[data-faction-member-search]');
  const memberSearchButton = document.querySelector('[data-faction-member-search-button]');
  const memberResults = document.querySelector('[data-faction-member-results]');
  const memberSearchEmpty = document.querySelector('[data-faction-member-search-empty]');
  const membersMessage = document.querySelector('[data-faction-members-message]');
  const membersClose = qa('[data-faction-members-close]');

  let memberPayload = null;
  let adminPayload = null;
  let activeFactionId = null;
  let loading = false;

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
    } catch { return ''; }
  };
  const formatDate = (value, withTime = false) => {
    if (!value) return 'Not recorded';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not recorded';
    return new Intl.DateTimeFormat('en-AU', withTime
      ? { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }
      : { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  };
  const money = (value) => `$${new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 }).format(Number(value || 0))}`;
  const titleRole = (role) => ({ leader: 'Leader', officer: 'Officer', member: 'Member' }[role] || 'Member');
  const factionInitials = (name) => String(name || 'F')
    .split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'F';

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

  const postMember = (body) => apiJson(ACCOUNT_ACTION_URL, {
    method: 'POST', body: JSON.stringify(body)
  });
  const postAdmin = (body) => apiJson(ADMIN_ACTION_URL, {
    method: 'POST', body: JSON.stringify(body)
  });

  const button = (label, handler, className = 'secondary-action compact-action') => {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = className;
    node.textContent = label;
    if (typeof handler === 'function') node.addEventListener('click', handler);
    else node.disabled = true;
    return node;
  };
  const externalLink = (label, href) => {
    const node = document.createElement('a');
    node.className = 'secondary-action compact-action';
    node.href = href;
    node.target = '_blank';
    node.rel = 'noopener noreferrer';
    node.textContent = label;
    return node;
  };
  const pill = (label, state = '') => {
    const node = document.createElement('span');
    node.className = `faction-state-pill ${state}`.trim();
    node.textContent = label;
    return node;
  };

  const actionAndReload = async (kind, body, { messageTarget = null, success = 'Faction updated.' } = {}) => {
    const target = messageTarget || adminMessage;
    try {
      showMessage(target, 'Saving faction change…', 'loading');
      const payload = kind === 'admin' ? await postAdmin(body) : await postMember(body);
      const warnings = (payload.warnings || []).filter(Boolean);
      showMessage(target, warnings.length ? `${success} ${warnings.join(' ')}` : success, warnings.length ? 'warning' : 'success');
      await loadAll({ forceAdmin: isStaff() });
      return payload;
    } catch (error) {
      showMessage(target, error.message, 'error');
      return null;
    }
  };

  const metaCell = (label, value) => {
    const cell = document.createElement('div');
    const span = document.createElement('span'); span.textContent = label;
    const strong = document.createElement('strong'); strong.textContent = String(value ?? '—');
    cell.append(span, strong);
    return cell;
  };

  const queueRow = ({ title, subtitle = '', badge = '', badgeState = '', actions = [] }) => {
    const row = document.createElement('div'); row.className = 'faction-queue-row';
    const copy = document.createElement('div'); copy.className = 'faction-queue-copy';
    const strong = document.createElement('strong'); strong.textContent = title;
    const small = document.createElement('small'); small.textContent = subtitle;
    copy.append(strong, small);
    const right = document.createElement('div'); right.className = 'faction-queue-actions';
    if (badge) right.append(pill(badge, badgeState));
    actions.forEach((action) => right.append(action));
    row.append(copy, right);
    return row;
  };

  const rosterRow = (member, faction, { selfManage = false, admin = false } = {}) => {
    const row = document.createElement('div'); row.className = 'faction-member-row';
    const identity = document.createElement('div'); identity.className = 'faction-member-identity';
    const strong = document.createElement('strong'); strong.textContent = member.psn_id || 'Unknown Survivor';
    const small = document.createElement('small');
    small.textContent = `${member.discord_name || 'Discord linked'} · ${titleRole(member.role)} · ${member.online ? 'Online' : 'Offline'}`;
    identity.append(strong, small); row.append(identity);

    const currentRole = memberPayload?.my_faction?.my_role;
    const canLead = selfManage && currentRole === 'leader';
    const canRemove = selfManage && ['leader', 'officer'].includes(currentRole) && member.role !== 'leader';
    if (admin || canLead || canRemove) {
      const actions = document.createElement('div'); actions.className = 'faction-member-actions';
      if (member.role !== 'leader') {
        if (admin || canLead) {
          actions.append(button('Make Leader', async () => {
            if (!window.confirm(`Transfer leadership of ${faction.name} to ${member.psn_id}?`)) return;
            await actionAndReload(admin ? 'admin' : 'member', {
              action: 'transfer_leader', faction_id: faction.faction_id, psn_id: member.psn_id
            }, { messageTarget: admin ? membersMessage : null, success: `${member.psn_id} is now faction leader.` });
          }));
          const roleTarget = member.role === 'officer' ? 'member' : 'officer';
          actions.append(button(member.role === 'officer' ? 'Demote' : 'Make Officer', async () => {
            await actionAndReload(admin ? 'admin' : 'member', {
              action: 'set_member_role', faction_id: faction.faction_id,
              psn_id: member.psn_id, role: roleTarget
            }, { messageTarget: admin ? membersMessage : null, success: `${member.psn_id} is now ${titleRole(roleTarget)}.` });
          }));
        }
        if (admin || canRemove) {
          actions.append(button('Remove', async () => {
            if (!window.confirm(`Remove ${member.psn_id} from ${faction.name}?`)) return;
            await actionAndReload(admin ? 'admin' : 'member', {
              action: 'remove_member', faction_id: faction.faction_id, psn_id: member.psn_id
            }, { messageTarget: admin ? membersMessage : null, success: `${member.psn_id} removed.` });
          }, 'secondary-action compact-action danger-action'));
        }
      } else {
        actions.append(pill('Faction Leader', 'active'));
      }
      row.append(actions);
    }
    return row;
  };

  const applyToFaction = async (faction) => {
    const message = window.prompt(`Apply to ${faction.name}. Optional message to faction leadership:`, '');
    if (message === null) return;
    await actionAndReload('member', { action: 'apply', faction_id: faction.faction_id, message }, {
      success: `Application sent to ${faction.name}.`
    });
  };

  const buildFactionCard = (faction) => {
    const card = document.createElement('article');
    card.className = `faction-card ${faction.status === 'suspended' ? 'is-suspended' : ''}`;
    card.style.setProperty('--faction-colour', faction.colour || '#8F1D1D');

    const header = document.createElement('div'); header.className = 'faction-card-header';
    const heading = document.createElement('div'); heading.className = 'faction-card-heading';
    const mark = document.createElement('span'); mark.className = 'faction-mark'; mark.textContent = factionInitials(faction.name);
    const titleWrap = document.createElement('div');
    const title = document.createElement('h3'); title.textContent = faction.name;
    const subtitle = document.createElement('p'); subtitle.className = 'faction-card-subtitle';
    subtitle.textContent = faction.motto || (faction.leader?.psn_id ? `Led by ${faction.leader.psn_id}` : 'Leader not assigned');
    titleWrap.append(title, subtitle); heading.append(mark, titleWrap);
    const state = faction.status === 'suspended' ? pill('Suspended', 'danger')
      : faction.applications_open ? pill('Recruiting', 'active') : pill('Active', 'neutral');
    header.append(heading, state);

    if (faction.description) {
      const description = document.createElement('p'); description.className = 'faction-description';
      description.textContent = faction.description; card.append(header, description);
    } else card.append(header);

    const meta = document.createElement('div'); meta.className = 'faction-meta';
    meta.append(
      metaCell('Leader', faction.leader?.psn_id || 'Unassigned'),
      metaCell('Members', `${faction.member_count}/${faction.member_limit}`),
      metaCell('Officers', faction.officer_count || 0),
      metaCell('Claimed flags', faction.stats?.flag_claims || 0),
      metaCell('Bounty claims', faction.stats?.bounty_claims || 0),
      metaCell('Contracts', faction.stats?.completed_contracts || 0)
    );
    card.append(meta);

    const members = document.createElement('div'); members.className = 'faction-member-list compact-roster';
    (faction.members || []).slice(0, 6).forEach((member) => members.append(rosterRow(member, faction)));
    if ((faction.members || []).length > 6) {
      const note = document.createElement('small'); note.className = 'table-note';
      note.textContent = `+ ${(faction.members || []).length - 6} more member(s)`; members.append(note);
    }
    card.append(members);

    const progress = document.createElement('div'); progress.className = 'faction-capacity';
    const bar = document.createElement('span');
    bar.style.setProperty('--faction-capacity', `${Math.min(100, Math.round((Number(faction.member_count || 0) / Math.max(1, Number(faction.member_limit || 1))) * 100))}%`);
    progress.append(bar); card.append(progress);

    const footer = document.createElement('div'); footer.className = 'faction-card-footer';
    const inviteUrl = safeUrl(faction.discord_invite_url);
    if (inviteUrl) footer.append(externalLink('Discord', inviteUrl));
    const myFaction = memberPayload?.my_faction;
    const pending = (memberPayload?.my_applications || []).some((item) => item.status === 'pending');
    if (!myFaction && faction.status === 'active' && faction.applications_open) {
      footer.append(button(pending ? 'Application Pending' : 'Apply', pending ? null : () => applyToFaction(faction),
        pending ? 'secondary-action compact-action' : 'primary-action compact-action'));
    } else if (myFaction?.faction_id === faction.faction_id) {
      footer.append(pill('Your Faction', 'active'));
    }
    card.append(footer);
    return card;
  };

  const renderDirectory = () => {
    const factions = Array.isArray(memberPayload?.factions) ? memberPayload.factions : [];
    clear(directory); factions.forEach((faction) => directory?.append(buildFactionCard(faction)));
    if (empty) empty.hidden = factions.length !== 0;

    const totals = {
      members: factions.reduce((sum, faction) => sum + Number(faction.member_count || 0), 0),
      officers: factions.reduce((sum, faction) => sum + Number(faction.officer_count || 0), 0),
      open: factions.filter((faction) => faction.status === 'active' && faction.applications_open).length,
      flags: factions.reduce((sum, faction) => sum + Number(faction.stats?.flag_claims || 0), 0),
      suspended: factions.filter((faction) => faction.status === 'suspended').length
    };
    const set = (selector, value) => { const node = q(selector); if (node) node.textContent = String(value); };
    set('[data-faction-count]', factions.length);
    set('[data-faction-member-count]', totals.members);
    set('[data-faction-officer-count]', totals.officers);
    set('[data-faction-open-count]', totals.open);
    set('[data-faction-flag-count]', totals.flags);
    set('[data-faction-suspended-count]', totals.suspended);
  };

  const renderInbox = () => {
    const invites = (memberPayload?.my_invites || []).filter((item) => item.status === 'pending');
    const applications = memberPayload?.my_applications || [];
    clear(inviteInbox); clear(applicationInbox);
    invites.forEach((invite) => {
      inviteInbox?.append(queueRow({
        title: invite.faction_name,
        subtitle: `Invited by ${invite.invited_by_name || 'Faction Staff'} · expires ${formatDate(invite.expires_at)}`,
        badge: 'Invitation', badgeState: 'active',
        actions: [
          button('Accept', () => actionAndReload('member', {
            action: 'invite_response', invite_id: invite.invite_id, accepted: true
          }, { success: `Joined ${invite.faction_name}.` }), 'primary-action compact-action'),
          button('Decline', () => actionAndReload('member', {
            action: 'invite_response', invite_id: invite.invite_id, accepted: false
          }, { success: `Invitation from ${invite.faction_name} declined.` }))
        ]
      }));
    });
    applications.slice(0, 10).forEach((application) => {
      const actions = [];
      if (application.status === 'pending') actions.push(button('Cancel', () => actionAndReload('member', {
        action: 'cancel_application', application_id: application.application_id
      }, { success: `Application to ${application.faction_name} cancelled.` })));
      applicationInbox?.append(queueRow({
        title: application.faction_name,
        subtitle: `${formatDate(application.requested_at, true)}${application.resolution_reason ? ` · ${application.resolution_reason}` : ''}`,
        badge: application.status, badgeState: application.status === 'approved' ? 'active' : application.status === 'pending' ? 'neutral' : 'danger',
        actions
      }));
    });
    if (inviteInboxEmpty) inviteInboxEmpty.hidden = invites.length !== 0;
    if (applicationInboxEmpty) applicationInboxEmpty.hidden = applications.length !== 0;
    const inviteCount = q('[data-my-faction-invite-count]'); if (inviteCount) inviteCount.textContent = `${invites.length} pending`;
    const appCount = q('[data-my-faction-application-count]'); if (appCount) appCount.textContent = `${applications.filter((i) => i.status === 'pending').length} pending`;
  };

  const editMyFactionProfile = async (faction) => {
    const description = window.prompt('Public faction description:', faction.description || '');
    if (description === null) return;
    const motto = window.prompt('Faction motto:', faction.motto || '');
    if (motto === null) return;
    const discordInvite = window.prompt('Discord invite URL (HTTPS, optional):', faction.discord_invite_url || '');
    if (discordInvite === null) return;
    const iconUrl = window.prompt('Faction icon URL (HTTPS, optional):', faction.icon_url || '');
    if (iconUrl === null) return;
    const applicationsOpen = window.confirm('Keep membership applications OPEN? Click Cancel to close applications.');
    const invitesEnabled = window.confirm('Allow leader/officer invitations? Click Cancel to disable invitations.');
    await actionAndReload('member', {
      action: 'profile_update', faction_id: faction.faction_id, description, motto,
      discord_invite_url: discordInvite, icon_url: iconUrl, applications_open: applicationsOpen,
      member_invites_enabled: invitesEnabled
    }, { success: 'Faction public profile updated.' });
  };

  const renderMyFaction = () => {
    const faction = memberPayload?.my_faction || null;
    const name = q('[data-my-faction-name]'); if (name) name.textContent = faction?.name || 'No Faction';
    const role = q('[data-my-faction-role]'); if (role) role.textContent = faction ? titleRole(faction.my_role) : 'Unassigned';
    const status = q('[data-my-faction-status]');
    if (status) {
      status.textContent = faction ? (faction.status === 'suspended' ? 'Suspended' : 'Active') : 'Unassigned';
      status.className = `faction-state-pill ${faction?.status === 'suspended' ? 'danger' : faction ? 'active' : 'neutral'}`;
    }
    const copy = q('[data-my-faction-copy]');
    if (copy) copy.textContent = faction
      ? `${faction.description || 'Faction profile ready.'}${faction.motto ? ` · “${faction.motto}”` : ''}`
      : 'You are not currently assigned to a faction. Browse active factions below and submit an application.';
    const actions = q('[data-my-faction-actions]'); clear(actions);
    if (!faction) {
      if (!memberPayload?.verified) actions?.append(pill('Verified PSN link required', 'danger'));
    } else {
      if (['leader', 'officer'].includes(faction.my_role)) {
        actions?.append(button('Edit Public Profile', () => editMyFactionProfile(faction)));
        if (faction.member_invites_enabled) actions?.append(button('Invite Survivor', async () => {
          const psn = window.prompt('Enter the exact verified PlayStation ID to invite:');
          if (!psn) return;
          await actionAndReload('member', { action: 'invite', faction_id: faction.faction_id, psn_id: psn }, {
            success: `Invitation sent to ${psn}.`
          });
        }, 'primary-action compact-action'));
      }
      if (faction.my_role === 'leader') {
        actions?.append(button('Request Rename', async () => {
          const value = window.prompt('Requested new faction name:', faction.name);
          if (!value || value.trim().toLowerCase() === faction.name.toLowerCase()) return;
          await actionAndReload('member', { action: 'rename_request', faction_id: faction.faction_id, name: value }, {
            success: 'Rename request submitted for Admin approval.'
          });
        }));
        const pendingRename = (faction.rename_requests || []).find((item) => item.status === 'pending');
        if (pendingRename) actions?.append(button('Cancel Rename Request', () => actionAndReload('member', {
          action: 'rename_cancel', request_id: pendingRename.request_id
        }, { success: 'Rename request cancelled.' })));
      } else {
        actions?.append(button('Leave Faction', async () => {
          if (!window.confirm(`Leave ${faction.name}?`)) return;
          await actionAndReload('member', { action: 'leave' }, { success: `You left ${faction.name}.` });
        }, 'secondary-action compact-action danger-action'));
      }
    }
  };

  const renderGovernance = () => {
    const faction = memberPayload?.my_faction || null;
    if (governance) governance.hidden = !faction;
    if (!faction) return;
    const stats = faction.stats || {};
    const set = (selector, value) => { const node = q(selector); if (node) node.textContent = String(value); };
    set('[data-my-faction-bank]', money(faction.bank?.balance || 0));
    set('[data-my-faction-flags]', stats.flag_claims || 0);
    set('[data-my-faction-bounties]', stats.bounty_claims || 0);
    set('[data-my-faction-contracts]', stats.completed_contracts || 0);
    set('[data-my-faction-online]', stats.online || 0);
    set('[data-my-faction-pending]', stats.pending_applications || 0);
    set('[data-my-faction-roster-count]', `${faction.member_count}/${faction.member_limit}`);

    clear(governanceRoster);
    (faction.members || []).forEach((member) => governanceRoster?.append(rosterRow(member, faction, { selfManage: true })));

    const canManage = ['leader', 'officer'].includes(faction.my_role);
    if (governanceRecruitment) governanceRecruitment.hidden = !canManage;
    clear(governanceRecruitmentList);
    if (canManage) {
      const applications = faction.pending_applications || [];
      const invites = faction.pending_invites || [];
      applications.forEach((application) => governanceRecruitmentList?.append(queueRow({
        title: `${application.applicant_psn_id} applied`,
        subtitle: `${application.message || 'No application message'} · ${formatDate(application.requested_at, true)}`,
        badge: 'Application', badgeState: 'neutral',
        actions: [
          button('Approve', () => actionAndReload('member', {
            action: 'application_review', application_id: application.application_id, approved: true
          }, { success: `${application.applicant_psn_id} joined ${faction.name}.` }), 'primary-action compact-action'),
          button('Reject', async () => {
            const reason = window.prompt('Optional rejection reason:', '') ?? '';
            await actionAndReload('member', {
              action: 'application_review', application_id: application.application_id, approved: false, reason
            }, { success: 'Application rejected.' });
          })
        ]
      })));
      invites.forEach((invite) => governanceRecruitmentList?.append(queueRow({
        title: `${invite.target_psn_id} invited`,
        subtitle: `By ${invite.invited_by_name} · expires ${formatDate(invite.expires_at)}`,
        badge: 'Pending invite', badgeState: 'active',
        actions: [button('Cancel', () => actionAndReload('member', {
          action: 'cancel_invite', invite_id: invite.invite_id
        }, { success: `Invitation to ${invite.target_psn_id} cancelled.` }))]
      })));
      if (governanceRecruitmentEmpty) governanceRecruitmentEmpty.hidden = (applications.length + invites.length) !== 0;
    }

    clear(governanceHistory);
    (faction.history || []).slice(0, 20).forEach((item) => {
      governanceHistory?.append(queueRow({
        title: item.details || item.action,
        subtitle: `${item.actor_name || 'System'} · ${formatDate(item.created_at, true)}`,
        badge: String(item.action || '').replaceAll('_', ' '), badgeState: 'neutral'
      }));
    });
    if (governanceHistoryEmpty) governanceHistoryEmpty.hidden = Boolean((faction.history || []).length);
  };

  const fillSelect = (select, options = [], selected = '') => {
    if (!select) return;
    clear(select);
    const blank = document.createElement('option'); blank.value = ''; blank.textContent = 'None'; select.append(blank);
    options.forEach((option) => {
      const node = document.createElement('option');
      node.value = option.key || option.value || '';
      node.textContent = option.label || option.name || node.value;
      node.selected = String(node.value) === String(selected || '');
      select.append(node);
    });
  };

  const openEditor = (faction = null) => {
    const editing = Boolean(faction);
    if (!editorDialog) return;
    editorId.value = editing ? String(faction.faction_id) : '';
    editorTitle.textContent = editing ? `Edit ${faction.name}` : 'Create Faction';
    editorName.value = faction?.name || '';
    editorLeader.value = faction?.leader?.psn_id || '';
    if (editorLeaderField) editorLeaderField.hidden = editing;
    if (editorLeader) editorLeader.required = !editing;
    editorArmband.value = faction?.armband || '';
    editorFlag.value = faction?.flag || '';
    editorLimit.value = String(faction?.member_limit || 10);
    editorColour.value = String(faction?.colour || '#8F1D1D').toLowerCase();
    editorZone.value = faction?.zone_id || '';
    editorInvite.value = faction?.discord_invite_url || '';
    editorIcon.value = faction?.icon_url || '';
    if (editorDescription) editorDescription.value = faction?.description || '';
    if (editorMotto) editorMotto.value = faction?.motto || '';
    if (editorApplicationsOpen) editorApplicationsOpen.checked = faction?.applications_open ?? true;
    if (editorInvitesEnabled) editorInvitesEnabled.checked = faction?.member_invites_enabled ?? true;
    fillSelect(editorRole, adminPayload?.roles || [], faction?.discord_role_key || '');
    fillSelect(editorMarker, adminPayload?.map_markers || [], faction?.map_marker_key || '');
    showMessage(editorMessage, '');
    openDialog(editorDialog);
  };

  const saveFaction = async (event) => {
    event.preventDefault();
    const editing = Boolean(editorId?.value);
    const body = {
      action: editing ? 'update' : 'create',
      faction_id: editing ? Number(editorId.value) : undefined,
      name: editorName?.value,
      leader_psn: editing ? undefined : editorLeader?.value,
      armband: editorArmband?.value,
      flag: editorFlag?.value,
      member_limit: Number(editorLimit?.value || 10),
      colour: editorColour?.value,
      discord_role_key: editorRole?.value || '',
      zone_id: editorZone?.value || '',
      map_marker_key: editorMarker?.value || '',
      discord_invite_url: editorInvite?.value || '',
      icon_url: editorIcon?.value || ''
    };
    try {
      showMessage(editorMessage, 'Saving faction…', 'loading');
      const saved = await postAdmin(body);
      const factionId = saved.faction?.faction_id || body.faction_id;
      if (factionId) {
        await postAdmin({
          action: 'profile_update', faction_id: factionId,
          description: editorDescription?.value || '', motto: editorMotto?.value || '',
          discord_invite_url: editorInvite?.value || '', icon_url: editorIcon?.value || '',
          applications_open: Boolean(editorApplicationsOpen?.checked),
          member_invites_enabled: Boolean(editorInvitesEnabled?.checked)
        });
      }
      closeDialog(editorDialog);
      showMessage(adminMessage, editing ? 'Faction updated.' : 'Faction created.', 'success');
      await loadAll({ forceAdmin: true });
    } catch (error) { showMessage(editorMessage, error.message, 'error'); }
  };

  const activeFaction = () => adminPayload?.factions?.find((faction) => Number(faction.faction_id) === Number(activeFactionId)) || null;
  const renderAdminMembers = () => {
    const faction = activeFaction(); if (!faction) return;
    if (membersTitle) membersTitle.textContent = `${faction.name} Members`;
    clear(membersCurrent);
    (faction.members || []).forEach((member) => membersCurrent?.append(rosterRow(member, faction, { admin: true })));
    clear(memberResults); if (memberSearch) memberSearch.value = ''; if (memberSearchEmpty) memberSearchEmpty.hidden = true;
  };
  const openMembers = (faction) => {
    activeFactionId = Number(faction.faction_id); renderAdminMembers(); showMessage(membersMessage, ''); openDialog(membersDialog);
  };
  const addMember = async (faction, player) => {
    const payload = await actionAndReload('admin', {
      action: 'add_member', faction_id: faction.faction_id, psn_id: player.psn_id
    }, { messageTarget: membersMessage, success: `${player.psn_id} added to ${faction.name}.` });
    if (payload) { adminPayload = await apiJson(ADMIN_URL); renderAdmin(); renderAdminMembers(); }
  };
  const searchMembers = async () => {
    const faction = activeFaction(); if (!faction) return;
    const query = String(memberSearch?.value || '').trim();
    if (query.length < 2) { showMessage(membersMessage, 'Enter at least 2 characters.', 'error'); return; }
    try {
      showMessage(membersMessage, 'Searching linked survivors…', 'loading');
      const payload = await apiJson(`${PLAYER_SEARCH_URL}?q=${encodeURIComponent(query)}`);
      const existing = new Set((faction.members || []).map((member) => String(member.psn_id || '').toLowerCase()));
      const players = (payload.players || []).filter((player) => player.linked && player.verified && !existing.has(String(player.psn_id || '').toLowerCase()));
      clear(memberResults);
      players.forEach((player) => memberResults?.append(queueRow({
        title: player.psn_id,
        subtitle: `${player.discord_name || 'Discord linked'}${player.online ? ' · Online' : ''}`,
        actions: [button('Add Member', () => addMember(faction, player), 'primary-action compact-action')]
      })));
      if (memberSearchEmpty) memberSearchEmpty.hidden = players.length !== 0;
      showMessage(membersMessage, players.length ? '' : 'No eligible linked survivors match this search.', players.length ? 'success' : 'warning');
    } catch (error) { showMessage(membersMessage, error.message, 'error'); }
  };

  const renderAdminQueues = () => {
    const applications = adminPayload?.applications || [];
    const renames = adminPayload?.rename_requests || [];
    clear(adminApplications); clear(adminRenames);
    applications.forEach((application) => adminApplications?.append(queueRow({
      title: `${application.applicant_psn_id} → ${application.faction_name}`,
      subtitle: `${application.message || 'No application message'} · ${formatDate(application.requested_at, true)}`,
      badge: 'Pending', badgeState: 'neutral',
      actions: [
        button('Approve', () => actionAndReload('admin', {
          action: 'application_review', application_id: application.application_id, approved: true
        }, { success: `${application.applicant_psn_id} approved.` }), 'primary-action compact-action'),
        button('Reject', async () => {
          const reason = window.prompt('Optional rejection reason:', '') ?? '';
          await actionAndReload('admin', {
            action: 'application_review', application_id: application.application_id, approved: false, reason
          }, { success: 'Application rejected.' });
        })
      ]
    })));
    renames.forEach((request) => adminRenames?.append(queueRow({
      title: `${request.faction_name} → ${request.requested_name}`,
      subtitle: `Requested by ${request.requested_by_name} · ${formatDate(request.requested_at, true)}`,
      badge: 'Rename', badgeState: 'neutral',
      actions: [
        button('Approve', () => actionAndReload('admin', {
          action: 'rename_review', request_id: request.request_id, approved: true
        }, { success: `Faction renamed to ${request.requested_name}.` }), 'primary-action compact-action'),
        button('Reject', async () => {
          const reason = window.prompt('Optional rejection reason:', '') ?? '';
          await actionAndReload('admin', {
            action: 'rename_review', request_id: request.request_id, approved: false, reason
          }, { success: 'Rename request rejected.' });
        })
      ]
    })));
    if (adminApplicationsEmpty) adminApplicationsEmpty.hidden = applications.length !== 0;
    if (adminRenamesEmpty) adminRenamesEmpty.hidden = renames.length !== 0;
    const appCount = q('[data-faction-admin-application-count]'); if (appCount) appCount.textContent = String(applications.length);
    const renameCount = q('[data-faction-admin-rename-count]'); if (renameCount) renameCount.textContent = String(renames.length);
  };

  const deleteFaction = async (faction) => {
    const confirmation = window.prompt(`Delete faction “${faction.name}”? Type the exact faction name to confirm.`);
    if (confirmation === null) return;
    await actionAndReload('admin', { action: 'delete', faction_id: faction.faction_id, confirmation }, {
      success: `${faction.name} deleted.`
    });
  };

  const renderAdmin = () => {
    clear(adminList);
    if (!adminPayload) return;
    renderAdminQueues();
    const factions = adminPayload.factions || [];
    factions.forEach((faction) => {
      const card = document.createElement('article');
      card.className = `faction-admin-card ${faction.status === 'suspended' ? 'is-suspended' : ''}`;
      card.style.setProperty('--faction-colour', faction.colour || '#8F1D1D');
      const header = document.createElement('div'); header.className = 'faction-admin-header';
      const titleWrap = document.createElement('div');
      const title = document.createElement('h3'); title.textContent = faction.name;
      const subtitle = document.createElement('p'); subtitle.className = 'faction-card-subtitle';
      subtitle.textContent = `${faction.member_count}/${faction.member_limit} members · ${faction.officer_count || 0} officers · ${faction.status}`;
      titleWrap.append(title, subtitle);
      const actions = document.createElement('div'); actions.className = 'faction-admin-actions';
      actions.append(
        button('Edit', () => openEditor(faction)),
        button('Roster', () => openMembers(faction)),
        button(faction.status === 'suspended' ? 'Reactivate' : 'Suspend', async () => {
          const next = faction.status === 'suspended' ? 'active' : 'suspended';
          const reason = window.prompt(`Reason for setting ${faction.name} to ${next}:`, '') ?? '';
          await actionAndReload('admin', { action: 'status', faction_id: faction.faction_id, status: next, reason }, {
            success: `${faction.name} is now ${next}.`
          });
        }, faction.status === 'suspended' ? 'primary-action compact-action' : 'secondary-action compact-action danger-action'),
        button('Admin Note', async () => {
          const note = window.prompt(`Private Admin note for ${faction.name}:`, faction.admin_note || '');
          if (note === null) return;
          await actionAndReload('admin', { action: 'admin_note', faction_id: faction.faction_id, note }, {
            success: 'Private Admin note updated.'
          });
        }),
        button('Bank Adjust', async () => {
          const raw = window.prompt(`Adjust ${faction.name} bank. Use a negative number to debit. Current: ${money(faction.bank?.balance || 0)}`, '0');
          if (raw === null) return;
          const amount = Number.parseInt(raw, 10);
          if (!Number.isFinite(amount) || amount === 0) { showMessage(adminMessage, 'Enter a non-zero whole number.', 'error'); return; }
          const note = window.prompt('Bank ledger note:', '') ?? '';
          await actionAndReload('admin', { action: 'bank_adjust', faction_id: faction.faction_id, amount, note }, {
            success: 'Faction bank updated.'
          });
        }),
        button('Delete', () => deleteFaction(faction), 'secondary-action compact-action danger-action')
      );
      header.append(titleWrap, actions); card.append(header);

      const meta = document.createElement('div'); meta.className = 'faction-meta faction-admin-meta';
      meta.append(
        metaCell('Leader', faction.leader?.psn_id || 'Unassigned'),
        metaCell('Bank', money(faction.bank?.balance || 0)),
        metaCell('Flag claims', faction.stats?.flag_claims || 0),
        metaCell('Bounty claims', faction.stats?.bounty_claims || 0),
        metaCell('Contracts completed', faction.stats?.completed_contracts || 0),
        metaCell('Pending applications', faction.stats?.pending_applications || 0)
      );
      card.append(meta);
      if (faction.admin_note) {
        const note = document.createElement('div'); note.className = 'faction-admin-note';
        const strong = document.createElement('strong'); strong.textContent = 'Private Admin Note';
        const p = document.createElement('p'); p.textContent = faction.admin_note; note.append(strong, p); card.append(note);
      }
      const recent = (faction.history || [])[0];
      if (recent) {
        const foot = document.createElement('small'); foot.className = 'faction-admin-recent';
        foot.textContent = `Latest: ${recent.details || recent.action} · ${formatDate(recent.created_at, true)}`; card.append(foot);
      }
      adminList?.append(card);
    });
    if (adminEmpty) adminEmpty.hidden = factions.length !== 0;
  };

  const loadAll = async ({ forceAdmin = false } = {}) => {
    if (loading) return;
    const sessionToken = token();
    if (!sessionToken) {
      memberPayload = null; adminPayload = null;
      if (guest) guest.hidden = false; if (content) content.hidden = true; return;
    }
    loading = true; refreshButton?.setAttribute('disabled', '');
    try {
      memberPayload = await apiJson(ACCOUNT_URL);
      adminPayload = (isStaff() || forceAdmin) ? await apiJson(ADMIN_URL) : null;
      if (guest) guest.hidden = true; if (content) content.hidden = false; if (errorBox) errorBox.hidden = true;
      renderMyFaction(); renderInbox(); renderGovernance(); renderDirectory(); renderAdmin();
    } catch (error) {
      if (error.status === 401) { if (guest) guest.hidden = false; if (content) content.hidden = true; }
      else if (errorBox) { errorBox.textContent = error.message; errorBox.hidden = false; }
    } finally { loading = false; refreshButton?.removeAttribute('disabled'); }
  };

  refreshButton?.addEventListener('click', () => loadAll({ forceAdmin: isStaff() }));
  adminRefreshButton?.addEventListener('click', () => loadAll({ forceAdmin: true }));
  createButton?.addEventListener('click', () => openEditor(null));
  editorForm?.addEventListener('submit', saveFaction);
  editorCancel.forEach((node) => node.addEventListener('click', () => closeDialog(editorDialog)));
  membersClose.forEach((node) => node.addEventListener('click', () => closeDialog(membersDialog)));
  memberSearchButton?.addEventListener('click', searchMembers);
  memberSearch?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { event.preventDefault(); searchMembers(); }
  });

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
  window.addEventListener('wwz:serverchange', () => {
    memberPayload = null; adminPayload = null; activeFactionId = null;
    if (panel.classList.contains('active')) loadAll({ forceAdmin: isStaff() });
  });

  window.__wwzFactionsReady = true;
  if (panel.classList.contains('active')) loadAll({ forceAdmin: isStaff() });
})();
