/* WWZ v1.62.0: presentation-only accordion navigation. */
(() => {
  'use strict';
  const groups = [...document.querySelectorAll('.sidebar-navigation details[data-nav-group]')];
  if (!groups.length) return;
  const openOnly = (selected) => {
    if (!selected) return;
    groups.forEach((group) => { if (group !== selected && group.open) group.open = false; });
  };
  groups.forEach((group) => group.addEventListener('toggle', () => {
    if (group.open) openOnly(group);
  }));
  window.addEventListener('wwz:viewchange', () => {
    const active = document.querySelector('.sidebar-navigation .side-link.active');
    const group = active?.closest('[data-nav-group]');
    if (group) { group.open = true; openOnly(group); }
  });
  const activeGroup = document.querySelector('.sidebar-navigation .side-link.active')?.closest('[data-nav-group]');
  if (activeGroup) openOnly(activeGroup);
})();
