'use strict';

// World War Z Website v1.35.0 — Dashboard UX / Consistency Pass
// Non-invasive enhancement layer for accessibility, responsive data tables and
// dynamic modules. Existing feature controllers remain authoritative.
(() => {
  const UX_VERSION = '1.35.0';
  const dashboard = document.querySelector('.dashboard-shell');
  if (!dashboard) return;

  const humanize = (value) => String(value || '')
    .replace(/^data-/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();

  const hasExplicitLabel = (control) => {
    if (control.hasAttribute('aria-label') || control.hasAttribute('aria-labelledby')) return true;
    if (control.closest('label')) return true;
    const id = control.id;
    return Boolean(id && document.querySelector(`label[for="${CSS.escape(id)}"]`));
  };

  const inferControlLabel = (control) => {
    const structuralLabel = control.closest('.dialog-field, .community-field, .zone-field, .progression-setting');
    const structuralText = structuralLabel?.querySelector(':scope > span, :scope > strong, :scope > legend')?.textContent?.trim();
    if (structuralText) return structuralText.replace(/\s+/g, ' ');

    const placeholder = control.getAttribute('placeholder')?.trim();
    if (placeholder) return placeholder.replace(/[.…]+$/, '');

    if (control instanceof HTMLSelectElement) {
      const firstOption = control.options?.[0]?.textContent?.trim();
      if (firstOption) return firstOption.replace(/[.…]+$/, '');
    }

    const dataAttribute = [...control.attributes]
      .map((attribute) => attribute.name)
      .find((name) => name.startsWith('data-') && name !== 'data-state');
    if (dataAttribute) return humanize(dataAttribute);

    return humanize(control.name || control.id || control.type || control.tagName);
  };

  const enhanceControl = (control) => {
    if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement)) return;
    if (control.type === 'hidden' || control.closest('[hidden]')) return;
    if (!hasExplicitLabel(control)) {
      const label = inferControlLabel(control);
      if (label) control.setAttribute('aria-label', label);
    }

    if (control.required) control.setAttribute('aria-required', 'true');
    if (control instanceof HTMLTextAreaElement && !control.hasAttribute('spellcheck')) control.spellcheck = true;
  };

  const enhanceTable = (table) => {
    if (!(table instanceof HTMLTableElement)) return;
    if (!table.querySelector('caption')) {
      const heading = table.closest('.panel, .inset-panel, section, article')?.querySelector('h2, h3, h4');
      if (heading?.textContent?.trim() && !table.hasAttribute('aria-label') && !table.hasAttribute('aria-labelledby')) {
        table.setAttribute('aria-label', `${heading.textContent.trim()} table`);
      }
    }

    if (!table.parentElement?.matches('.responsive-table, .wwz-table-scroll')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'wwz-table-scroll';
      wrapper.setAttribute('tabindex', '0');
      wrapper.setAttribute('role', 'region');
      wrapper.setAttribute('aria-label', table.getAttribute('aria-label') || 'Scrollable data table');
      table.before(wrapper);
      wrapper.append(table);
    }
  };

  const enhanceScrollableRegion = (region) => {
    if (!(region instanceof HTMLElement)) return;
    if (!region.hasAttribute('tabindex')) region.tabIndex = 0;
    if (!region.hasAttribute('role')) region.setAttribute('role', 'region');
    if (!region.hasAttribute('aria-label')) region.setAttribute('aria-label', 'Scrollable dashboard data');
  };

  const enhanceMessage = (message) => {
    if (!(message instanceof HTMLElement)) return;
    if (!message.hasAttribute('role')) message.setAttribute('role', 'status');
    if (!message.hasAttribute('aria-live')) message.setAttribute('aria-live', 'polite');
    if (!message.hasAttribute('aria-atomic')) message.setAttribute('aria-atomic', 'true');
  };

  const enhanceDialog = (dialog) => {
    if (!(dialog instanceof HTMLDialogElement)) return;
    dialog.setAttribute('aria-modal', 'true');
    if (!dialog.hasAttribute('aria-labelledby') && !dialog.hasAttribute('aria-label')) {
      const heading = dialog.querySelector('h1, h2, h3');
      if (heading) {
        if (!heading.id) heading.id = `wwz-dialog-${Math.random().toString(36).slice(2, 9)}`;
        dialog.setAttribute('aria-labelledby', heading.id);
      }
    }
  };

  const enhanceSubtree = (root) => {
    const scope = root instanceof Element || root instanceof Document ? root : document;

    if (scope.matches?.('input, select, textarea')) enhanceControl(scope);
    scope.querySelectorAll?.('input, select, textarea').forEach(enhanceControl);

    if (scope.matches?.('table')) enhanceTable(scope);
    scope.querySelectorAll?.('table').forEach(enhanceTable);

    if (scope.matches?.('.responsive-table, .wwz-table-scroll')) enhanceScrollableRegion(scope);
    scope.querySelectorAll?.('.responsive-table, .wwz-table-scroll').forEach(enhanceScrollableRegion);

    const messageSelector = '.restart-dialog-message, .history-error, .zone-message, .admin-player-state, [data-ui-message]';
    if (scope.matches?.(messageSelector)) enhanceMessage(scope);
    scope.querySelectorAll?.(messageSelector).forEach(enhanceMessage);

    if (scope.matches?.('dialog')) enhanceDialog(scope);
    scope.querySelectorAll?.('dialog').forEach(enhanceDialog);
  };

  let mutationQueued = false;
  const pendingRoots = new Set();
  const flushMutations = () => {
    mutationQueued = false;
    const roots = [...pendingRoots];
    pendingRoots.clear();
    roots.forEach(enhanceSubtree);
  };

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) pendingRoots.add(node);
      });
    });
    if (!mutationQueued && pendingRoots.size) {
      mutationQueued = true;
      queueMicrotask(flushMutations);
    }
  });

  document.documentElement.dataset.wwzUxVersion = UX_VERSION;
  document.body.classList.add('wwz-ux-consistency');
  enhanceSubtree(document);
  observer.observe(dashboard, { childList: true, subtree: true });
  document.querySelectorAll('dialog').forEach((dialog) => observer.observe(dialog, { childList: true, subtree: true }));
})();
