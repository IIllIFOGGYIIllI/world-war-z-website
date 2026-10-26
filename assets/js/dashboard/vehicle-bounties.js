(() => {
  'use strict';
  if (window.__wwzVehicleBountiesReady) return;
  const root = document.querySelector('[data-vehicle-bounties]');
  if (!root) return;
  const API = 'https://world-war-z.up.railway.app';
  const qs = selector => root.querySelector(selector);
  const session = () => { try { return sessionStorage.getItem('wwz_dashboard_session') || ''; } catch { return ''; } };
  const server = () => window.WWZServerContext?.getSelectedServer?.() || null;
  const scope = () => String(server()?.key || '');
  const visible = () => document.querySelector('[data-view-panel="community"]')?.classList.contains('active')
    && (location.hash.includes('community/bounties') || root.getClientRects().length > 0);
  let requestBusy = false;
  let loadedScope = '';

  const message = (value, tone = '') => {
    const el = qs('[data-bounty-message]');
    if (!el) return;
    el.hidden = !value;
    el.textContent = String(value || '');
    el.dataset.tone = tone;
  };

  const request = async (path, options = {}) => {
    const token = session();
    const initialScope = scope();
    if (!token) throw new Error('Sign in with Discord to use vehicle bounties.');
    if (!initialScope) throw new Error('Choose Nasdara PvE or PvP before continuing.');
    const { response, payload } = await window.WWZHttp.json(API + path, {
      ...options,
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer ' + token,
        ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      },
    }, 30000);
    if (initialScope !== scope() || token !== session()) {
      throw new Error('Server or session changed. Open the current server and refresh.');
    }
    if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'The vehicle bounty request failed.');
    return payload;
  };

  const element = (tag, text = '', className = '') => {
    const node = document.createElement(tag);
    if (text) node.textContent = String(text);
    if (className) node.className = className;
    return node;
  };
  const formatDate = value => {
    const d = new Date(value || '');
    return Number.isNaN(d.getTime()) ? 'Unknown date' : d.toLocaleString('en-AU');
  };
  const evidence = (row, parent) => {
    const links = element('div', '', 'wwz-bounty-evidence');
    for (const [key, title] of [['before_url', 'Before screenshot'], ['after_url', 'After screenshot']]) {
      try {
        const url = new URL(row[key]);
        if (url.protocol !== 'https:') continue;
        const anchor = element('a', title);
        anchor.href = url.href;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        if (url.origin === API && url.pathname.startsWith('/api/account/vehicle-bounties/evidence/')) {
          anchor.addEventListener('click', event => {
            event.preventDefault();
            const tab = window.open('', '_blank');
            if (!tab) { message('Allow a new tab to view your private screenshot.', 'error'); return; }
            const token = session();
            const selected = scope();
            window.WWZHttp.request(url.href, {headers: {Authorization: 'Bearer ' + token}}, 30000)
              .then(async response => {
                if (!response.ok || token !== session() || selected !== scope()) throw new Error('Private screenshot is unavailable.');
                const data = await response.blob();
                if (!['image/png','image/jpeg','image/webp'].includes(data.type)) throw new Error('The uploaded image has an invalid format.');
                const objectUrl = URL.createObjectURL(data);
                tab.location.replace(objectUrl);
              })
              .catch(error => { tab.close(); message(error.message, 'error'); });
          });
        }
        links.append(anchor);
      } catch {}
    }
    parent.append(links);
  };
  const card = (row, admin = false) => {
    const container = element('article', '', 'wwz-bounty-card');
    const header = element('header');
    header.append(element('h5', '#' + row.id + ' · ' + (row.vehicle_name || 'Vehicle')));
    header.append(element('strong', String(row.status || '').replaceAll('_', ' ').toUpperCase()));
    container.append(header);
    container.append(element('p', 'X ' + Number(row.x).toFixed(1) + ' · Z ' + Number(row.z).toFixed(1) + ' · $' + Number(row.amount || 0).toLocaleString('en-AU') + ' · ' + formatDate(row.submitted_at)));
    if (admin) container.append(element('p', 'Submitted by ' + (row.display_name || 'Member') + ' (' + row.discord_id + ')'));
    if (row.notes) container.append(element('p', row.notes));
    if (row.admin_note) container.append(element('p', 'Staff note: ' + row.admin_note));
    if (row.last_error) container.append(element('p', 'Payment status: ' + row.last_error));
    evidence(row, container);
    if (admin && ['pending', 'payment_failed', 'paying'].includes(row.status)) {
      const controls = element('div', '', 'wwz-bounty-review');
      const note = document.createElement('input');
      note.type = 'text';
      note.maxLength = 500;
      note.placeholder = 'Review note / rejection reason';
      note.setAttribute('aria-label', 'Review note for claim ' + row.id);
      controls.append(note);
      const actionButton = (action, label, kind) => {
        const button = element('button', label, kind);
        button.type = 'button';
        button.addEventListener('click', () => void decide(row, action, note.value, button));
        controls.append(button);
      };
      if (row.status === 'pending') {
        actionButton('approve', 'Approve & Pay $5,000', 'primary-action');
        actionButton('reject', 'Reject Claim', 'danger-action');
      } else {
        actionButton('retry', 'Retry Existing Payout', 'secondary-action');
      }
      container.append(controls);
    }
    return container;
  };

  const render = (selector, rows, empty, admin = false) => {
    const target = qs(selector);
    if (!target) return;
    const entries = Array.isArray(rows) ? rows : [];
    target.replaceChildren(...(entries.length ? entries.map(row => card(row, admin)) : [element('p', empty)]));
  };

  const refresh = async (force = false) => {
    const current = scope();
    if (!current || !session()) {
      qs('[data-bounty-staff]').hidden = true;
      render('[data-bounty-mine]', [], 'Sign in with Discord and select a server to see your claims.');
      return;
    }
    if (requestBusy && !force) return;
    const mine = await request('/api/account/vehicle-bounties');
    render('[data-bounty-mine]', mine.claims, 'No vehicle claims submitted on this server yet.');
    const adminPanel = qs('[data-bounty-staff]');
    try {
      const staff = await request('/api/admin/vehicle-bounties');
      adminPanel.hidden = false;
      render('[data-bounty-queue]', staff.claims, 'There are no vehicle claims to review.', true);
    } catch (error) {
      adminPanel.hidden = true;
      if (!/forbidden|staff|permission|access/i.test(error.message)) console.warn('Vehicle bounty staff queue:', error.message);
    }
    loadedScope = current;
  };

  const decide = async (claim, action, note, button) => {
    if (requestBusy) return;
    if (action === 'reject' && String(note).trim().length < 3) {
      message('Add a reason of at least 3 characters before rejecting.', 'error');
      return;
    }
    const caption = action === 'approve' ? 'credit $5,000 to this server wallet' :
      action === 'reject' ? 'reject the claim without payment' : 'retry the same existing wallet credit';
    if (!window.confirm('Claim #' + claim.id + ': ' + caption + '?')) return;
    requestBusy = true;
    button.disabled = true;
    try {
      const result = await request('/api/admin/vehicle-bounties/action', {
        method: 'POST',
        body: JSON.stringify({ action, claim_id: claim.id, note }),
      });
      message(result.message || 'Review updated.', 'success');
      await refresh(true);
    } catch (error) {
      message(error.message, 'error');
    } finally {
      requestBusy = false;
      button.disabled = false;
    }
  };

  qs('[data-bounty-form]')?.addEventListener('submit', async event => {
    event.preventDefault();
    if (requestBusy) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    requestBusy = true;
    const submit = qs('[data-bounty-submit]');
    submit.disabled = true;
    try {
      for (const key of ['before_image', 'after_image']) {
        const file = fields.get(key);
        if (!(file instanceof File) || !file.size) throw new Error('Select both before and after screenshots.');
        if (file.size > 1000000) throw new Error('Each screenshot must be under 1 MB.');
        if (!['image/png','image/jpeg','image/webp'].includes(file.type)) throw new Error('Only PNG, JPEG and WebP screenshots can be uploaded.');
      }
      fields.set('action', 'submit');
      const response = await request('/api/account/vehicle-bounties/action', {
        method: 'POST', body: fields,
      });
      form.reset();
      root.querySelectorAll('[data-bounty-preview]').forEach(image => { image.hidden = true; image.removeAttribute('src'); });
      message(response.message || 'Claim submitted for staff review.', 'success');
      await refresh(true);
    } catch (error) {
      message(error.message, 'error');
    } finally {
      requestBusy = false;
      submit.disabled = false;
    }
  });
  root.querySelectorAll('[data-bounty-image]').forEach(input => {
    input.addEventListener('change', () => {
      const preview = qs('[data-bounty-preview="' + input.dataset.bountyImage + '"]');
      if (!preview) return;
      const file = input.files?.[0];
      preview.hidden = !file;
      if (file) {
        preview.src = URL.createObjectURL(file);
        preview.onload = () => URL.revokeObjectURL(preview.src);
      } else preview.removeAttribute('src');
    });
  });
  qs('[data-bounty-refresh]')?.addEventListener('click', () => {
    refresh(true).catch(error => message(error.message, 'error'));
  });
  qs('[data-bounty-open-map]')?.addEventListener('click', () => {
    document.querySelector('[data-view="map"][data-section="explorer"]')?.click();
    message('Choose a point on the map, then return to Vehicle Bounties and use Selected Map Point.');
  });
  qs('[data-bounty-use-selection]')?.addEventListener('click', () => {
    const point = window.WWZBountyMapSelection;
    if (!point || point.serverKey !== scope()) {
      message('Select a point on the current server map first.', 'error');
      return;
    }
    const form = qs('[data-bounty-form]');
    form.elements.x.value = Number(point.x).toFixed(1);
    form.elements.z.value = Number(point.z).toFixed(1);
    message('Selected map coordinates copied into your claim form.', 'success');
  });
  const activate = () => {
    const current = server();
    const title = qs('[data-bounty-server]');
    if (title) title.textContent = current ? ('Nasdara ' + (current.gameplay_mode === 'pvp' ? 'PvP' : 'PvE')) : 'Select Nasdara server';
    if (!current || current.map_key !== 'badlands') {
      message('This workspace is available on Nasdara PvE and PvP only.', 'error');
      return;
    }
    if (visible() && scope() !== loadedScope) refresh(true).catch(error => message(error.message, 'error'));
  };
  window.addEventListener('wwz:viewchange', event => {
    if (event.detail?.view === 'community' && event.detail?.section === 'bounties') activate();
  });
  window.addEventListener('wwz:serverchange', () => {
    loadedScope = '';
    qs('[data-bounty-staff]').hidden = true;
    qs('[data-bounty-form]')?.reset();
    render('[data-bounty-mine]', [], 'Loading claims for your selected server.');
    activate();
  });
  window.addEventListener('wwz:authchange', () => { loadedScope = ''; activate(); });
  window.__wwzVehicleBountiesReady = true;
  activate();
})();