(() => {
  'use strict';

  const ADMIN_RULES_URL = `${DASHBOARD_API_BASE}/api/admin/rules`;
  const ADMIN_RULES_ACTION_URL = `${DASHBOARD_API_BASE}/api/admin/rules/action`;
  const root = document.querySelector('[data-rules-manager]');
  if (!root) return;

  const channelSelect = root.querySelector('[data-rules-channel]');
  const sectionsHost = root.querySelector('[data-rules-sections]');
  const revisionsHost = root.querySelector('[data-rules-revisions]');
  const emptyRevisions = root.querySelector('[data-rules-revisions-empty]');
  const summary = root.querySelector('[data-rules-summary]');
  const updated = root.querySelector('[data-rules-updated]');
  const message = root.querySelector('[data-rules-message]');
  const error = root.querySelector('[data-rules-error]');
  const addSectionButton = root.querySelector('[data-rules-add-section]');
  const saveButton = root.querySelector('[data-rules-save]');
  const publishButton = root.querySelector('[data-rules-publish]');
  const unpublishButton = root.querySelector('[data-rules-unpublish]');
  const refreshButton = root.querySelector('[data-rules-refresh]');

  let requestInProgress = false;
  let state = { document: { sections: [] }, channels: [], revisions: [] };

  const showMessage = (text = '', tone = 'error') => {
    if (!message) return;
    message.hidden = !text;
    message.textContent = text;
    message.dataset.tone = tone;
  };

  const sectionDataFromDom = () => [...sectionsHost.querySelectorAll('[data-rule-section]')].map((section) => ({
    title: section.querySelector('[data-rule-section-title]')?.value || '',
    rules: [...section.querySelectorAll('[data-rule-text]')].map((input) => input.value || '').filter((value) => value.trim())
  })).filter((section) => section.title.trim() || section.rules.length);

  const syncSectionNumbers = () => {
    [...sectionsHost.querySelectorAll('[data-rule-section]')].forEach((section, sectionIndex, allSections) => {
      const number = section.querySelector('[data-rule-section-number]');
      if (number) number.textContent = String(sectionIndex + 1).padStart(2, '0');
      const up = section.querySelector('[data-rule-section-up]');
      const down = section.querySelector('[data-rule-section-down]');
      if (up) up.disabled = sectionIndex === 0;
      if (down) down.disabled = sectionIndex === allSections.length - 1;
      [...section.querySelectorAll('[data-rule-row]')].forEach((row, ruleIndex, allRules) => {
        const label = row.querySelector('[data-rule-number]');
        if (label) label.textContent = `${sectionIndex + 1}.${ruleIndex + 1}`;
        const ruleUp = row.querySelector('[data-rule-up]');
        const ruleDown = row.querySelector('[data-rule-down]');
        if (ruleUp) ruleUp.disabled = ruleIndex === 0;
        if (ruleDown) ruleDown.disabled = ruleIndex === allRules.length - 1;
      });
    });
    const sections = sectionDataFromDom();
    const ruleCount = sections.reduce((total, section) => total + section.rules.length, 0);
    if (summary) summary.textContent = `${sections.length} section${sections.length === 1 ? '' : 's'} · ${ruleCount} rule${ruleCount === 1 ? '' : 's'}`;
  };

  const createRuleRow = (text = '') => {
    const row = document.createElement('div');
    row.className = 'rules-manager-rule-row';
    row.dataset.ruleRow = '';
    const number = document.createElement('span');
    number.className = 'rules-manager-rule-number';
    number.dataset.ruleNumber = '';
    const input = document.createElement('textarea');
    input.rows = 2;
    input.maxLength = 1000;
    input.dataset.ruleText = '';
    input.value = text;
    input.placeholder = 'Enter one complete server rule…';
    const actions = document.createElement('div');
    actions.className = 'rules-manager-mini-actions';
    const makeButton = (label, attr, title) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'icon-button rules-mini-button';
      button.textContent = label;
      button.title = title;
      button.setAttribute(attr, '');
      return button;
    };
    const up = makeButton('↑', 'data-rule-up', 'Move rule up');
    const down = makeButton('↓', 'data-rule-down', 'Move rule down');
    const remove = makeButton('×', 'data-rule-remove', 'Delete rule');
    remove.classList.add('danger');
    up.addEventListener('click', () => { const previous = row.previousElementSibling; if (previous) row.parentElement.insertBefore(row, previous); syncSectionNumbers(); });
    down.addEventListener('click', () => { const next = row.nextElementSibling; if (next) row.parentElement.insertBefore(next, row); syncSectionNumbers(); });
    remove.addEventListener('click', () => { row.remove(); syncSectionNumbers(); });
    input.addEventListener('input', syncSectionNumbers);
    actions.append(up, down, remove);
    row.append(number, input, actions);
    return row;
  };

  const createSectionCard = (section = { title: '', rules: [''] }) => {
    const card = document.createElement('article');
    card.className = 'rules-manager-section';
    card.dataset.ruleSection = '';
    const header = document.createElement('div');
    header.className = 'rules-manager-section-heading';
    const identity = document.createElement('div');
    const number = document.createElement('span');
    number.className = 'rules-manager-section-number';
    number.dataset.ruleSectionNumber = '';
    const title = document.createElement('input');
    title.type = 'text';
    title.maxLength = 100;
    title.dataset.ruleSectionTitle = '';
    title.value = section.title || '';
    title.placeholder = 'SECTION TITLE';
    title.addEventListener('input', syncSectionNumbers);
    identity.append(number, title);
    const actions = document.createElement('div');
    actions.className = 'rules-manager-section-actions';
    const sectionButton = (label, attr, className = 'secondary-action compact-action') => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = className;
      button.textContent = label;
      button.setAttribute(attr, '');
      return button;
    };
    const up = sectionButton('Move Up', 'data-rule-section-up');
    const down = sectionButton('Move Down', 'data-rule-section-down');
    const remove = sectionButton('Delete Section', 'data-rule-section-remove', 'secondary-action compact-action danger-outline');
    up.addEventListener('click', () => { const previous = card.previousElementSibling; if (previous) card.parentElement.insertBefore(card, previous); syncSectionNumbers(); });
    down.addEventListener('click', () => { const next = card.nextElementSibling; if (next) card.parentElement.insertBefore(next, card); syncSectionNumbers(); });
    remove.addEventListener('click', () => {
      if (!window.confirm(`Delete the ${title.value || 'selected'} rule section from this draft?`)) return;
      card.remove();
      syncSectionNumbers();
    });
    actions.append(up, down, remove);
    header.append(identity, actions);
    const rules = document.createElement('div');
    rules.className = 'rules-manager-rule-list';
    rules.dataset.ruleList = '';
    (Array.isArray(section.rules) && section.rules.length ? section.rules : ['']).forEach((rule) => rules.append(createRuleRow(rule)));
    const addRule = sectionButton('+ Add Rule', 'data-rule-add', 'secondary-action compact-action');
    addRule.addEventListener('click', () => { rules.append(createRuleRow('')); syncSectionNumbers(); rules.lastElementChild?.querySelector('textarea')?.focus(); });
    card.append(header, rules, addRule);
    return card;
  };

  const render = () => {
    sectionsHost.replaceChildren();
    (state.document.sections || []).forEach((section) => sectionsHost.append(createSectionCard(section)));
    if (!sectionsHost.children.length) sectionsHost.append(createSectionCard());

    channelSelect.replaceChildren(new Option('Select Discord rules channel…', ''));
    (state.channels || []).forEach((channel) => {
      const category = channel.category ? `${channel.category} / ` : '';
      const warning = channel.can_publish ? '' : ' · missing publish permission';
      channelSelect.add(new Option(`${category}#${channel.name}${warning}`, channel.key));
    });
    channelSelect.value = state.document.channel_key || '';

    revisionsHost.replaceChildren();
    (state.revisions || []).forEach((revision) => {
      const item = document.createElement('li');
      const symbol = document.createElement('span');
      symbol.className = 'activity-symbol';
      symbol.textContent = revision.action === 'publish' ? '↥' : revision.action === 'unpublish' ? '−' : revision.action === 'seed' ? '★' : '✎';
      const copy = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = `Revision ${revision.revision} · ${String(revision.action || 'save').replace(/_/g, ' ')}`;
      const small = document.createElement('small');
      small.textContent = `${revision.actor_name || 'System'} · ${revision.created_at ? formatAccountDate(revision.created_at) : 'Unknown time'}`;
      copy.append(strong, small);
      item.append(symbol, copy);
      revisionsHost.append(item);
    });
    if (emptyRevisions) emptyRevisions.hidden = Boolean((state.revisions || []).length);
    if (updated) {
      const when = state.document.updated_at ? formatAccountDate(state.document.updated_at) : 'Not yet';
      const by = state.document.updated_by_name ? ` by ${state.document.updated_by_name}` : '';
      const published = state.document.published_at ? ` · Discord published ${formatAccountDate(state.document.published_at)}` : ' · Not currently published by WWZ';
      updated.textContent = `Revision ${state.document.revision || 0} · Updated ${when}${by}${published}`;
    }
    if (unpublishButton) unpublishButton.disabled = !state.document.published_at;
    syncSectionNumbers();
  };

  const load = async () => {
    const token = storageGet(AUTH_SESSION_KEY);
    if (!token || !['staff', 'owner'].includes(dashboardAccessLevel) || requestInProgress) return false;
    requestInProgress = true;
    refreshButton?.setAttribute('disabled', '');
    if (error) error.hidden = true;
    showMessage('');
    try {
      const response = await authFetch(ADMIN_RULES_URL, { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } });
      const payload = await response.json().catch(() => ({}));
      if (handleAdminPlayerAuthorizationResponse(response, payload, { actionRequest: false })) return false;
      if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Rules Manager unavailable.');
      state = { document: payload.document || { sections: [] }, channels: payload.channels || [], revisions: payload.revisions || [] };
      render();
      return true;
    } catch (problem) {
      if (error) { error.hidden = false; error.textContent = problem instanceof Error ? problem.message : 'Rules Manager is temporarily unavailable.'; }
      return false;
    } finally {
      requestInProgress = false;
      refreshButton?.removeAttribute('disabled');
    }
  };

  const action = async (name, button) => {
    const token = storageGet(AUTH_SESSION_KEY);
    if (!token || !['staff', 'owner'].includes(dashboardAccessLevel) || requestInProgress) return false;
    const sections = sectionDataFromDom();
    if (name !== 'unpublish' && (!sections.length || sections.some((section) => !section.title.trim() || !section.rules.length))) {
      showMessage('Every section needs a title and at least one rule.', 'error');
      return false;
    }
    if (name === 'publish' && !channelSelect.value) {
      showMessage('Select the Discord rules channel before publishing.', 'error');
      return false;
    }
    requestInProgress = true;
    button?.setAttribute('disabled', '');
    showMessage('');
    try {
      const response = await authFetch(ADMIN_RULES_ACTION_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: name, channel_key: channelSelect.value || '', sections })
      });
      const payload = await response.json().catch(() => ({}));
      if (handleAdminPlayerAuthorizationResponse(response, payload, { actionRequest: true })) return false;
      if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Rules Manager action failed.');
      const successMessage = payload.message || 'Rules updated.';
      requestInProgress = false;
      await load();
      showMessage(successMessage, 'success');
      return true;
    } catch (problem) {
      showMessage(problem instanceof Error ? problem.message : 'Rules Manager action failed.', 'error');
      return false;
    } finally {
      requestInProgress = false;
      button?.removeAttribute('disabled');
    }
  };

  addSectionButton?.addEventListener('click', () => { sectionsHost.append(createSectionCard()); syncSectionNumbers(); sectionsHost.lastElementChild?.querySelector('input')?.focus(); });
  refreshButton?.addEventListener('click', load);
  saveButton?.addEventListener('click', () => action('save', saveButton));
  publishButton?.addEventListener('click', () => {
    if (!window.confirm('Publish this exact rules revision to Discord and make it the website source? WWZ will replace only its previously published rules messages.')) return;
    action('publish', publishButton);
  });
  unpublishButton?.addEventListener('click', () => {
    if (!window.confirm('Remove only the rules messages previously published by WWZ? The website rules will remain available.')) return;
    action('unpublish', unpublishButton);
  });

  window.addEventListener('wwz:viewchange', (event) => {
    if (event.detail?.view === 'staff' && event.detail?.section === 'rules') load();
  });
  window.__wwzRulesManagerReady = true;
})();
