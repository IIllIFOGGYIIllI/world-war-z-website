/* WWZ Website v1.63.0 — client-only shop navigation improvements.
   No order, payment, authentication or delivery requests are made here. */
(() => {
  'use strict';
  const toolbar = document.querySelector('.member-catalogue-toolbar');
  const toggle = document.querySelector('[data-wwz-filter-toggle]');
  if (toolbar && toggle) {
    toolbar.classList.add('wwz-shop-mobile-filters');
    toggle.addEventListener('click', () => {
      const expanded = toolbar.classList.toggle('wwz-filters-expanded');
      toggle.setAttribute('aria-expanded', String(expanded));
      toggle.querySelector('[aria-hidden]')?.replaceChildren(document.createTextNode(expanded ? '⌃' : '⌄'));
    });
  }
  const source = document.querySelector('[data-member-shop-cart-count]');
  const badge = document.querySelector('[data-wwz-cart-badge]');
  if (!source || !badge) return;
  const update = () => {
    // The cart count is produced by the existing shop controller; never infer an amount from untrusted text.
    const match = (source.textContent || '').match(/\d+/);
    badge.textContent = match ? match[0] : '0';
  };
  new MutationObserver(update).observe(source, { childList: true, characterData: true, subtree: true });
  update();
})();
