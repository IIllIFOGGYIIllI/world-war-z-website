(() => {
  'use strict';
  const root = document.querySelector('[data-donation-orders-admin]');
  if (!root) return;
  const URLS = {
    orders: `${DASHBOARD_API_BASE}/api/admin/donations/orders`,
    action: `${DASHBOARD_API_BASE}/api/admin/donations/orders/action`
  };
  const list = root.querySelector('[data-donation-orders-list]');
  const empty = root.querySelector('[data-donation-orders-empty]');
  const error = root.querySelector('[data-donation-orders-error]');
  const message = root.querySelector('[data-donation-orders-message]');
  const search = root.querySelector('[data-donation-orders-search]');
  const status = root.querySelector('[data-donation-orders-status]');
  const refresh = root.querySelector('[data-donation-orders-refresh]');
  const statNodes = Object.fromEntries([...root.querySelectorAll('[data-donation-order-stat]')].map((node) => [node.dataset.donationOrderStat, node]));
  let busy = false;
  let debounce = 0;

  const titleCase = (value) => String(value || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  const dateText = (value) => value ? formatAccountDate(value) : '—';
  const showMessage = (text = '', tone = 'error') => {
    if (!message) return;
    message.hidden = !text;
    message.textContent = text;
    message.dataset.tone = tone;
  };
  const actionButton = (label, action, className = 'secondary-action compact-action') => {
    const button = document.createElement('button');
    button.type = 'button'; button.disabled = false; button.className = className; button.textContent = label; button.dataset.orderAction = action;
    return button;
  };
  const valueCell = (label, value) => {
    const div = document.createElement('div');
    const span = document.createElement('span'); span.textContent = label;
    const strong = document.createElement('strong'); strong.textContent = value || '—';
    div.append(span, strong); return div;
  };

  const runAction = async (orderId, action, extra = {}) => {
    const token = storageGet(AUTH_SESSION_KEY);
    if (!token || busy) return;
    let note = '';
    if (action === 'approve') note = window.prompt('Optional approval note:', '') ?? '';
    if (action === 'needs_info') {
      const input = window.prompt('What information does the member need to provide?', 'Please provide the payment transaction/reference details.');
      if (input === null) return; note = input;
    }
    if (action === 'reject') {
      const input = window.prompt('Reason for rejecting this order:', 'Payment could not be verified.');
      if (input === null) return;
      if (!window.confirm(`Reject ${orderId}? This action is recorded in the order history.`)) return;
      note = input;
    }
    busy = true; showMessage('');
    try {
      const response = await authFetch(URLS.action, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, order_id: orderId, note, ...extra })
      });
      const payload = await response.json().catch(() => ({}));
      if (handleAdminPlayerAuthorizationResponse(response, payload, { actionRequest: true })) return;
      if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Donation order action failed.');
      showMessage(payload.message || 'Donation order updated.', 'success');
      busy = false;
      await load();
    } catch (problem) {
      showMessage(problem instanceof Error ? problem.message : 'Donation order action failed.', 'error');
    } finally { busy = false; }
  };

  const renderOrder = (order) => {
    const card = document.createElement('article'); card.className = 'donation-order-card';
    const head = document.createElement('div'); head.className = 'donation-order-card-head';
    const identity = document.createElement('div');
    const kicker = document.createElement('span'); kicker.className = 'panel-kicker'; kicker.textContent = order.order_id || 'Donation order';
    const title = document.createElement('h3'); title.textContent = order.purchase_name || 'Donation purchase';
    const owner = document.createElement('p'); owner.textContent = `${order.member_name || 'Unknown member'}${order.psn_id ? ` · PSN ${order.psn_id}` : ''}`;
    identity.append(kicker, title, owner);
    const badge = document.createElement('span'); badge.className = 'donation-order-status'; badge.dataset.status = order.status || ''; badge.textContent = titleCase(order.status);
    head.append(identity, badge);

    const body = document.createElement('div'); body.className = 'donation-order-card-body';
    const left = document.createElement('div');
    const meta = document.createElement('div'); meta.className = 'donation-order-meta';
    meta.append(
      valueCell('Amount', `$${order.price_aud || '0.00'} AUD`),
      valueCell('Payment', order.payment_method),
      valueCell('Created', dateText(order.created_at)),
      valueCell('Proof submitted', dateText(order.proof_submitted_at)),
      valueCell('Ticket', order.ticket_number ? `#${order.ticket_number}` : 'Not created'),
      valueCell('Approved by', order.approved_by_name || '—')
    );
    left.append(meta);
    if (order.payment_reference || order.member_note || order.admin_note) {
      const proof = document.createElement('div'); proof.className = 'donation-order-proof';
      const strong = document.createElement('strong'); strong.textContent = 'Payment / notes'; proof.append(strong);
      [order.payment_reference && `Reference: ${order.payment_reference}`, order.member_note && `Member: ${order.member_note}`, order.admin_note && `Admin: ${order.admin_note}`].filter(Boolean).forEach((line) => { const p = document.createElement('p'); p.textContent = line; proof.append(p); });
      left.append(proof);
    }

    const benefits = document.createElement('div'); benefits.className = 'donation-order-benefits';
    const benefitHeading = document.createElement('strong'); benefitHeading.textContent = 'Fulfilment'; benefits.append(benefitHeading);
    (order.fulfilment || []).forEach((benefit) => {
      const row = document.createElement('div'); row.className = 'donation-benefit-task'; row.dataset.status = benefit.status || 'pending';
      const copy = document.createElement('div');
      const strong = document.createElement('strong'); strong.textContent = benefit.label || 'Order benefit';
      const small = document.createElement('small'); small.textContent = `${titleCase(benefit.status || 'pending')} · ${titleCase(benefit.mode || 'manual')}${benefit.note ? ` · ${benefit.note}` : ''}`;
      copy.append(strong, small); row.append(copy);
      if (['fulfilment', 'completed'].includes(order.status)) {
        if (benefit.status === 'fulfilled') {
          const reopen = actionButton('Reopen', 'benefit'); reopen.addEventListener('click', () => runAction(order.order_id, 'benefit', { benefit_key: benefit.key, benefit_status: 'pending' })); row.append(reopen);
        } else {
          const done = actionButton('Mark Fulfilled', 'benefit', 'primary-action compact-action'); done.addEventListener('click', () => runAction(order.order_id, 'benefit', { benefit_key: benefit.key, benefit_status: 'fulfilled' })); row.append(done);
        }
      }
      benefits.append(row);
    });
    body.append(left, benefits);

    const actions = document.createElement('div'); actions.className = 'donation-order-actions';
    if (order.ticket_url) {
      const ticket = document.createElement('a'); ticket.className = 'secondary-action compact-action'; ticket.href = order.ticket_url; ticket.target = '_blank'; ticket.rel = 'noreferrer'; ticket.textContent = 'Open Purchase Ticket'; actions.append(ticket);
    }
    if (['awaiting_payment', 'proof_submitted', 'needs_info'].includes(order.status)) {
      const approve = actionButton('Approve Payment', 'approve', 'primary-action compact-action'); approve.addEventListener('click', () => runAction(order.order_id, 'approve')); actions.append(approve);
      const info = actionButton('Need More Info', 'needs_info'); info.addEventListener('click', () => runAction(order.order_id, 'needs_info')); actions.append(info);
      const reject = actionButton('Reject', 'reject', 'danger-action compact-action'); reject.addEventListener('click', () => runAction(order.order_id, 'reject')); actions.append(reject);
    }
    card.append(head, body, actions); return card;
  };

  const load = async () => {
    const token = storageGet(AUTH_SESSION_KEY);
    if (!token || !['staff', 'owner'].includes(dashboardAccessLevel) || busy) return false;
    busy = true; refresh?.setAttribute('disabled', ''); error.hidden = true;
    try {
      const params = new URLSearchParams();
      if (status?.value && status.value !== 'all') params.set('status', status.value);
      if (search?.value.trim()) params.set('q', search.value.trim());
      const response = await authFetch(`${URLS.orders}?${params}`, { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } });
      const payload = await response.json().catch(() => ({}));
      if (handleAdminPlayerAuthorizationResponse(response, payload, { actionRequest: false })) return false;
      if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Donation orders unavailable.');
      const stats = payload.stats || {};
      Object.entries(statNodes).forEach(([key, node]) => { node.textContent = new Intl.NumberFormat('en-AU').format(Number(stats[key]) || 0); });
      list.replaceChildren();
      (payload.orders || []).forEach((order) => list.append(renderOrder(order)));
      empty.hidden = Boolean((payload.orders || []).length);
      return true;
    } catch (problem) {
      error.hidden = false; error.textContent = problem instanceof Error ? problem.message : 'Donation orders are temporarily unavailable.'; return false;
    } finally { busy = false; refresh?.removeAttribute('disabled'); }
  };

  refresh?.addEventListener('click', load);
  status?.addEventListener('change', load);
  search?.addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(load, 350); });
  window.addEventListener('wwz:viewchange', (event) => { if (event.detail?.view === 'staff' && event.detail?.section === 'donation-orders') load(); });
  window.__wwzDonationOrdersReady = true;
})();
