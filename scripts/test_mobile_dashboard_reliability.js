'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = (path) => fs.readFileSync(path, 'utf8');
const shell = read('assets/js/dashboard/shell.js');
const css = read('assets/css/dashboard/mobile-reliability.css');
const page = read('dashboard.html');
const legacy = read('assets/css/dashboard/core.css');
assert.ok(legacy.includes('@media (max-width: 920px)'), 'legacy tablet breakpoint is present');
assert.ok(css.includes('@media (max-width: 980px)'), 'drawer starts at single-column breakpoint');
assert.ok(shell.includes("window.matchMedia('(max-width: 980px)')"), 'JS must match CSS tablet breakpoint');
assert.ok(css.includes('.dashboard-sidebar.open') && css.includes('translate3d(0, 0, 0)'));
assert.ok(css.includes('.sidebar-scrim.open { display: block !important; }'));
assert.ok(css.includes('.mobile-menu {') && css.includes('display: grid !important;'));
assert.ok(css.includes('body.wwz-mobile-nav-open') && shell.includes("document.body.classList.toggle('wwz-mobile-nav-open', open)"));
assert.ok(shell.includes('sidebar.inert = mobile && !open'), 'closed drawer cannot retain focus');
assert.ok(shell.includes("sidebar.setAttribute('aria-hidden', String(mobile && !open))"), 'closed drawer is hidden from accessibility tree');
assert.ok(shell.includes("sidebarToggle?.focus({ preventScroll: true })"), 'focus is restored when the drawer closes');
assert.ok(shell.includes("sidebarToggle?.setAttribute('aria-label', open ? 'Close dashboard menu' : 'Open dashboard menu')"),
  'mobile drawer toggle announces its current action');
assert.ok(shell.includes("event.key === 'Tab' && mobileSidebarMedia.matches && sidebar?.classList.contains('open')"),
  'keyboard focus is contained while the mobile drawer is open');
assert.ok(shell.includes('getSidebarFocusableElements()') && shell.includes('focusableElements[lastIndex].focus({ preventScroll: true })'),
  'Shift+Tab wraps from the first visible drawer control to the last');
assert.ok(shell.includes("!element.closest('[hidden], [inert], [aria-hidden=\"true\"]')"),
  'focus trap excludes hidden and inaccessible drawer controls');
assert.ok(shell.includes("mobileSidebarMedia.addEventListener('change', handleSidebarBreakpointChange)"), 'resize resets state');
assert.ok(shell.includes('const closeSidebar = (restoreFocus = false) =>'), 'existing navigation close method preserved');
assert.ok(css.includes('max-height: min(94dvh') && css.includes('env(safe-area-inset-bottom'), 'dialog respects viewport and safe areas');
assert.ok(css.includes('font-size: max(16px, 1em) !important;'), 'Safari form inputs avoid unwanted zoom');
assert.ok(css.includes('.wwz-table-scroll') && css.includes('overflow-x: auto'), 'wide data tables remain scrollable');
assert.ok(page.includes('assets/css/dashboard/mobile-reliability.css?v=1.22.93&rev=tablet-1'));
assert.ok(page.includes('assets/js/dashboard/shell.js?v=1.25.1&amp;rev=mobile-drawer-focus-1'));
console.log('PASS: tablet drawer, iOS dialog and mobile touch reliability guards');
