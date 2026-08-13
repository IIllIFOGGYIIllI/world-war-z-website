(() => {
  'use strict';

  const ACCOUNT_TICKETS_URL = `${DASHBOARD_API_BASE}/api/account/tickets`;
  const ACCOUNT_TICKET_ACTION_URL = `${DASHBOARD_API_BASE}/api/account/tickets/action`;
  const accountTicketTranscriptUrl = (ticketNumber) => `${DASHBOARD_API_BASE}/api/account/tickets/${Number(ticketNumber)}/transcript`;
  const ADMIN_TICKETS_URL = `${DASHBOARD_API_BASE}/api/admin/tickets`;
  const ADMIN_TICKET_ACTION_URL = `${DASHBOARD_API_BASE}/api/admin/tickets/action`;
  const adminTicketTranscriptUrl = (ticketNumber) => `${DASHBOARD_API_BASE}/api/admin/tickets/${Number(ticketNumber)}/transcript`;
  const ADMIN_TICKET_MEMBER_SEARCH_URL = `${DASHBOARD_API_BASE}/api/admin/tickets/members`;
  const ADMIN_TICKET_BLACKLIST_ACTION_URL = `${DASHBOARD_API_BASE}/api/admin/tickets/blacklist/action`;
  const OWNER_TICKET_CONFIG_URL = `${DASHBOARD_API_BASE}/api/owner/tickets/config`;
  const POLL_MS = 15_000;

  const qs = (selector) => document.querySelector(selector);
  const qsa = (selector) => [...document.querySelectorAll(selector)];
  const guest = qs('[data-ticket-guest]');
  const memberContent = qs('[data-ticket-member-content]');
  const memberList = qs('[data-member-ticket-list]');
  const memberEmpty = qs('[data-member-ticket-empty]');
  const memberError = qs('[data-member-ticket-error]');
  const memberFilter = qs('[data-ticket-member-filter]');
  const refreshMember = qs('[data-refresh-member-tickets]');
  const openCreateButtons = qsa('[data-open-ticket-create]');
  const createDialog = qs('[data-ticket-create-dialog]');
  const createForm = qs('[data-ticket-create-form]');
  const createCategory = qs('[data-ticket-create-category]');
  const createSubject = qs('[data-ticket-create-subject]');
  const createDescription = qs('[data-ticket-create-description]');
  const createMessage = qs('[data-ticket-create-message]');
  const createCancel = qsa('[data-ticket-create-cancel]');
  const createSubmit = qs('[data-ticket-create-submit]');
  const detailDialog = qs('[data-ticket-detail-dialog]');
  const detailTitle = qs('[data-ticket-detail-title]');
  const detailMeta = qs('[data-ticket-detail-meta]');
  const detailDescription = qs('[data-ticket-detail-description]');
  const detailActions = qs('[data-ticket-detail-actions]');
  const memberThread = qs('[data-ticket-message-thread]');
  const memberThreadState = qs('[data-ticket-thread-state]');
  const memberReply = qs('[data-ticket-member-reply]');
  const memberReplySend = qs('[data-ticket-member-reply-send]');
  const detailMessage = qs('[data-ticket-detail-message]');
  const detailClose = qsa('[data-ticket-detail-close]');
  const memberCloseButton = qs('[data-ticket-member-close]');
  const memberCloseField = qs('[data-ticket-close-field]');
  const memberCloseReason = qs('[data-ticket-close-reason]');
  const ratingPanel = qs('[data-ticket-rating-panel]');
  const ratingButtons = qsa('[data-ticket-rate]');
  const memberTranscriptButton = qs('[data-ticket-member-transcript]');

  const adminShell = qs('[data-ticket-admin-shell]');
  const adminList = qs('[data-admin-ticket-list]');
  const adminEmpty = qs('[data-admin-ticket-empty]');
  const adminError = qs('[data-admin-ticket-error]');
  const adminSearch = qs('[data-admin-ticket-search]');
  const adminScope = qs('[data-admin-ticket-scope]');
  const refreshAdmin = qs('[data-refresh-admin-tickets]');
  const adminDetail = qs('[data-admin-ticket-detail]');
  const adminDetailPlaceholder = qs('[data-admin-ticket-detail-placeholder]');
  const adminDetailTitle = qs('[data-admin-ticket-detail-title]');
  const adminDetailStatus = qs('[data-admin-ticket-detail-status]');
  const adminDetailMeta = qs('[data-admin-ticket-detail-meta]');
  const adminNotes = qs('[data-admin-ticket-notes]');
  const adminParticipants = qs('[data-admin-ticket-participants]');
  const adminTimeline = qs('[data-admin-ticket-actions]');
  const adminThread = qs('[data-admin-ticket-message-thread]');
  const adminThreadState = qs('[data-admin-ticket-thread-state]');
  const adminReply = qs('[data-admin-ticket-reply]');
  const adminReplySend = qs('[data-admin-ticket-reply-send]');
  const adminTranscriptLink = qs('[data-admin-ticket-transcript-link]');
  const adminWebsiteTranscript = qs('[data-admin-ticket-website-transcript]');
  const adminMessage = qs('[data-admin-ticket-message]');
  const adminPriority = qs('[data-admin-ticket-priority]');
  const adminTag = qs('[data-admin-ticket-tag]');
  const adminNote = qs('[data-admin-ticket-note]');
  const adminActionButtons = qsa('[data-admin-ticket-action]');
  const savePriority = qs('[data-save-ticket-priority]');
  const saveTag = qs('[data-save-ticket-tag]');
  const addNote = qs('[data-add-ticket-note]');
  const participantSearch = qs('[data-ticket-participant-search]');
  const participantResults = qs('[data-ticket-participant-results]');
  const addParticipant = qs('[data-add-ticket-participant]');

  const blacklistSearch = qs('[data-ticket-blacklist-search]');
  const blacklistResults = qs('[data-ticket-blacklist-results]');
  const blacklistReason = qs('[data-ticket-blacklist-reason]');
  const blacklistAdd = qs('[data-ticket-blacklist-add]');
  const blacklistList = qs('[data-ticket-blacklist-list]');

  const ownerConfig = qs('[data-ticket-owner-config], .ticket-owner-config');
  const configState = qs('[data-ticket-config-state]');
  const configPanel = qs('[data-ticket-config-panel]');
  const configOpen = qs('[data-ticket-config-open-category]');
  const configClosed = qs('[data-ticket-config-closed-category]');
  const configTranscript = qs('[data-ticket-config-transcript]');
  const configRole = qs('[data-ticket-config-role]');
  const configOverflow = qs('[data-ticket-config-overflow]');
  const configSave = qs('[data-ticket-config-save]');
  const configEnable = qs('[data-ticket-config-enable]');
  const configDisable = qs('[data-ticket-config-disable]');
  const configAdvancedSave = qs('[data-ticket-advanced-save]');
  const configAdvancedReset = qs('[data-ticket-advanced-reset]');
  const configCategorySettings = qs('[data-ticket-category-settings]');
  const configSettingInputs = qsa('[data-ticket-setting]');
  const configMessage = qs('[data-ticket-config-message]');

  const confirmDialog = qs('[data-ticket-admin-confirm-dialog]');
  const confirmForm = qs('[data-ticket-admin-confirm-form]');
  const confirmTitle = qs('[data-ticket-admin-confirm-title]');
  const confirmCopy = qs('[data-ticket-admin-confirm-copy]');
  const confirmReasonField = qs('[data-ticket-admin-confirm-reason-field]');
  const confirmReason = qs('[data-ticket-admin-confirm-reason]');
  const confirmMessage = qs('[data-ticket-admin-confirm-message]');
  const confirmSubmit = qs('[data-ticket-admin-confirm-submit]');
  const confirmCancel = qsa('[data-ticket-admin-confirm-cancel]');

  let memberPayload = null;
  let selectedMemberTicket = null;
  let adminPayload = null;
  let selectedAdminTicket = null;
  let pendingAdminAction = null;
  let requestBusy = false;
  let adminSearchTimer = 0;
  let participantSearchTimer = 0;
  let blacklistSearchTimer = 0;
  let pollTimer = 0;
  let ownerConfigPayload = null;

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
  const formatDate = (value) => {
    if (!value) return 'Not recorded';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not recorded';
    return new Intl.DateTimeFormat('en-AU', {
      day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit'
    }).format(date);
  };
  const formatDurationShort = (seconds) => {
    const value = Math.max(0, Number(seconds) || 0);
    if (!value) return '—';
    const hours = Math.round(value / 3600);
    if (hours < 24) return `${hours}h`;
    const days = Math.round(hours / 24);
    return `${days}d`;
  };
  const titleCase = (value) => String(value || 'unknown')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  const isStaff = () => ['staff', 'owner'].includes(dashboardAccessLevel);
  const isOwner = () => dashboardAccessLevel === 'owner';
  const token = () => storageGet(AUTH_SESSION_KEY);

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
      const error = new Error(payload.message || 'The ticket service could not complete that request.');
      error.status = response.status;
      throw error;
    }
    return payload;
  };

  const openWebsiteTranscript = async (url, messageTarget) => {
    const sessionToken = token();
    if (!sessionToken) return showMessage(messageTarget, 'Sign in with Discord to continue.', 'error');
    const popup = window.open('', '_blank');
    if (!popup) return showMessage(messageTarget, 'Allow pop-ups for this site to open archived transcripts.', 'error');
    try {
      popup.document.write('<title>Loading transcript…</title><p style="font-family:sans-serif;padding:2rem">Loading archived ticket transcript…</p>');
      const response = await authFetch(url, {
        headers: { Accept: 'text/html', Authorization: `Bearer ${sessionToken}` }
      });
      const body = await response.text();
      if (!response.ok) {
        let message = 'The archived website transcript could not be opened.';
        try { message = JSON.parse(body).message || message; } catch {}
        throw new Error(message);
      }
      const blobUrl = URL.createObjectURL(new Blob([body], { type: 'text/html;charset=utf-8' }));
      popup.location.replace(blobUrl);
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      popup.close();
      showMessage(messageTarget, error.message, 'error');
    }
  };

  const statusPill = (status) => {
    const span = document.createElement('span');
    span.className = 'ticket-status-pill';
    span.dataset.state = String(status || 'unknown');
    span.textContent = titleCase(status);
    return span;
  };

  const metaGrid = (entries) => {
    const fragment = document.createDocumentFragment();
    entries.forEach(([label, value]) => {
      const cell = document.createElement('div');
      const span = document.createElement('span');
      const strong = document.createElement('strong');
      span.textContent = label;
      strong.textContent = value || '—';
      cell.append(span, strong);
      fragment.append(cell);
    });
    return fragment;
  };

  const renderTimeline = (container, actions = []) => {
    if (!container) return;
    container.replaceChildren();
    if (!actions.length) {
      const empty = document.createElement('p');
      empty.className = 'table-note';
      empty.textContent = 'No ticket activity has been recorded yet.';
      container.append(empty);
      return;
    }
    actions.forEach((row) => {
      const item = document.createElement('div');
      item.className = 'ticket-timeline-row';
      const strong = document.createElement('strong');
      const small = document.createElement('small');
      const copy = document.createElement('p');
      strong.textContent = titleCase(row.action);
      small.textContent = `${row.actor || 'World War Z Bot'} · ${formatDate(row.created_at)}`;
      copy.textContent = row.details || '';
      item.append(strong, small, copy);
      container.append(item);
    });
  };

  const renderTicketThread = (container, messages = [], available = false) => {
    if (!container) return;
    container.replaceChildren();
    if (!available) {
      const empty = document.createElement('p');
      empty.className = 'ticket-thread-empty';
      empty.textContent = 'The linked Discord ticket channel is unavailable. Permanent ticket history and archived transcripts remain available.';
      container.append(empty);
      return;
    }
    if (!messages.length) {
      const empty = document.createElement('p');
      empty.className = 'ticket-thread-empty';
      empty.textContent = 'No conversation messages yet. Replies sent here and in Discord appear in this same thread.';
      container.append(empty);
      return;
    }
    messages.forEach((message) => {
      const row = document.createElement('article');
      row.className = 'ticket-message-row';
      row.dataset.role = ['member', 'staff', 'participant'].includes(message.role) ? message.role : 'participant';
      const head = document.createElement('div');
      head.className = 'ticket-message-row-head';
      const author = document.createElement('strong');
      const time = document.createElement('small');
      author.textContent = message.author || 'Discord member';
      time.textContent = formatDate(message.created_at);
      head.append(author, time);
      row.append(head);
      if (message.content) {
        const copy = document.createElement('p');
        copy.textContent = message.content;
        row.append(copy);
      }
      const attachments = Array.isArray(message.attachments) ? message.attachments : [];
      if (attachments.length) {
        const list = document.createElement('div');
        list.className = 'ticket-message-attachments';
        attachments.forEach((attachment) => {
          const link = document.createElement('a');
          link.href = attachment.url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = attachment.name || 'Attachment';
          list.append(link);
        });
        row.append(list);
      }
      const source = document.createElement('span');
      source.className = 'ticket-message-source';
      source.textContent = message.source === 'dashboard' ? 'Dashboard → Discord' : 'Discord';
      row.append(source);
      container.append(row);
    });
    container.scrollTop = container.scrollHeight;
  };

  const renderMemberTickets = () => {
    if (!memberList || !memberPayload) return;
    const filter = memberFilter?.value || 'all';
    const rows = (memberPayload.tickets || []).filter((ticket) => {
      if (filter === 'open') return ['creating', 'open'].includes(ticket.status);
      if (filter === 'closed') return ['closed', 'deleted'].includes(ticket.status);
      return true;
    });
    memberList.replaceChildren();
    rows.forEach((ticket) => {
      const card = document.createElement('article');
      card.className = 'ticket-card';
      const head = document.createElement('div');
      head.className = 'ticket-card-head';
      const title = document.createElement('div');
      title.className = 'ticket-card-title';
      const strong = document.createElement('strong');
      const small = document.createElement('small');
      strong.textContent = `#${ticket.ticket_number} · ${ticket.subject}`;
      small.textContent = `${ticket.category} · ${formatDate(ticket.created_at)}`;
      title.append(strong, small);
      head.append(title, statusPill(ticket.status));
      const copy = document.createElement('div');
      copy.className = 'ticket-card-copy';
      copy.textContent = `${titleCase(ticket.priority)} priority · ${ticket.tag}${ticket.claimed_by ? ` · Claimed by ${ticket.claimed_by}` : ' · Awaiting staff claim'}`;
      const actions = document.createElement('div');
      actions.className = 'ticket-card-actions';
      const view = document.createElement('button');
      view.type = 'button';
      view.className = 'secondary-action compact-action';
      view.textContent = 'View Ticket';
      view.addEventListener('click', () => openMemberTicket(ticket.ticket_number));
      actions.append(view);
      if (ticket.status === 'open' && memberPayload?.system?.allow_member_close !== false) {
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'danger-action compact-action';
        close.textContent = 'Close';
        close.addEventListener('click', async () => {
          await openMemberTicket(ticket.ticket_number);
          memberCloseReason?.focus();
        });
        actions.append(close);
      }
      card.append(head, copy, actions);
      memberList.append(card);
    });
    if (memberEmpty) memberEmpty.hidden = rows.length !== 0;
  };

  const renderMemberSummary = () => {
    if (!memberPayload) return;
    const system = memberPayload.system || {};
    const set = (selector, value) => { const el = qs(selector); if (el) el.textContent = value; };
    set('[data-ticket-system-state]', system.enabled ? 'Online' : system.configured ? 'Disabled' : 'Not configured');
    set('[data-ticket-open-count]', String(system.open_count ?? 0));
    set('[data-ticket-open-limit]', `Maximum ${system.max_open_per_member ?? '—'}`);
    set('[data-ticket-total-count]', String(memberPayload.ticket_count ?? 0));
    set('[data-ticket-inactivity]', system.auto_close_enabled === false ? 'Disabled' : `${system.auto_close_warning_hours ?? '—'}h → ${system.auto_close_hours ?? '—'}h`);
  };

  const populateCreateCategories = (categories = []) => {
    if (!createCategory) return;
    createCategory.replaceChildren();
    categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category.key;
      option.textContent = `${category.emoji || '🎟️'} ${category.label}`;
      option.title = category.description || '';
      createCategory.append(option);
    });
  };

  const loadMemberTickets = async ({ quiet = false } = {}) => {
    const sessionToken = token();
    if (!sessionToken) {
      guest?.removeAttribute('hidden');
      memberContent?.setAttribute('hidden', '');
      openCreateButtons.forEach((button) => { button.disabled = true; });
      return;
    }
    if (!quiet) refreshMember?.setAttribute('aria-busy', 'true');
    try {
      memberPayload = await apiJson(ACCOUNT_TICKETS_URL);
      guest?.setAttribute('hidden', '');
      memberContent?.removeAttribute('hidden');
      openCreateButtons.forEach((button) => { button.disabled = !memberPayload.system?.enabled; });
      populateCreateCategories(memberPayload.categories || []);
      renderMemberSummary();
      renderMemberTickets();
      if (memberError) memberError.hidden = true;
    } catch (error) {
      if (memberError) {
        memberError.textContent = error.message;
        memberError.hidden = false;
      }
    } finally {
      refreshMember?.removeAttribute('aria-busy');
    }
  };

  const openMemberTicket = async (ticketNumber, { quiet = false } = {}) => {
    showMessage(detailMessage, '');
    try {
      const payload = await apiJson(`${ACCOUNT_TICKETS_URL}/${Number(ticketNumber)}`);
      selectedMemberTicket = payload.ticket;
      if (detailTitle) detailTitle.textContent = `Ticket #${selectedMemberTicket.ticket_number} · ${selectedMemberTicket.subject}`;
      detailMeta?.replaceChildren(metaGrid([
        ['Status', titleCase(selectedMemberTicket.status)],
        ['Category', selectedMemberTicket.category],
        ['Priority', titleCase(selectedMemberTicket.priority)],
        ['Tag', selectedMemberTicket.tag],
        ['Claimed by', selectedMemberTicket.claimed_by || 'Awaiting staff'],
        ['Last activity', formatDate(selectedMemberTicket.last_activity_at)],
      ]));
      if (detailDescription) detailDescription.textContent = selectedMemberTicket.description || 'No details supplied.';
      renderTimeline(detailActions, selectedMemberTicket.actions || []);
      renderTicketThread(memberThread, selectedMemberTicket.messages || [], Boolean(selectedMemberTicket.discord_thread_available));
      if (memberThreadState) memberThreadState.textContent = selectedMemberTicket.discord_thread_available ? 'Live Discord Sync' : 'Discord Unavailable';
      const open = selectedMemberTicket.status === 'open';
      if (memberReply) memberReply.disabled = !open || !selectedMemberTicket.discord_thread_available;
      if (memberReplySend) memberReplySend.disabled = !open || !selectedMemberTicket.discord_thread_available || requestBusy;
      const system = memberPayload?.system || {};
      const canMemberClose = open && system.allow_member_close !== false;
      if (memberCloseField) memberCloseField.hidden = !canMemberClose;
      if (memberCloseButton) memberCloseButton.hidden = !canMemberClose;
      if (memberCloseReason) memberCloseReason.required = Boolean(system.require_close_reason);
      const canReview = selectedMemberTicket.status === 'closed' && selectedMemberTicket.rating == null && system.feedback_enabled !== false && system.reviews_enabled !== false;
      if (ratingPanel) ratingPanel.hidden = !canReview;
      ratingButtons.forEach((button) => { button.disabled = selectedMemberTicket.rating != null || system.reviews_enabled === false; });
      if (memberTranscriptButton) memberTranscriptButton.hidden = !selectedMemberTicket.website_transcript_available || system.owner_transcript_access === false;
      if (!quiet) openDialog(detailDialog);
    } catch (error) {
      showMessage(memberError, error.message, 'error');
    }
  };

  const memberAction = async (action, extra = {}) => {
    if (!selectedMemberTicket || requestBusy) return;
    requestBusy = true;
    showMessage(detailMessage, '');
    try {
      const payload = await apiJson(ACCOUNT_TICKET_ACTION_URL, {
        method: 'POST',
        body: JSON.stringify({ action, ticket_number: selectedMemberTicket.ticket_number, ...extra })
      });
      selectedMemberTicket = payload.ticket;
      showMessage(detailMessage, payload.message || 'Ticket synchronized.', 'success');
      await loadMemberTickets({ quiet: true });
      await openMemberTicket(selectedMemberTicket.ticket_number, { quiet: true });
      return true;
    } catch (error) {
      showMessage(detailMessage, error.message, 'error');
      return false;
    } finally {
      requestBusy = false;
      if (memberReplySend) memberReplySend.disabled = selectedMemberTicket?.status !== 'open' || !selectedMemberTicket?.discord_thread_available;
    }
  };

  const createTicket = async () => {
    if (requestBusy) return;
    requestBusy = true;
    createSubmit?.setAttribute('disabled', '');
    showMessage(createMessage, '');
    try {
      const payload = await apiJson(ACCOUNT_TICKET_ACTION_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'create',
          category_key: createCategory?.value,
          subject: createSubject?.value.trim(),
          description: createDescription?.value.trim(),
        })
      });
      showMessage(createMessage, 'Private Discord ticket created and synchronized.', 'success');
      await loadMemberTickets({ quiet: true });
      window.setTimeout(() => {
        closeDialog(createDialog);
        createForm?.reset();
        if (payload.ticket?.ticket_number) openMemberTicket(payload.ticket.ticket_number);
      }, 350);
    } catch (error) {
      showMessage(createMessage, error.message, 'error');
    } finally {
      requestBusy = false;
      createSubmit?.removeAttribute('disabled');
    }
  };

  const renderBlacklist = (rows = []) => {
    if (!blacklistList) return;
    blacklistList.replaceChildren();
    if (!rows.length) {
      const empty = document.createElement('p');
      empty.className = 'table-note';
      empty.textContent = 'No members are currently blocked from opening tickets.';
      blacklistList.append(empty);
      return;
    }
    rows.forEach((row) => {
      const item = document.createElement('div');
      item.className = 'ticket-blacklist-row';
      const copy = document.createElement('div');
      const strong = document.createElement('strong');
      const small = document.createElement('small');
      strong.textContent = row.member;
      small.textContent = `${row.reason} · Added by ${row.administrator} · ${formatDate(row.created_at)}`;
      copy.append(strong, small);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'secondary-action compact-action';
      remove.textContent = 'Remove';
      remove.disabled = !row.blacklist_key;
      remove.addEventListener('click', () => updateBlacklist('remove', { blacklist_key: row.blacklist_key }));
      item.append(copy, remove);
      blacklistList.append(item);
    });
  };

  const renderAdminList = () => {
    if (!adminList || !adminPayload) return;
    const rows = adminPayload.tickets || [];
    adminList.replaceChildren();
    rows.forEach((ticket) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `ticket-admin-row${selectedAdminTicket?.ticket_number === ticket.ticket_number ? ' active' : ''}`;
      const copy = document.createElement('div');
      const strong = document.createElement('strong');
      const small = document.createElement('small');
      strong.textContent = `#${ticket.ticket_number} · ${ticket.subject}`;
      small.textContent = `${ticket.owner} · ${ticket.category} · ${ticket.tag}`;
      copy.append(strong, small);
      const meta = document.createElement('div');
      meta.className = 'ticket-admin-row-meta';
      meta.append(statusPill(ticket.status));
      const date = document.createElement('small');
      date.textContent = formatDate(ticket.last_activity_at);
      meta.append(date);
      button.append(copy, meta);
      button.addEventListener('click', () => loadAdminDetail(ticket.ticket_number));
      adminList.append(button);
    });
    if (adminEmpty) adminEmpty.hidden = rows.length !== 0;
    const stats = adminPayload.stats || {};
    const set = (selector, value) => { const el = qs(selector); if (el) el.textContent = value; };
    set('[data-admin-ticket-total]', String(stats.total ?? '—'));
    set('[data-admin-ticket-open]', String(stats.open ?? '—'));
    set('[data-admin-ticket-closed]', String(stats.closed ?? '—'));
    set('[data-admin-ticket-rating]', stats.avg_rating == null ? 'No ratings' : `${Number(stats.avg_rating).toFixed(1)} / 5`);
    set('[data-ticket-average-close]', stats.avg_close == null ? 'No history' : formatDurationShort(stats.avg_close));
    set('[data-ticket-rating-count]', String(stats.rating_count ?? 0));
    set('[data-ticket-staff-claimed]', String(stats.staff?.claimed ?? 0));
    set('[data-ticket-staff-closed]', String(stats.staff?.closed ?? 0));
    const leaders = qs('[data-ticket-staff-leaders]');
    const leadersEmpty = qs('[data-ticket-staff-leaders-empty]');
    leaders?.replaceChildren();
    (stats.leaders || []).forEach((leader, index) => {
      const item = document.createElement('li');
      const rank = document.createElement('span');
      const copy = document.createElement('strong');
      const count = document.createElement('small');
      rank.textContent = `#${index + 1}`;
      copy.textContent = leader.name || 'Staff';
      count.textContent = `${Number(leader.closed_count || 0).toLocaleString('en-AU')} closed`;
      item.append(rank, copy, count);
      leaders?.append(item);
    });
    if (leadersEmpty) leadersEmpty.hidden = Boolean((stats.leaders || []).length);
    renderBlacklist(adminPayload.blacklist || []);
  };

  const loadAdminTickets = async ({ quiet = false } = {}) => {
    if (!isStaff() || !token()) return;
    if (!quiet) refreshAdmin?.setAttribute('aria-busy', 'true');
    try {
      const params = new URLSearchParams({ scope: adminScope?.value || 'open' });
      const query = adminSearch?.value.trim();
      if (query) params.set('q', query);
      adminPayload = await apiJson(`${ADMIN_TICKETS_URL}?${params}`);
      renderAdminList();
      if (adminError) adminError.hidden = true;
    } catch (error) {
      if (adminError) {
        adminError.textContent = error.message;
        adminError.hidden = false;
      }
    } finally {
      refreshAdmin?.removeAttribute('aria-busy');
    }
  };

  const renderAdminDetail = () => {
    const ticket = selectedAdminTicket;
    if (!ticket || !adminDetail) return;
    adminDetailPlaceholder?.setAttribute('hidden', '');
    adminDetail.removeAttribute('hidden');
    if (adminDetailTitle) adminDetailTitle.textContent = `#${ticket.ticket_number} · ${ticket.subject}`;
    if (adminDetailStatus) adminDetailStatus.textContent = titleCase(ticket.status);
    adminDetailMeta?.replaceChildren(metaGrid([
      ['Owner', ticket.owner],
      ['Category', ticket.category],
      ['Status', titleCase(ticket.status)],
      ['Priority', titleCase(ticket.priority)],
      ['Tag', ticket.tag],
      ['Claimed by', ticket.claimed_by || 'Unclaimed'],
      ['Created', formatDate(ticket.created_at)],
      ['Last activity', formatDate(ticket.last_activity_at)],
      ['Request', ticket.description],
      ['Close reason', ticket.close_reason || '—'],
    ]));
    if (adminPriority) adminPriority.value = ticket.priority || 'normal';
    if (adminTag) adminTag.value = ticket.tag || '';
    renderTicketThread(adminThread, ticket.messages || [], Boolean(ticket.discord_thread_available));
    if (adminThreadState) adminThreadState.textContent = ticket.discord_thread_available ? 'Live Discord Sync' : 'Discord Unavailable';
    if (adminReply) adminReply.disabled = ticket.status !== 'open' || !ticket.discord_thread_available;
    if (adminReplySend) adminReplySend.disabled = ticket.status !== 'open' || !ticket.discord_thread_available || requestBusy;
    if (adminTranscriptLink) {
      const transcriptUrl = String(ticket.transcript_url || '');
      const safeTranscriptUrl = /^https:\/\/(?:ptb\.|canary\.)?discord\.com\//i.test(transcriptUrl);
      adminTranscriptLink.hidden = !safeTranscriptUrl;
      if (safeTranscriptUrl) adminTranscriptLink.href = transcriptUrl;
      else adminTranscriptLink.removeAttribute('href');
    }
    if (adminWebsiteTranscript) adminWebsiteTranscript.hidden = !ticket.website_transcript_available;

    adminActionButtons.forEach((button) => {
      const action = button.dataset.adminTicketAction;
      let disabled = false;
      if (action === 'claim') disabled = ticket.status !== 'open' || Boolean(ticket.claimed_by) || adminPayload?.policy?.claiming_enabled === false;
      if (action === 'unclaim') disabled = ticket.status !== 'open' || !ticket.claimed_by;
      if (action === 'close') disabled = ticket.status !== 'open';
      if (action === 'reopen') disabled = ticket.status !== 'closed';
      if (action === 'delete') disabled = ticket.status !== 'closed';
      if (action === 'transcript') disabled = !['open', 'closed'].includes(ticket.status);
      button.disabled = disabled || requestBusy;
    });

    adminNotes?.replaceChildren();
    (ticket.notes || []).forEach((note) => {
      const row = document.createElement('div');
      row.className = 'ticket-note-row';
      const strong = document.createElement('strong');
      const small = document.createElement('small');
      const copy = document.createElement('p');
      strong.textContent = note.author;
      small.textContent = formatDate(note.created_at);
      copy.textContent = note.note;
      copy.style.margin = '0';
      row.append(strong, small, copy);
      adminNotes.append(row);
    });
    if (!(ticket.notes || []).length && adminNotes) {
      const empty = document.createElement('p'); empty.className = 'table-note'; empty.textContent = 'No private staff notes.'; adminNotes.append(empty);
    }

    adminParticipants?.replaceChildren();
    (ticket.participants || []).forEach((participant) => {
      const row = document.createElement('div');
      row.className = 'ticket-participant-row';
      const copy = document.createElement('div');
      const strong = document.createElement('strong');
      const small = document.createElement('small');
      strong.textContent = participant.name;
      small.textContent = `Added ${formatDate(participant.added_at)}`;
      copy.append(strong, small);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'secondary-action compact-action';
      remove.textContent = 'Remove';
      remove.disabled = !participant.key;
      remove.addEventListener('click', () => submitAdminAction('participant_remove', { participant_key: participant.key }));
      row.append(copy, remove);
      adminParticipants.append(row);
    });
    if (!(ticket.participants || []).length && adminParticipants) {
      const empty = document.createElement('p'); empty.className = 'table-note'; empty.textContent = 'No additional participants.'; adminParticipants.append(empty);
    }
    renderTimeline(adminTimeline, ticket.actions || []);
    renderAdminList();
  };

  const loadAdminDetail = async (ticketNumber, { quiet = false } = {}) => {
    if (!isStaff()) return;
    try {
      const payload = await apiJson(`${ADMIN_TICKETS_URL}/${Number(ticketNumber)}`);
      selectedAdminTicket = payload.ticket;
      renderAdminDetail();
      if (!quiet) adminDetail?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
      showMessage(adminMessage, error.message, 'error');
    }
  };

  const submitAdminAction = async (action, extra = {}) => {
    if (!selectedAdminTicket || requestBusy) return;
    requestBusy = true;
    showMessage(adminMessage, '');
    try {
      const payload = await apiJson(ADMIN_TICKET_ACTION_URL, {
        method: 'POST',
        body: JSON.stringify({ action, ticket_number: selectedAdminTicket.ticket_number, ...extra })
      });
      selectedAdminTicket = payload.ticket;
      showMessage(adminMessage, payload.message || 'Ticket synchronized with Discord.', 'success');
      await loadAdminTickets({ quiet: true });
      renderAdminDetail();
      return true;
    } catch (error) {
      showMessage(adminMessage, error.message, 'error');
      return false;
    } finally {
      requestBusy = false;
      renderAdminDetail();
    }
  };

  const openAdminConfirmation = (action) => {
    if (!selectedAdminTicket) return;
    pendingAdminAction = action;
    const specs = {
      close: ['Close this ticket?', 'The Discord channel will become read-only for the owner, move to the closed category when configured, generate a transcript and offer a rating.', true, 'Close Ticket'],
      delete: ['Delete this closed ticket?', 'A final transcript is generated before the linked Discord channel is removed. The permanent Railway audit record remains.', false, 'Delete Ticket'],
    };
    const spec = specs[action];
    if (!spec) return;
    if (confirmTitle) confirmTitle.textContent = spec[0];
    if (confirmCopy) confirmCopy.textContent = spec[1];
    if (confirmReasonField) confirmReasonField.hidden = !spec[2];
    if (confirmReason) confirmReason.value = action === 'close' ? 'Issue resolved.' : '';
    if (confirmSubmit) confirmSubmit.textContent = spec[3];
    showMessage(confirmMessage, '');
    openDialog(confirmDialog);
  };

  const searchTicketMembers = async (query, target) => {
    if (!isStaff() || query.trim().length < 2 || !target) {
      target?.replaceChildren();
      return;
    }
    try {
      const payload = await apiJson(`${ADMIN_TICKET_MEMBER_SEARCH_URL}?q=${encodeURIComponent(query.trim())}`);
      target.replaceChildren();
      (payload.members || []).forEach((member) => {
        const option = document.createElement('option');
        option.value = member.key;
        option.textContent = member.name;
        target.append(option);
      });
    } catch {
      target.replaceChildren();
    }
  };

  const updateBlacklist = async (action, extra = {}) => {
    if (!isStaff() || requestBusy) return;
    requestBusy = true;
    try {
      const payload = await apiJson(ADMIN_TICKET_BLACKLIST_ACTION_URL, {
        method: 'POST',
        body: JSON.stringify({ action, ...extra })
      });
      showMessage(adminMessage, payload.message, 'success');
      await loadAdminTickets({ quiet: true });
    } catch (error) {
      showMessage(adminMessage, error.message, 'error');
    } finally {
      requestBusy = false;
    }
  };

  const populateSelect = (select, items = [], selected = '') => {
    if (!select) return;
    select.replaceChildren();
    items.forEach((item) => {
      const option = document.createElement('option');
      option.value = item.key;
      option.textContent = item.name;
      option.selected = item.key === selected;
      select.append(option);
    });
  };

  const renderCategorySettings = (settings = {}, resources = {}) => {
    if (!configCategorySettings) return;
    configCategorySettings.replaceChildren();
    const roleOptions = resources.support_roles || [];
    (settings.categories || []).forEach((category) => {
      const row = document.createElement('div');
      row.className = 'ticket-category-setting-row';
      row.dataset.ticketCategoryKey = category.key;

      const identity = document.createElement('div');
      identity.className = 'ticket-category-name';
      const name = document.createElement('strong');
      name.textContent = `${category.emoji || '🎟️'} ${category.label}`;
      const copy = document.createElement('small');
      copy.textContent = category.appeal_managed ? 'Linked through the moderation appeal workflow.' : (category.description || 'Support ticket category.');
      identity.append(name, copy);

      const enabledLabel = document.createElement('label');
      enabledLabel.className = 'ticket-setting-toggle';
      const enabled = document.createElement('input');
      enabled.type = 'checkbox';
      enabled.checked = category.enabled !== false;
      enabled.dataset.ticketCategoryEnabled = '';
      const enabledCopy = document.createElement('span');
      const enabledStrong = document.createElement('strong');
      enabledStrong.textContent = 'Enabled';
      enabledCopy.append(enabledStrong);
      enabledLabel.append(enabled, enabledCopy);

      const makeRoleSelect = (labelText, selected, dataName, fallbackText) => {
        const label = document.createElement('label');
        label.className = 'dialog-field';
        const span = document.createElement('span');
        span.textContent = labelText;
        const select = document.createElement('select');
        select.dataset[dataName] = '';
        const fallback = document.createElement('option');
        fallback.value = '';
        fallback.textContent = fallbackText;
        select.append(fallback);
        roleOptions.forEach((role) => {
          const option = document.createElement('option');
          option.value = role.key;
          option.textContent = role.name;
          option.selected = role.key === selected;
          select.append(option);
        });
        label.append(span, select);
        return label;
      };

      const support = makeRoleSelect('Support role', category.support_role_key || '', 'ticketCategorySupportRole', 'Use default Admin role');
      const notification = makeRoleSelect('Notification role', category.notification_role_key || '', 'ticketCategoryNotificationRole', 'Use support role');

      const priorityLabel = document.createElement('label');
      priorityLabel.className = 'dialog-field';
      const prioritySpan = document.createElement('span');
      prioritySpan.textContent = 'Initial priority';
      const priority = document.createElement('select');
      priority.dataset.ticketCategoryPriority = '';
      [['low','Low'],['normal','Normal'],['high','High'],['urgent','Urgent']].forEach(([value,label]) => {
        const option = document.createElement('option');
        option.value = value; option.textContent = label; option.selected = value === category.default_priority;
        priority.append(option);
      });
      priorityLabel.append(prioritySpan, priority);
      row.append(identity, enabledLabel, support, notification, priorityLabel);
      configCategorySettings.append(row);
    });
  };

  const applyAdvancedSettings = (settings = {}, resources = {}) => {
    configSettingInputs.forEach((input) => {
      const key = input.dataset.ticketSetting;
      if (!key || !(key in settings)) return;
      if (input.type === 'checkbox') input.checked = Boolean(settings[key]);
      else input.value = settings[key] ?? '';
    });
    populateSelect(configOverflow, resources.overflow_categories, settings.overflow_category_key);
    renderCategorySettings(settings, resources);
    if (configAdvancedSave) configAdvancedSave.disabled = !settings.configured;
  };

  const collectAdvancedSettings = () => {
    const body = { overflow_category_key: configOverflow?.value || '' };
    configSettingInputs.forEach((input) => {
      const key = input.dataset.ticketSetting;
      if (!key) return;
      if (input.type === 'checkbox') body[key] = Boolean(input.checked);
      else if (input.type === 'number') body[key] = Number(input.value);
      else body[key] = input.value;
    });
    body.categories = qsa('[data-ticket-category-key]').map((row) => ({
      key: row.dataset.ticketCategoryKey,
      enabled: Boolean(row.querySelector('[data-ticket-category-enabled]')?.checked),
      support_role_key: row.querySelector('[data-ticket-category-support-role]')?.value || '',
      notification_role_key: row.querySelector('[data-ticket-category-notification-role]')?.value || '',
      default_priority: row.querySelector('[data-ticket-category-priority]')?.value || 'normal',
    }));
    return body;
  };

  const loadOwnerConfig = async () => {
    if (!isOwner() || !token()) return;
    try {
      const payload = await apiJson(OWNER_TICKET_CONFIG_URL);
      ownerConfigPayload = payload;
      const settings = payload.settings || {};
      const resources = payload.resources || {};
      populateSelect(configPanel, resources.panel_channels, settings.panel_channel_key);
      populateSelect(configOpen, resources.open_categories, settings.open_category_key);
      populateSelect(configClosed, resources.closed_categories, settings.closed_category_key);
      populateSelect(configTranscript, resources.transcript_channels, settings.transcript_channel_key);
      populateSelect(configRole, resources.support_roles, settings.support_role_key);
      applyAdvancedSettings(settings, resources);
      if (configState) configState.textContent = settings.configured ? (settings.enabled ? 'Configured · Enabled' : 'Configured · Disabled') : 'Not configured';
      showMessage(configMessage, '');
    } catch (error) {
      ownerConfigPayload = null;
      if (configState) configState.textContent = 'Unavailable';
      showMessage(configMessage, error.message, 'error');
    }
  };

  const updateOwnerConfig = async (action) => {
    if (!isOwner() || requestBusy) return;
    requestBusy = true;
    showMessage(configMessage, '');
    try {
      const body = { action };
      if (action === 'configure') {
        Object.assign(body, {
          panel_channel_key: configPanel?.value || '',
          open_category_key: configOpen?.value || '',
          closed_category_key: configClosed?.value || '',
          transcript_channel_key: configTranscript?.value || '',
          support_role_key: configRole?.value || '',
        });
      } else if (action === 'save_advanced') {
        Object.assign(body, collectAdvancedSettings());
      }
      const payload = await apiJson(OWNER_TICKET_CONFIG_URL, { method: 'POST', body: JSON.stringify(body) });
      ownerConfigPayload = payload;
      showMessage(configMessage, payload.message || 'Ticket configuration synchronized.', 'success');
      await Promise.all([loadOwnerConfig(), loadMemberTickets({ quiet: true }), isStaff() ? loadAdminTickets({ quiet: true }) : Promise.resolve()]);
    } catch (error) {
      showMessage(configMessage, error.message, 'error');
    } finally {
      requestBusy = false;
    }
  };

  const activate = async () => {
    window.clearInterval(pollTimer);
    pollTimer = 0;
    if (document.hidden) return;
    await loadMemberTickets();
    if (isStaff()) await loadAdminTickets();
    if (isOwner()) await loadOwnerConfig();
    pollTimer = window.setInterval(async () => {
      if (document.hidden) return;
      const active = qs('[data-view-panel="tickets"].active');
      if (!active || !token()) return;
      await loadMemberTickets({ quiet: true });
      if (selectedMemberTicket && detailDialog?.open) {
        await openMemberTicket(selectedMemberTicket.ticket_number, { quiet: true });
      }
      if (isStaff()) {
        await loadAdminTickets({ quiet: true });
        if (selectedAdminTicket) await loadAdminDetail(selectedAdminTicket.ticket_number, { quiet: true });
      }
      if (isOwner()) await loadOwnerConfig();
    }, POLL_MS);
  };

  refreshMember?.addEventListener('click', () => loadMemberTickets());
  memberFilter?.addEventListener('change', renderMemberTickets);
  openCreateButtons.forEach((button) => button.addEventListener('click', () => {
    if (!token()) return;
    showMessage(createMessage, '');
    openDialog(createDialog);
  }));
  createCancel.forEach((button) => button.addEventListener('click', () => closeDialog(createDialog)));
  createDialog?.addEventListener('click', (event) => { if (event.target === createDialog) closeDialog(createDialog); });
  createForm?.addEventListener('submit', (event) => { event.preventDefault(); createTicket(); });
  detailClose.forEach((button) => button.addEventListener('click', () => closeDialog(detailDialog)));
  detailDialog?.addEventListener('click', (event) => { if (event.target === detailDialog) closeDialog(detailDialog); });
  memberCloseButton?.addEventListener('click', async () => {
    const system = memberPayload?.system || {};
    const reason = memberCloseReason?.value.trim() || '';
    if (system.require_close_reason && !reason) return showMessage(detailMessage, 'Enter a closing reason before closing this ticket.', 'error');
    if (system.require_close_confirmation && !window.confirm('Close this support ticket? You will no longer be able to reply unless staff reopen it.')) return;
    await memberAction('close', { reason: reason || 'Issue resolved.', confirmed: true });
  });
  memberReplySend?.addEventListener('click', async () => {
    const message = memberReply?.value.trim() || '';
    if (!message) return showMessage(detailMessage, 'Enter a reply before sending.', 'error');
    const sent = await memberAction('message', { message });
    if (sent && memberReply) memberReply.value = '';
  });
  ratingButtons.forEach((button) => button.addEventListener('click', () => memberAction('rate', { rating: Number(button.dataset.ticketRate) })));
  memberTranscriptButton?.addEventListener('click', () => {
    if (selectedMemberTicket) openWebsiteTranscript(accountTicketTranscriptUrl(selectedMemberTicket.ticket_number), detailMessage);
  });
  adminWebsiteTranscript?.addEventListener('click', () => {
    if (selectedAdminTicket) openWebsiteTranscript(adminTicketTranscriptUrl(selectedAdminTicket.ticket_number), adminMessage);
  });

  refreshAdmin?.addEventListener('click', () => loadAdminTickets());
  adminScope?.addEventListener('change', () => loadAdminTickets());
  adminSearch?.addEventListener('input', () => {
    window.clearTimeout(adminSearchTimer);
    adminSearchTimer = window.setTimeout(() => loadAdminTickets({ quiet: true }), 260);
  });
  adminReplySend?.addEventListener('click', async () => {
    const message = adminReply?.value.trim() || '';
    if (!message) return showMessage(adminMessage, 'Enter a staff reply before sending.', 'error');
    const sent = await submitAdminAction('message', { message });
    if (sent && adminReply) adminReply.value = '';
  });
  adminActionButtons.forEach((button) => button.addEventListener('click', () => {
    const action = button.dataset.adminTicketAction;
    if (['close', 'delete'].includes(action)) openAdminConfirmation(action);
    else submitAdminAction(action);
  }));
  savePriority?.addEventListener('click', () => submitAdminAction('priority', { value: adminPriority?.value || 'normal' }));
  saveTag?.addEventListener('click', () => submitAdminAction('tag', { value: adminTag?.value.trim() || '' }));
  addNote?.addEventListener('click', async () => {
    const note = adminNote?.value.trim() || '';
    if (!note) return showMessage(adminMessage, 'Enter a private staff note.', 'error');
    await submitAdminAction('note', { note });
    if (adminNote) adminNote.value = '';
  });
  blacklistSearch?.addEventListener('input', () => {
    window.clearTimeout(blacklistSearchTimer);
    blacklistSearchTimer = window.setTimeout(() => searchTicketMembers(blacklistSearch.value, blacklistResults), 250);
  });
  blacklistAdd?.addEventListener('click', () => {
    if (!blacklistResults?.value) return showMessage(adminMessage, 'Select a Discord member to block.', 'error');
    const reason = blacklistReason?.value.trim() || '';
    if (reason.length < 3) return showMessage(adminMessage, 'Enter a blacklist reason.', 'error');
    updateBlacklist('add', { member_key: blacklistResults.value, reason });
  });

  confirmCancel.forEach((button) => button.addEventListener('click', () => closeDialog(confirmDialog)));
  confirmDialog?.addEventListener('click', (event) => { if (event.target === confirmDialog) closeDialog(confirmDialog); });
  confirmForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!pendingAdminAction) return;
    const action = pendingAdminAction;
    const reason = confirmReason?.value.trim() || '';
    closeDialog(confirmDialog);
    pendingAdminAction = null;
    await submitAdminAction(action, { ...(reason ? { reason } : {}), confirmed: true });
  });

  configSave?.addEventListener('click', () => updateOwnerConfig('configure'));
  configEnable?.addEventListener('click', () => updateOwnerConfig('enable'));
  configDisable?.addEventListener('click', () => updateOwnerConfig('disable'));
  configAdvancedSave?.addEventListener('click', () => updateOwnerConfig('save_advanced'));
  configAdvancedReset?.addEventListener('click', () => loadOwnerConfig());

  window.addEventListener('wwz:viewchange', (event) => {
    if (event.detail?.view === 'tickets') activate();
    else {
      window.clearInterval(pollTimer);
      pollTimer = 0;
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      window.clearInterval(pollTimer);
      pollTimer = 0;
      return;
    }
    if (qs('[data-view-panel="tickets"].active')) activate();
  });
  window.addEventListener('wwz:authchange', () => {
    if (qs('[data-view-panel="tickets"].active')) activate();
  });
  window.addEventListener('wwz:accesschange', () => {
    if (qs('[data-view-panel="tickets"].active')) activate();
  });

  window.__wwzTicketsReady = true;
  if (qs('[data-view-panel="tickets"].active')) activate();
})();
