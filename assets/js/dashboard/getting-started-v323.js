/* WWZ V3.23 · Verified, server-scoped getting-started checklist. */
(function (root) {
  'use strict';
  if (!root || typeof document === 'undefined') return;
  const panel = document.querySelector('[data-view-panel="getting-started"]');
  if (!panel) return;
  const API = 'https://world-war-z.up.railway.app/api/account/getting-started';
  const TOKEN_KEY = 'wwz_dashboard_session';
  const $ = selector => panel.querySelector(selector);
  const heading = $('[data-v323-heading]');
  const serverLabel = $('[data-v323-server]');
  const count = $('[data-v323-count]');
  const progress = $('[data-v323-track]');
  const fill = $('[data-v323-fill]');
  const status = $('[data-v323-status]');
  const list = $('[data-v323-checklist]');
  const refresh = $('[data-v323-refresh]');
  let active = false;
  let requestNumber = 0;
  let busy = false;
  let lastServerKey = '';
  const token = () => {
    try { return root.sessionStorage?.getItem(TOKEN_KEY) || ''; } catch (_) { return ''; }
  };
  const selectedServer = () => root.WWZServerContext?.getSelectedServer?.() || null;
  const serverKey = () => String(selectedServer()?.key || '');
  const ready = () => Boolean(active && token() && serverKey());
  const make = (tag, className, copy) => {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (copy !== undefined) item.textContent = String(copy);
    return item;
  };
  const message = (value, tone) => {
    status.textContent = String(value || '');
    status.dataset.tone = tone || '';
  };
  const invalidate = () => {
    requestNumber += 1;
    busy = false;
    lastServerKey = '';
    if (refresh) refresh.disabled = false;
    list.replaceChildren();
    progress?.setAttribute('aria-valuenow', '0');
    if (fill) fill.style.width = '0%';
    count.textContent = 'Not checked';
    heading.textContent = 'Your checklist';
    serverLabel.textContent = String(selectedServer()?.name || 'Choose a server');
    message('Sign in with Discord and choose a Nasdara server to check your progress.');
  };
  const linkFor = key => {
    if (key === 'policies') return { href: 'terms.html', label: 'Review policies' };
    if (key === 'playstation') return { route: 'linked-psns', label: 'Link PlayStation' };
    if (key === 'discord') return { route: 'players', section: 'account', label: 'Account Centre' };
    return null;
  };
  const goTo = (view, section = '') => {
    // Use the real sidebar button and its existing access control/routing.
    const sidebar = document.querySelector('.sidebar-navigation');
    const buttons = sidebar?.querySelectorAll('.side-link[data-view]') || [];
    const candidate = Array.from(buttons).find(button =>
      button.dataset.view === view && (!section || button.dataset.section === section)
      && !button.hidden && !button.closest('[hidden]'));
    if (candidate) candidate.click();
  };
  const render = result => {
    const steps = Array.isArray(result.steps) ? result.steps : [];
    if (!steps.length || steps.some(s => !s || typeof s.complete !== 'boolean'))
      throw new Error('Incomplete setup status.');
    const complete = steps.filter(s => s.complete).length;
    const total = steps.length;
    heading.textContent = result.ready ? 'You are ready to explore World War Z' : 'Complete your account setup';
    serverLabel.textContent = String(result.server?.name || selectedServer()?.name || 'Nasdara');
    count.textContent = complete + ' of ' + total + ' steps complete';
    progress?.setAttribute('aria-valuemax', String(total));
    progress?.setAttribute('aria-valuenow', String(complete));
    if (fill) fill.style.width = ((complete / total) * 100).toFixed(1) + '%';
    list.replaceChildren();
    for (let i = 0; i < steps.length; i += 1) {
      const step = steps[i], item = make('li', 'wwz-v323-step');
      item.dataset.complete = String(step.complete);
      const icon = make('span', 'wwz-v323-step-icon', step.complete ? '✓' : String(i+1));
      icon.setAttribute('aria-hidden', 'true');
      const content = make('div', 'wwz-v323-step-content');
      content.append(make('strong', '', step.title || 'Setup step'),
                     make('p', '', step.description || ''));
      item.append(icon, content);
      const link = !step.complete ? linkFor(String(step.key || '')) : null;
      if (link) {
        const action = make(link.href ? 'a' : 'button',
                            'secondary-action wwz-v323-step-action', link.label);
        if (link.href) {
          action.href = link.href;
        } else {
          action.type = 'button';
          action.addEventListener('click', () => goTo(link.route, link.section));
        }
        item.append(action);
      }
      if (step.key === 'policies' && !step.complete) {
        content.append(make('small', '',
          'After you sign in, the website will show the acceptance prompt when required.'));
      }
      list.append(item);
    }
    message(result.ready
      ? 'Your required setup is complete. An additional PlayStation account is optional.'
      : 'You can finish the remaining steps at your own pace.', 'success');
  };
  const load = async () => {
    if (!ready() || busy) return;
    if (!root.WWZHttp?.request) {
      message('The secure account connection is unavailable. Please try again.', 'error');
      return;
    }
    const turn = ++requestNumber, server = serverKey(), capturedToken = token();
    lastServerKey = server;
    busy = true;
    refresh.disabled = true;
    message('Checking your saved account progress…', '');
    try {
      const response = await root.WWZHttp.request(API, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer ' + capturedToken
        },
      }, 15000);
      const result = await response.json().catch(() => ({}));
      if (turn !== requestNumber || serverKey() !== server ||
          token() !== capturedToken || !active) return;
      if (!response.ok || result.status !== 'ok') {
        throw new Error(result.message || 'Your setup progress could not be loaded.');
      }
      if (result.server?.key !== server) {
        throw new Error('Your selected server changed. Refresh your setup checklist.');
      }
      render(result);
    } catch (error) {
      if (turn === requestNumber)
        message(error.message || 'Unable to load your setup progress. Try again.', 'error');
    } finally {
      if (turn === requestNumber) {
        busy = false;
        refresh.disabled = false;
      }
    }
  };
  refresh?.addEventListener('click', load);
  panel.querySelectorAll('[data-v323-route]').forEach(button => {
    button.addEventListener('click', () => {
      const key = button.dataset.v323Route;
      if (key === 'map') goTo('map', 'explorer');
      else if (key === 'tickets') goTo('tickets', 'support');
      else if (key === 'linked-psns') goTo('linked-psns', 'overview');
    });
  });
  root.addEventListener('wwz:authchange', event => {
    const loggedIn = event.detail?.authenticated === true;
    if (!loggedIn) invalidate();
    else if (active) load();
  });
  root.addEventListener('wwz:serverchange', () => {
    invalidate();
    if (active && ready()) load();
  });
  root.addEventListener('wwz:policyaccepted', () => {
    if (active) load();
  });
  root.addEventListener('wwz:viewchange', event => {
    const wasActive = active;
    active = event.detail?.view === 'getting-started';
    if (!active && wasActive) invalidate();
    if (active && ready()) load();
  });
  // Support direct links from Discord, including mobile home-screen navigation.
  const restore = () => {
    active = Boolean(document.querySelector(
      '.sidebar-navigation .side-link.active[data-view="getting-started"]'
    )) || String(root.location?.hash || '').startsWith('#getting-started/');
    if (active && ready()) load();
  };
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', restore, { once: true });
  else restore();
})(typeof window !== 'undefined' ? window : null);
