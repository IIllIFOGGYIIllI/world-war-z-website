(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const fileName = () => {
    const name = location.pathname.split('/').filter(Boolean).pop() || 'index.html';
    return name.includes('.') ? name : 'index.html';
  };

  const GLOBAL_LINKS = [
    { label: 'Dashboard', href: 'dashboard.html', detail: 'Command Centre' },
    { label: 'Donations', href: 'donations.html', detail: 'Support WWZ' },
    { label: 'Policies', href: 'legal.html', detail: 'Legal & community policies' },
    { label: 'Rules', href: 'rules.html', detail: 'Server rules' },
    { label: 'Shop', href: 'shop.html', detail: 'Survivor shop' },
  ];

  const POLICY_FILES = new Set([
    'community-guidelines.html', 'legal.html', 'moderation-policy.html', 'privacy.html', 'terms.html'
  ]);

  const isCurrent = (href) => {
    const current = fileName();
    if (href === 'legal.html' && POLICY_FILES.has(current)) return true;
    return current === href;
  };

  const makeGlobalLink = ({ label, href }, className = '') => {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = label;
    if (className) link.className = className;
    if (isCurrent(href)) link.setAttribute('aria-current', 'page');
    return link;
  };

  const normalizePublicNavigation = () => {
    const nav = $('.site-navigation, .page-nav, .donation-topnav, .shop-topnav');
    if (!nav) return;
    nav.replaceChildren(...GLOBAL_LINKS.map((entry) => makeGlobalLink(entry)));
    const discord = document.createElement('a');
    discord.href = 'https://discord.gg/worldwarzps';
    discord.target = '_blank';
    discord.rel = 'noreferrer';
    discord.textContent = 'Discord';
    discord.className = 'wwz-discord-link';
    nav.append(discord);
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
      const menuButton = $('[data-menu-button]');
      menuButton?.setAttribute('aria-expanded', 'false');
      nav.classList.remove('open');
    }));
  };

  const addPageTabs = () => {
    if ($('.wwz-page-tabs')) return;
    const current = fileName();
    let entries = [];
    if (current === 'index.html') {
      entries = [
        ['Commands', '#commands'], ['Overview', '#overview'], ['Roadmap', '#roadmap'], ['Systems', '#systems']
      ];
    } else if (current === 'donations.html') {
      entries = [
        ['My Orders', '#orders'], ['Packages', '#packages'], ['Payment', '.donation-payment-section'], ['Single Items', '#items']
      ];
    }
    if (!entries.length) return;
    const nav = document.createElement('nav');
    nav.className = 'wwz-page-tabs';
    nav.setAttribute('aria-label', 'On this page');
    entries.sort((a, b) => a[0].localeCompare(b[0])).forEach(([label, target]) => {
      const link = document.createElement('a');
      link.textContent = label;
      if (target.startsWith('.')) {
        const section = $(target);
        if (!section) return;
        if (!section.id) section.id = `wwz-${label.toLowerCase().replace(/\s+/g, '-')}`;
        link.href = `#${section.id}`;
      } else {
        link.href = target;
      }
      nav.append(link);
    });
    const header = $('.site-header, .donation-topbar');
    if (header) header.insertAdjacentElement('afterend', nav);
  };

  const sortDashboardNavigation = () => {
    const sidebar = $('.dashboard-sidebar');
    if (!sidebar) return;
    $$('.nav-group-links', sidebar).forEach((host) => {
      const links = $$('.side-link', host);
      if (links.length < 2) return;
      const pinned = new Set(['Overview']);
      links.sort((left, right) => {
        const a = $('.side-link-copy strong', left)?.textContent?.trim() || left.dataset.navLabel || '';
        const b = $('.side-link-copy strong', right)?.textContent?.trim() || right.dataset.navLabel || '';
        if (pinned.has(a) !== pinned.has(b)) return pinned.has(a) ? -1 : 1;
        return a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true });
      });
      links.forEach((link) => host.append(link));
    });
  };

  const sortFooterLinks = () => {
    $$('footer').forEach((footer) => {
      const containers = $$('div', footer).filter((node) => node.children.length > 1 && [...node.children].every((child) => child.tagName === 'A'));
      containers.forEach((container) => {
        [...container.children]
          .sort((a, b) => a.textContent.trim().localeCompare(b.textContent.trim(), undefined, { sensitivity: 'base' }))
          .forEach((link) => container.append(link));
      });
    });
  };

  const ensureGlobalFooter = () => {
    if (fileName() === 'dashboard.html' || fileName() === 'map-link.html') return;
    const existing = $('footer');
    if (existing) return;
    const footer = document.createElement('footer');
    footer.className = 'wwz-global-footer';
    const inner = document.createElement('div');
    inner.className = 'wwz-global-footer-inner';
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = 'World War Z Community';
    const text = document.createElement('p');
    text.textContent = 'Independent PlayStation DayZ community tools. Not affiliated with Bohemia Interactive, Sony, Discord, Nitrado, GitHub or Railway.';
    copy.append(title, text);
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Footer navigation');
    GLOBAL_LINKS.forEach((entry) => nav.append(makeGlobalLink(entry)));
    inner.append(copy, nav);
    footer.append(inner);
    document.body.append(footer);
  };

  const quickEntries = () => {
    const entries = GLOBAL_LINKS.map((entry) => ({ ...entry, kind: 'Website' }));
    entries.push({ label: 'Changelog', href: 'changelog.html', detail: 'Website release history', kind: 'Website' });
    entries.push({ label: 'Community Guidelines', href: 'community-guidelines.html', detail: 'Conduct & fair play', kind: 'Policy' });
    entries.push({ label: 'Moderation Policy', href: 'moderation-policy.html', detail: 'Moderation standards', kind: 'Policy' });
    entries.push({ label: 'Privacy', href: 'privacy.html', detail: 'Privacy policy', kind: 'Policy' });
    entries.push({ label: 'Terms', href: 'terms.html', detail: 'Terms of use', kind: 'Policy' });
    entries.push({ label: 'Discord', href: 'https://discord.gg/worldwarzps', detail: 'Open the WWZ Discord', kind: 'Community', external: true });
    return entries.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
  };

  const createQuickAccess = () => {
    if (fileName() === 'dashboard.html' || $('.wwz-quick-access-button')) return;
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.disabled = false;
    trigger.className = 'wwz-quick-access-button';
    trigger.textContent = 'Quick Access';
    trigger.setAttribute('aria-label', 'Open quick access');
    trigger.title = 'Quick Access (Ctrl+K)';

    const dialog = document.createElement('dialog');
    dialog.className = 'wwz-quick-dialog';
    dialog.setAttribute('aria-labelledby', 'wwz-quick-title');
    dialog.innerHTML = `
      <div class="wwz-quick-shell">
        <div class="wwz-quick-heading">
          <div><p class="panel-kicker">World War Z</p><h2 id="wwz-quick-title">Quick Access</h2></div>
          <button class="wwz-quick-close" type="button" aria-label="Close quick access">×</button>
        </div>
        <input class="wwz-quick-search" type="search" autocomplete="off" placeholder="Search pages…" aria-label="Search quick access">
        <div class="wwz-quick-list"></div>
      </div>`;
    const list = $('.wwz-quick-list', dialog);
    const search = $('.wwz-quick-search', dialog);
    const entries = quickEntries();

    const render = () => {
      const query = search.value.trim().toLowerCase();
      list.replaceChildren();
      entries
        .filter((entry) => !query || `${entry.label} ${entry.detail} ${entry.kind}`.toLowerCase().includes(query))
        .forEach((entry) => {
          const link = document.createElement('a');
          link.className = 'wwz-quick-item';
          link.href = entry.href;
          if (entry.external) { link.target = '_blank'; link.rel = 'noreferrer'; }
          const copy = document.createElement('span');
          const strong = document.createElement('strong'); strong.textContent = entry.label;
          const small = document.createElement('small'); small.textContent = entry.detail;
          const badge = document.createElement('b'); badge.textContent = entry.kind;
          copy.append(strong, small); link.append(copy, badge); list.append(link);
        });
    };

    const open = () => { if (!dialog.open) dialog.showModal(); render(); requestAnimationFrame(() => search.focus()); };
    const close = () => { if (dialog.open) dialog.close(); };
    trigger.addEventListener('click', open);
    $('.wwz-quick-close', dialog).addEventListener('click', close);
    dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });
    search.addEventListener('input', render);
    document.body.append(trigger, dialog);
    render();

    window.WWZQuickAccess = { open, close };
  };

  const createBackToTop = () => {
    if ($('.wwz-back-to-top')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'wwz-back-to-top';
    button.textContent = '↑';
    button.setAttribute('aria-label', 'Back to top');
    button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    const update = () => button.classList.toggle('visible', window.scrollY > 650);
    window.addEventListener('scroll', update, { passive: true });
    document.body.append(button);
    update();
  };

  const installKeyboardAccess = () => {
    if ($('[data-open-command-search]')) return; // Dashboard shell already owns Ctrl/Cmd+K and /.
    document.addEventListener('keydown', (event) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k') return;
      const tag = event.target?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      event.preventDefault();
      window.WWZQuickAccess?.open?.();
    });
  };

  const markUiReady = () => {
    document.documentElement.dataset.wwzUi = '1.23.0';
    document.body.classList.add('wwz-ui-ready');
  };

  const start = () => {
    normalizePublicNavigation();
    addPageTabs();
    sortDashboardNavigation();
    ensureGlobalFooter();
    sortFooterLinks();
    createQuickAccess();
    createBackToTop();
    installKeyboardAccess();
    markUiReady();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
