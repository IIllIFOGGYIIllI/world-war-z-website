// Version 1.18.0 — member appeals, ticket integration and owner settings.
const ACCOUNT_APPEALS_URL = `${DASHBOARD_API_BASE}/api/account/appeals`;
const ACCOUNT_APPEAL_ACTION_URL = `${DASHBOARD_API_BASE}/api/account/appeals/action`;
const OWNER_APPEAL_CONFIG_URL = `${DASHBOARD_API_BASE}/api/owner/appeals/config`;

const appealGuest = document.querySelector('[data-appeal-guest]');
const appealUnlinked = document.querySelector('[data-appeal-unlinked]');
const appealContent = document.querySelector('[data-appeal-content]');
const appealEligibleList = document.querySelector('[data-appeal-eligible-list]');
const appealEligibleEmpty = document.querySelector('[data-appeal-eligible-empty]');
const memberAppealList = document.querySelector('[data-member-appeal-list]');
const memberAppealEmpty = document.querySelector('[data-member-appeal-empty]');
const memberAppealError = document.querySelector('[data-member-appeal-error]');
const refreshMemberAppealsButton = document.querySelector('[data-refresh-member-appeals]');
const memberAppealDialog = document.querySelector('[data-member-appeal-dialog]');
const memberAppealForm = document.querySelector('[data-member-appeal-form]');
const memberAppealTitle = document.querySelector('[data-member-appeal-title]');
const memberAppealCopy = document.querySelector('[data-member-appeal-copy]');
const memberAppealCase = document.querySelector('[data-member-appeal-case]');
const memberAppealCaseDetail = document.querySelector('[data-member-appeal-case-detail]');
const memberAppealStatement = document.querySelector('[data-member-appeal-statement]');
const memberAppealEvidenceReferences = [...document.querySelectorAll('[data-member-appeal-evidence-reference]')];
const memberAppealEvidenceSummaries = [...document.querySelectorAll('[data-member-appeal-evidence-summary]')];
const memberAppealMessage = document.querySelector('[data-member-appeal-message]');
const submitMemberAppealButton = document.querySelector('[data-submit-member-appeal]');
const memberAppealCancelButtons = [...document.querySelectorAll('[data-member-appeal-cancel]')];
const withdrawAppealDialog = document.querySelector('[data-withdraw-appeal-dialog]');
const withdrawAppealForm = document.querySelector('[data-withdraw-appeal-form]');
const withdrawAppealReason = document.querySelector('[data-withdraw-appeal-reason]');
const withdrawAppealMessage = document.querySelector('[data-withdraw-appeal-message]');
const withdrawAppealCancelButtons = [...document.querySelectorAll('[data-withdraw-appeal-cancel]')];
const ownerAppealEnabled = document.querySelector('[data-owner-appeal-enabled]');
const ownerAppealCreateTicket = document.querySelector('[data-owner-appeal-create-ticket]');
const ownerAppealEdit = document.querySelector('[data-owner-appeal-edit]');
const ownerAppealContinues = document.querySelector('[data-owner-appeal-continues]');
const ownerAppealDeadline = document.querySelector('[data-owner-appeal-deadline]');
const ownerAppealCategory = document.querySelector('[data-owner-appeal-category]');
const ownerAppealRole = document.querySelector('[data-owner-appeal-role]');
const ownerAppealInstructions = document.querySelector('[data-owner-appeal-instructions]');
const ownerAppealMessage = document.querySelector('[data-owner-appeal-message]');
const saveAppealSettingsButton = document.querySelector('[data-save-appeal-settings]');
const refreshAppealSettingsButton = document.querySelector('[data-refresh-appeal-settings]');
let memberAppealPayload = null;
let memberAppealRequestInProgress = false;
let memberAppealActionInProgress = false;
let selectedMemberAppealMode = 'submit';
let selectedMemberAppealId = null;
let selectedMemberAppealCaseId = null;
let ownerAppealRequestInProgress = false;
let selectedWithdrawAppealId = null;

const showInlineMessage = (element, message, state = 'error') => {
  if (!element) return;
  element.textContent = String(message || '');
  element.dataset.state = state;
  element.hidden = !message;
};

const openDashboardDialog = (dialog) => {
  if (typeof dialog?.showModal === 'function') dialog.showModal();
  else dialog?.setAttribute('open', '');
};

const closeDashboardDialog = (dialog) => {
  if (typeof dialog?.close === 'function') dialog.close();
  else dialog?.removeAttribute('open');
};

const resetAppealPanels = () => {
  memberAppealPayload = null;
  appealGuest?.removeAttribute('hidden');
  appealUnlinked?.setAttribute('hidden', '');
  appealContent?.setAttribute('hidden', '');
  appealEligibleList?.replaceChildren();
  memberAppealList?.replaceChildren();
  if (appealEligibleEmpty) appealEligibleEmpty.hidden = true;
  if (memberAppealEmpty) memberAppealEmpty.hidden = true;
  if (memberAppealError) memberAppealError.hidden = true;
  setText('[data-appeal-eligible-count]', '—');
  setText('[data-member-appeal-count]', '—');
};

const appealActionLabel = (action) => ({
  warn: 'Warning', kick: 'Discord kick', ban: 'Discord ban', dayz_ban: 'DayZ ban'
}[String(action || '')] || titleCaseState(action || 'Moderation action'));

const appealEvidenceFromForm = () => memberAppealEvidenceReferences.map((input, index) => ({
  reference: input.value.trim(),
  summary: memberAppealEvidenceSummaries[index]?.value.trim() || ''
})).filter((item) => item.reference || item.summary);

const clearMemberAppealForm = () => {
  memberAppealForm?.reset();
  memberAppealEvidenceReferences.forEach((input) => { input.value = ''; });
  memberAppealEvidenceSummaries.forEach((input) => { input.value = ''; });
  showInlineMessage(memberAppealMessage, '');
};

const fillAppealEvidence = (evidence = []) => {
  memberAppealEvidenceReferences.forEach((input, index) => {
    input.value = String(evidence[index]?.reference || '');
  });
  memberAppealEvidenceSummaries.forEach((input, index) => {
    input.value = String(evidence[index]?.summary || '');
  });
};

const openMemberAppealEditor = ({ mode, caseRecord = null, appeal = null }) => {
  selectedMemberAppealMode = mode;
  selectedMemberAppealId = appeal?.appeal_id == null ? null : Number(appeal.appeal_id);
  selectedMemberAppealCaseId = Number(caseRecord?.case_id ?? appeal?.case_id);
  clearMemberAppealForm();
  if (mode === 'update') {
    memberAppealTitle.textContent = `Update appeal #${selectedMemberAppealId}`;
    memberAppealCopy.textContent = 'You may revise this submission until a reviewer is assigned.';
    memberAppealStatement.value = String(appeal?.statement || '');
    fillAppealEvidence(appeal?.evidence || []);
    submitMemberAppealButton.textContent = 'Save appeal update';
  } else {
    memberAppealTitle.textContent = 'Submit moderation appeal';
    memberAppealCopy.textContent = 'Your statement and evidence are visible only to authorised reviewers.';
    submitMemberAppealButton.textContent = 'Submit appeal';
  }
  const record = caseRecord || appeal?.case || {};
  memberAppealCase.textContent = `Case #${selectedMemberAppealCaseId || '—'} · ${appealActionLabel(record.action)}`;
  memberAppealCaseDetail.textContent = `${String(record.reason || 'No reason recorded.')} · Opened ${formatAccountDate(record.created_at)}`;
  openDashboardDialog(memberAppealDialog);
  memberAppealStatement?.focus();
};

const createAppealCard = ({ title, reason, status, meta, actions = [] }) => {
  const card = document.createElement('article');
  card.className = 'appeal-card';
  const copy = document.createElement('div');
  copy.className = 'appeal-card-copy';
  const heading = document.createElement('h3');
  heading.textContent = title;
  const statusPill = document.createElement('span');
  statusPill.className = `appeal-status ${String(status || '').toLowerCase()}`.trim();
  statusPill.textContent = titleCaseState(status || 'available');
  const reasonText = document.createElement('p');
  reasonText.textContent = reason;
  const metadata = document.createElement('div');
  metadata.className = 'appeal-card-meta';
  for (const item of meta.filter(Boolean)) {
    const span = document.createElement('span');
    span.textContent = item;
    metadata.append(span);
  }
  copy.append(statusPill, heading, reasonText, metadata);
  const actionWrap = document.createElement('div');
  actionWrap.className = 'appeal-card-actions';
  actionWrap.append(...actions);
  card.append(copy, actionWrap);
  return card;
};

const actionButton = (label, callback, className = 'secondary-action compact-action') => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.addEventListener('click', callback);
  return button;
};

const renderMemberAppeals = (payload) => {
  memberAppealPayload = payload;
  appealGuest?.setAttribute('hidden', '');
  if (!payload?.linked) {
    appealUnlinked?.removeAttribute('hidden');
    appealContent?.setAttribute('hidden', '');
    return;
  }
  appealUnlinked?.setAttribute('hidden', '');
  appealContent?.removeAttribute('hidden');
  const settings = payload.settings || {};
  setText('[data-appeal-instructions]', String(settings.instructions || 'Explain why this action should be reviewed.'));
  setText('[data-appeal-deadline]', settings.enabled ? `${Number(settings.deadline_days) || 14} days after the case` : 'Appeals disabled');
  setText('[data-appeal-ticket-policy]', settings.create_ticket ? 'Private ticket created' : 'Dashboard only');
  setText('[data-appeal-punishment-policy]', settings.punishment_continues_during_review ? 'Remains active' : 'See case instructions');
  setText('[data-appeal-edit-policy]', settings.allow_edit_before_assignment ? 'Allowed before assignment' : 'Locked after submission');

  const eligible = Array.isArray(payload.eligible_cases) ? payload.eligible_cases : [];
  appealEligibleList?.replaceChildren();
  eligible.forEach((record) => {
    const submit = actionButton('Submit appeal', () => openMemberAppealEditor({ mode: 'submit', caseRecord: record }), 'primary-action compact-action');
    appealEligibleList?.append(createAppealCard({
      title: `Case #${record.case_id} · ${appealActionLabel(record.action)}`,
      reason: String(record.reason || 'No reason recorded.'),
      status: 'available',
      meta: [
        `Action date: ${formatAccountDate(record.created_at)}`,
        record.expires_at ? `Expires: ${formatAccountDate(record.expires_at)}` : '',
        `Appeal by: ${formatAccountDate(record.appeal_deadline_at)}`
      ],
      actions: [submit]
    }));
  });
  setText('[data-appeal-eligible-count]', String(eligible.length));
  if (appealEligibleEmpty) appealEligibleEmpty.hidden = eligible.length !== 0;

  const appeals = Array.isArray(payload.appeals) ? payload.appeals : [];
  memberAppealList?.replaceChildren();
  appeals.forEach((appeal) => {
    const actions = [];
    if (appeal.status === 'submitted' && settings.allow_edit_before_assignment) {
      actions.push(actionButton('Edit', () => openMemberAppealEditor({ mode: 'update', appeal })));
    }
    if (appeal.status === 'submitted') {
      actions.push(actionButton('Withdraw', () => {
        selectedWithdrawAppealId = Number(appeal.appeal_id);
        withdrawAppealForm?.reset();
        showInlineMessage(withdrawAppealMessage, '');
        openDashboardDialog(withdrawAppealDialog);
      }, 'secondary-action compact-action danger-outline'));
    }
    const ticket = appeal.ticket?.created
      ? `Ticket #${appeal.ticket.ticket_number} · ${titleCaseState(appeal.ticket.status)}`
      : `Ticket: ${titleCaseState(appeal.ticket?.status || 'not created')}`;
    const outcome = appeal.outcome ? `Outcome: ${titleCaseState(appeal.outcome)}` : '';
    memberAppealList?.append(createAppealCard({
      title: `Appeal #${appeal.appeal_id} · Case #${appeal.case_id}`,
      reason: String(appeal.statement || 'No statement available.'),
      status: appeal.status,
      meta: [
        appealActionLabel(appeal.case?.action),
        `Submitted: ${formatAccountDate(appeal.created_at)}`,
        ticket,
        outcome,
        appeal.decision_reason ? `Decision: ${appeal.decision_reason}` : ''
      ],
      actions
    }));
  });
  setText('[data-member-appeal-count]', String(appeals.length));
  if (memberAppealEmpty) memberAppealEmpty.hidden = appeals.length !== 0;
  if (memberAppealError) memberAppealError.hidden = true;
};

const loadMemberAppeals = async (sessionToken = storageGet(AUTH_SESSION_KEY)) => {
  if (!sessionToken || memberAppealRequestInProgress) return false;
  memberAppealRequestInProgress = true;
  refreshMemberAppealsButton?.setAttribute('aria-busy', 'true');
  refreshMemberAppealsButton?.setAttribute('disabled', '');
  try {
    const response = await authFetch(ACCOUNT_APPEALS_URL, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${sessionToken}` }
    });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) {
      storageRemove(AUTH_SESSION_KEY);
      applySignedOutState();
      showAuthMessage(payload.message || 'Sign in again to view appeals.', 'error');
      return false;
    }
    if (!response.ok) throw new Error(payload.message || 'Appeals are temporarily unavailable.');
    renderMemberAppeals(payload);
    return true;
  } catch (error) {
    if (memberAppealError) memberAppealError.hidden = false;
    showAuthMessage(error.message || 'Appeals are temporarily unavailable.', 'error');
    return false;
  } finally {
    memberAppealRequestInProgress = false;
    refreshMemberAppealsButton?.removeAttribute('aria-busy');
    refreshMemberAppealsButton?.removeAttribute('disabled');
  }
};

const submitMemberAppealAction = async (payload, messageElement, button) => {
  if (memberAppealActionInProgress) return null;
  const sessionToken = storageGet(AUTH_SESSION_KEY);
  if (!sessionToken) {
    showInlineMessage(messageElement, 'Sign in with Discord to continue.');
    return null;
  }
  memberAppealActionInProgress = true;
  button?.setAttribute('disabled', '');
  button?.setAttribute('aria-busy', 'true');
  try {
    const response = await protectedActionFetch(ACCOUNT_APPEAL_ACTION_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) {
      storageRemove(AUTH_SESSION_KEY);
      applySignedOutState();
      closeDashboardDialog(memberAppealDialog);
      closeDashboardDialog(withdrawAppealDialog);
      showAuthMessage(result.message || 'Your session expired. Sign in again.', 'error');
      return null;
    }
    if (!response.ok) throw new Error(result.message || 'The appeal action could not be completed.');
    await loadMemberAppeals(sessionToken);
    if (['staff', 'owner'].includes(dashboardAccessLevel)) {
      try {
        await window.WWZLazyAssets?.ensureAdministration?.();
        await window.WWZAdministration?.loadModerationQueue?.(sessionToken);
      } catch (_) {
        // The member appeal has already been saved; an optional hidden Admin refresh must not turn it into a failure.
      }
    }
    showAuthMessage(result.message || 'Appeal updated.', 'success');
    return result;
  } catch (error) {
    showInlineMessage(messageElement, error.message || 'The appeal action could not be completed.');
    return null;
  } finally {
    memberAppealActionInProgress = false;
    button?.removeAttribute('disabled');
    button?.removeAttribute('aria-busy');
  }
};

memberAppealForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const statement = memberAppealStatement?.value.trim() || '';
  const payload = {
    action: selectedMemberAppealMode,
    statement,
    evidence: appealEvidenceFromForm()
  };
  if (selectedMemberAppealMode === 'update') payload.appeal_id = selectedMemberAppealId;
  else payload.case_id = selectedMemberAppealCaseId;
  const result = await submitMemberAppealAction(payload, memberAppealMessage, submitMemberAppealButton);
  if (result) closeDashboardDialog(memberAppealDialog);
});

withdrawAppealForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = document.querySelector('[data-confirm-withdraw-appeal]');
  const result = await submitMemberAppealAction({
    action: 'withdraw',
    appeal_id: selectedWithdrawAppealId,
    reason: withdrawAppealReason?.value.trim() || ''
  }, withdrawAppealMessage, button);
  if (result) closeDashboardDialog(withdrawAppealDialog);
});

memberAppealCancelButtons.forEach((button) => button.addEventListener('click', () => closeDashboardDialog(memberAppealDialog)));
withdrawAppealCancelButtons.forEach((button) => button.addEventListener('click', () => closeDashboardDialog(withdrawAppealDialog)));
refreshMemberAppealsButton?.addEventListener('click', () => loadMemberAppeals());

const populateOwnerSelect = (element, options, selectedKey) => {
  if (!element) return;
  element.replaceChildren();
  (Array.isArray(options) ? options : []).forEach((option) => {
    const item = document.createElement('option');
    item.value = String(option.key || '');
    item.textContent = String(option.name || 'Unknown');
    item.selected = item.value === String(selectedKey || '');
    element.append(item);
  });
};

const applyOwnerAppealSettings = (payload) => {
  const settings = payload?.settings || {};
  if (ownerAppealEnabled) ownerAppealEnabled.checked = Boolean(settings.enabled);
  if (ownerAppealCreateTicket) ownerAppealCreateTicket.checked = Boolean(settings.create_ticket);
  if (ownerAppealEdit) ownerAppealEdit.checked = Boolean(settings.allow_edit_before_assignment);
  if (ownerAppealContinues) ownerAppealContinues.checked = Boolean(settings.punishment_continues_during_review);
  if (ownerAppealDeadline) ownerAppealDeadline.value = String(Number(settings.deadline_days) || 14);
  if (ownerAppealInstructions) ownerAppealInstructions.value = String(settings.instructions || '');
  populateOwnerSelect(ownerAppealCategory, payload?.categories, settings.ticket_category_key);
  populateOwnerSelect(ownerAppealRole, payload?.roles, settings.staff_role_key);
};

const handleOwnerAppealAuthFailure = (response, payload = {}) => {
  if (response.status === 401) {
    storageRemove(AUTH_SESSION_KEY);
    applySignedOutState();
    showAuthMessage(payload.message || 'Your session expired. Sign in again.', 'error');
    return true;
  }
  if (response.status === 403) {
    if (authenticatedUser?.membership) authenticatedUser.membership.access_level = 'member';
    applyAccessVisibility('member');
    showView('overview', false);
    showAuthMessage(payload.message || 'Owner access is required.', 'error');
    return true;
  }
  return false;
};

const loadOwnerAppealSettings = async (sessionToken = storageGet(AUTH_SESSION_KEY)) => {
  if (dashboardAccessLevel !== 'owner' || !sessionToken || ownerAppealRequestInProgress) return false;
  ownerAppealRequestInProgress = true;
  refreshAppealSettingsButton?.setAttribute('disabled', '');
  refreshAppealSettingsButton?.setAttribute('aria-busy', 'true');
  try {
    const response = await authFetch(OWNER_APPEAL_CONFIG_URL, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${sessionToken}` }
    });
    const payload = await response.json().catch(() => ({}));
    if (handleOwnerAppealAuthFailure(response, payload)) return false;
    if (!response.ok) throw new Error(payload.message || 'Appeal settings are temporarily unavailable.');
    applyOwnerAppealSettings(payload);
    showInlineMessage(ownerAppealMessage, '');
    return true;
  } catch (error) {
    showInlineMessage(ownerAppealMessage, error.message || 'Appeal settings are temporarily unavailable.');
    return false;
  } finally {
    ownerAppealRequestInProgress = false;
    refreshAppealSettingsButton?.removeAttribute('disabled');
    refreshAppealSettingsButton?.removeAttribute('aria-busy');
  }
};

saveAppealSettingsButton?.addEventListener('click', async () => {
  if (ownerAppealRequestInProgress) return;
  const sessionToken = storageGet(AUTH_SESSION_KEY);
  if (!sessionToken) return;
  ownerAppealRequestInProgress = true;
  saveAppealSettingsButton.setAttribute('disabled', '');
  saveAppealSettingsButton.setAttribute('aria-busy', 'true');
  try {
    const response = await protectedActionFetch(OWNER_APPEAL_CONFIG_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify({
        enabled: Boolean(ownerAppealEnabled?.checked),
        deadline_days: Number(ownerAppealDeadline?.value || 14),
        create_ticket: Boolean(ownerAppealCreateTicket?.checked),
        allow_edit_before_assignment: Boolean(ownerAppealEdit?.checked),
        punishment_continues_during_review: Boolean(ownerAppealContinues?.checked),
        ticket_category_key: ownerAppealCategory?.value || 'ticket_default',
        staff_role_key: ownerAppealRole?.value || 'ticket_default',
        instructions: ownerAppealInstructions?.value.trim() || ''
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (handleOwnerAppealAuthFailure(response, payload)) return;
    if (!response.ok) throw new Error(payload.message || 'Appeal settings could not be saved.');
    applyOwnerAppealSettings(payload);
    showInlineMessage(ownerAppealMessage, payload.message || 'Appeal settings saved.', 'success');
    await loadMemberAppeals(sessionToken);
  } catch (error) {
    showInlineMessage(ownerAppealMessage, error.message || 'Appeal settings could not be saved.');
  } finally {
    ownerAppealRequestInProgress = false;
    saveAppealSettingsButton.removeAttribute('disabled');
    saveAppealSettingsButton.removeAttribute('aria-busy');
  }
});
refreshAppealSettingsButton?.addEventListener('click', () => loadOwnerAppealSettings());

document.querySelectorAll('[data-copy-command]').forEach((button) => {
  const originalLabel = button.textContent;
  button.addEventListener('click', async () => {
    const command = String(button.dataset.copyCommand || '').trim();
    try {
      await navigator.clipboard.writeText(command);
      button.textContent = `Copied ${command}`;
    } catch (error) {
      button.textContent = command;
    }
    window.setTimeout(() => { button.textContent = originalLabel; }, 1800);
  });
});

const activateAppealsView = ({ view = '', section = '' } = {}) => {
  if (view === 'appeals') loadMemberAppeals();
  if (view === 'configuration' && section === 'appeals') loadOwnerAppealSettings();
};

window.WWZAppeals = Object.freeze({ activate: activateAppealsView });
window.__wwzAppealsReady = true;
