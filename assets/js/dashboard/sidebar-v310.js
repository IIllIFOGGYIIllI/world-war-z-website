/* WWZ V3.10 — category wayfinding for the original permission-gated navigation.
   No routing, API calls, storage, or clones of protected control buttons. */
(() => {
  'use strict';
  const initialize = () => {
    const sidebar = document.querySelector('body.wwz-v3-dashboard .dashboard-sidebar.wwz-v31-ready');
    const groupsRoot = sidebar?.querySelector('.sidebar-navigation');
    const caption = sidebar?.querySelector('.wwz-nav-subheading');
    if (!sidebar || !groupsRoot || !caption || sidebar.querySelector('[data-v310-category-jump]')) return;

    const groups = [...groupsRoot.querySelectorAll('details[data-nav-group]')];
    const allowed = (element) => Boolean(element && !element.hidden && !element.disabled &&
      !element.closest('[hidden]'));
    const routeCount = (group) => [...group.querySelectorAll('.side-link[data-view]')].filter(allowed).length;
    const visibleGroups = () => groups.filter((group) => allowed(group) && routeCount(group) > 0);

    const jump = document.createElement('div');
    jump.className = 'wwz-v310-category-jump';
    jump.dataset.v310CategoryJump = '';
    const label = document.createElement('label');
    label.htmlFor = 'wwz-v310-category-select';
    label.textContent = 'Jump to category';
    const picker = document.createElement('select');
    picker.id = 'wwz-v310-category-select';
    picker.setAttribute('aria-label', 'Jump to an available workspace category');
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Choose a category…';
    jump.append(label, picker);
    caption.after(jump);

    const categoryName = (group) =>
      group.querySelector(':scope > summary strong')?.textContent?.trim() || 'Workspace';
    const refresh = () => {
      const groupsAllowed = visibleGroups();
      const previous = picker.value;
      picker.replaceChildren(placeholder);
      groupsAllowed.forEach((group) => {
        const option = document.createElement('option');
        option.value = String(groups.indexOf(group));
        option.textContent = categoryName(group) + ' (' + routeCount(group) + ')';
        picker.append(option);
      });
      picker.disabled = groupsAllowed.length === 0;
      picker.value = [...picker.options].some((option) => option.value === previous) ? previous : '';
    };

    picker.addEventListener('change', () => {
      const group = groups[Number(picker.value)];
      if (!picker.value || !group || !visibleGroups().includes(group)) {
        picker.value = '';
        return;
      }
      // The original Phase 2 search owns filtering; clear only the UI filter
      // before revealing a category. No destination click or access bypass.
      const search = sidebar.querySelector('[data-wwz-nav-search]');
      if (search?.value) {
        search.value = '';
        search.dispatchEvent(new Event('input', { bubbles: true }));
      }
      group.open = true;
      const summary = group.querySelector(':scope > summary');
      const stickyHeight = jump.getBoundingClientRect().height + 12;
      const top = group.getBoundingClientRect().top - sidebar.getBoundingClientRect().top +
        sidebar.scrollTop - stickyHeight;
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      sidebar.scrollTo({ top: Math.max(0, top), behavior: reduced ? 'auto' : 'smooth' });
      summary?.focus({ preventScroll: true });
      picker.value = '';
    });

    window.addEventListener('wwz:viewchange', refresh);
    window.addEventListener('wwz:accesschange', refresh);
    window.addEventListener('wwz:authchange', refresh);
    if (typeof MutationObserver === 'function') {
      new MutationObserver(refresh).observe(groupsRoot, {
        subtree: true,
        attributes: true,
        attributeFilter: ['hidden', 'disabled'],
      });
    }
    refresh();
    sidebar.dataset.v310Ready = '1';
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else initialize();
})();
