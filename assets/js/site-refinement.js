/* Sitewide progressive UI: no routing, auth, payment or map mutations. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const accessibleMain = () => {
    const element = $('#dashboard-content, #main-content, #shop-main, main');
    if (!element) return;
    if (!element.id) element.id = 'wwz-main-content';
    if (!$('[data-wwz-skip]')) {
      const link = document.createElement('a');
      link.href = '#' + element.id;
      link.textContent = 'Skip to main content';
      link.className = 'wwz-skip-link';
      link.dataset.wwzSkip = '';
      document.body.prepend(link);
    }
  };

  const improvePageTabs = () => {
    const page = location.pathname.split('/').pop() || 'index.html';
    let tabs = $('.wwz-page-tabs');
    // The global navigation deliberately replaces the shop's old anchors:
    // restore them as a dedicated, visible shopping journey instead.
    if (page === 'shop.html' && !tabs) {
      tabs = document.createElement('nav');
      tabs.className = 'wwz-page-tabs';
      tabs.setAttribute('aria-label', 'Shop sections');
      for (const [label, id] of [
        ['Catalogue', 'catalogue'], ['Vehicle Rentals', 'rentals'],
        ['Shopping Cart', 'cart'], ['My Orders', 'orders'],
      ]) {
        if (!document.getElementById(id)) continue;
        const link = document.createElement('a');
        link.href = '#' + id;
        link.textContent = label;
        tabs.append(link);
      }
      const before = $('.wwz-network-rail, .shop-topbar');
      before?.insertAdjacentElement('afterend', tabs);
    }
    if (!tabs) return;
    const preferred = page === 'donations.html'
      ? ['Packages', 'Single Items', 'Payment', 'My Orders']
      : page === 'index.html'
        ? ['Start Here', 'Overview', 'Systems', 'Commands', 'Roadmap']
        : [];
    if (page === 'index.html' && document.getElementById('getting-started')
        && ![...tabs.querySelectorAll('a')].some((a) => a.getAttribute('href') === '#getting-started')) {
      const start = document.createElement('a');
      start.href = '#getting-started';
      start.textContent = 'Start Here';
      tabs.prepend(start);
    }
    // Explicit journey order instead of alphabetical sorting; keep the
    // original anchor nodes and their event handlers.
    for (const label of preferred) {
      const link = [...tabs.querySelectorAll('a')].find((a) => a.textContent.trim() === label);
      if (link) tabs.append(link);
    }
  };

  const watchPageTabs = () => {
    const tabs = $('.wwz-page-tabs');
    if (!tabs) return;
    const records = $$('a[href^="#"]', tabs).map((link) => {
      const id = decodeURIComponent((link.getAttribute('href') || '').slice(1));
      const section = id && document.getElementById(id);
      return section ? { link, section, id } : null;
    }).filter(Boolean);
    if (!records.length) return;
    const setSelected = (id) => {
      records.forEach(({ link, id: target }) => {
        if (target === id) link.setAttribute('aria-current', 'location');
        else if (link.getAttribute('aria-current') === 'location') link.removeAttribute('aria-current');
      });
    };
    records.forEach(({ link, id }) => link.addEventListener('click', () => setSelected(id)));
    window.addEventListener('hashchange', () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (records.some((item) => item.id === id)) setSelected(id);
    });
    if (typeof IntersectionObserver === 'function') {
      const entries = new Set();
      const observer = new IntersectionObserver((changes) => {
        changes.forEach(({ target, isIntersecting }) => {
          if (isIntersecting) entries.add(target);
          else entries.delete(target);
        });
        const visible = records.filter(({ section }) => entries.has(section))
          .sort((a, b) => a.section.getBoundingClientRect().top - b.section.getBoundingClientRect().top);
        if (visible.length) setSelected(visible[0].id);
      }, { rootMargin: '-10% 0px -65% 0px', threshold: 0 });
      records.forEach(({ section }) => observer.observe(section));
    }
    const initial = decodeURIComponent(location.hash.slice(1));
    setSelected(records.some(({ id }) => id === initial) ? initial : records[0].id);
  };

  const workspaceLocation = () => {
    const main = $('#dashboard-content');
    const sidebar = $('.sidebar-navigation');
    if (!main || !sidebar || $('.wwz-location-bar', main)) return;
    const container = document.createElement('div');
    container.className = 'wwz-location-bar';
    container.setAttribute('role', 'navigation');
    container.setAttribute('aria-label', 'Current workspace and previous workspace');
    const title = document.createElement('span');
    title.setAttribute('aria-live', 'polite');
    const actions = document.createElement('div');
    actions.className = 'wwz-location-actions';
    const back = document.createElement('button');
    back.type = 'button';
    back.textContent = '← Previous workspace';
    back.hidden = true;
    const search = document.createElement('button');
    search.type = 'button';
    search.textContent = '⌕ Find a tool';
    search.addEventListener('click', () => $('[data-open-command-search]')?.click());
    actions.append(back, search);
    container.append(title, actions);
    const first = $('.dashboard-view', main);
    if (first) first.before(container);
    else main.prepend(container);

    let previous = null;
    let current = null;
    const allowed = (button) => Boolean(button && !button.disabled
      && !button.hidden && !button.closest('[hidden]'));
    const update = () => {
      const active = $('.side-link.active', sidebar);
      if (!allowed(active)) {
        title.textContent = 'Dashboard';
        back.hidden = true;
        return;
      }
      const label = active.dataset.navLabel
        || $('.side-link-copy strong', active)?.textContent?.trim()
        || 'Workspace';
      const group = active.closest('[data-nav-group]');
      const area = group?.querySelector(':scope > summary')?.textContent?.trim()?.replace(/\s+/g, ' ');
      title.replaceChildren();
      title.append(document.createTextNode('Dashboard / ' + (area ? area + ' / ' : '')));
      const strong = document.createElement('strong');
      strong.textContent = label;
      title.append(strong);
      active.setAttribute('aria-current', 'page');
      $$('.side-link[aria-current="page"]', sidebar).forEach((link) => {
        if (link !== active) link.removeAttribute('aria-current');
      });
      const route = active.dataset.view + '/' + (active.dataset.section || '');
      if (route !== current) {
        if (current !== null) previous = current;
        current = route;
      }
      const prevButton = $$('.side-link', sidebar).find((button) =>
        button.dataset.view + '/' + (button.dataset.section || '') === previous && allowed(button));
      back.hidden = !prevButton;
      back.onclick = prevButton ? () => {
        if (allowed(prevButton)) prevButton.click(); // Existing access guards own routing.
      } : null;
    };
    window.addEventListener('wwz:viewchange', update);
    window.addEventListener('wwz:accesschange', update);
    window.addEventListener('wwz:authchange', update);
    update();
  };

  const deferOffscreenImages = () => {
    if (typeof window.innerHeight !== 'number') return;
    // Runtime map tiles, hero/server branding and avatars retain their own loader.
    $$('main img, .page-content img, .member-shop-shell img, .donation-store-shell img')
      .forEach((img) => {
        if (img.closest('.hero,.site-header,.page-header,.shop-topbar,.donation-topbar,.dashboard-topbar,.dashboard-sidebar,.leaflet-container,[data-map]')) return;
        if (!img.hasAttribute('decoding')) img.decoding = 'async';
        if (!img.hasAttribute('loading')
            && img.getBoundingClientRect().top > window.innerHeight * 1.4) {
          img.loading = 'lazy';
        }
      });
  };

  const initialize = () => {
    accessibleMain();
    improvePageTabs();
    watchPageTabs();
    workspaceLocation();
    // Yield image processing until after the critical first layout.
    if ('requestIdleCallback' in window) window.requestIdleCallback(deferOffscreenImages, { timeout: 1200 });
    else window.addEventListener('load', deferOffscreenImages, { once: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
