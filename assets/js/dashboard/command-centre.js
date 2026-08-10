const commandCentreRefresh = document.querySelector('[data-refresh-command-centre]');
const commandCentreError = document.querySelector('[data-command-centre-error]');
const commandCentreAttention = document.querySelector('[data-command-centre-attention]');
const commandCentreAttentionEmpty = document.querySelector('[data-command-centre-attention-empty]');
const commandCentreActivity = document.querySelector('[data-command-centre-activity]');
const commandCentreActivityEmpty = document.querySelector('[data-command-centre-activity-empty]');
const commandCentreNavBadge = document.querySelector('[data-command-centre-nav-badge]');
let commandCentreRequestInProgress = false;
let commandCentreTimer = 0;

const commandCentreSet = (selector, value) => {
  const element = document.querySelector(selector);
  if (element) element.textContent = value ?? '—';
};

const commandCentreDuration = (seconds) => {
  const total = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const commandCentreTime = (value) => {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

const commandCentreJump = (view, section = '') => {
  if (typeof showView === 'function') showView(view, true, section);
};

document.querySelectorAll('[data-command-centre-jump]').forEach((button) => {
  button.addEventListener('click', () => commandCentreJump(button.dataset.commandCentreJump, button.dataset.commandCentreJumpSection || ''));
});

const renderCommandCentreAttention = (items = []) => {
  if (!commandCentreAttention) return;
  commandCentreAttention.replaceChildren();
  if (commandCentreAttentionEmpty) commandCentreAttentionEmpty.hidden = items.length > 0;
  commandCentreSet('[data-command-centre-attention-count]', `${items.length} signal${items.length === 1 ? '' : 's'}`);
  if (commandCentreNavBadge) {
    commandCentreNavBadge.textContent = String(items.length);
    commandCentreNavBadge.hidden = items.length === 0;
  }
  items.forEach((item) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = `command-centre-signal ${item.severity || 'info'}`;
    const copy = document.createElement('span');
    const title = document.createElement('strong');
    title.textContent = item.title || 'Operational signal';
    const detail = document.createElement('small');
    detail.textContent = item.detail || 'Open the relevant workspace for details.';
    copy.append(title, detail);
    const action = document.createElement('b');
    action.textContent = 'Open →';
    row.append(copy, action);
    row.addEventListener('click', () => commandCentreJump(item.target_view || 'staff', item.target_section || 'command-centre'));
    commandCentreAttention.append(row);
  });
};

const renderCommandCentreActivity = (payload) => {
  if (!commandCentreActivity) return;
  commandCentreActivity.replaceChildren();
  const players = Array.isArray(payload.activity?.players) ? payload.activity.players : [];
  const claims = Array.isArray(payload.objectives?.recent_claims) ? payload.objectives.recent_claims : [];
  const entries = [];
  players.slice(0, 6).forEach((player) => entries.push({
    icon: '●',
    title: player.psn_id || player.discord_name || 'Tracked survivor',
    detail: `Online${player.session_started_at ? ` · session since ${commandCentreTime(player.session_started_at)}` : ''}`
  }));
  claims.slice(0, 5).forEach((claim) => entries.push({
    icon: '◎',
    title: (claim.event_type || 'objective reward').replaceAll('_', ' '),
    detail: `${claim.actor_name || 'Survivor'} · ${claim.details || claim.target_label || 'Reward claimed'}`
  }));
  if (commandCentreActivityEmpty) commandCentreActivityEmpty.hidden = entries.length > 0;
  entries.forEach((entry) => {
    const row = document.createElement('div');
    row.className = 'command-centre-activity-row';
    const icon = document.createElement('span');
    icon.textContent = entry.icon;
    const copy = document.createElement('div');
    const strong = document.createElement('strong');
    strong.textContent = entry.title;
    const small = document.createElement('small');
    small.textContent = entry.detail;
    copy.append(strong, small);
    row.append(icon, copy);
    commandCentreActivity.append(row);
  });
};

const renderCommandCentre = (payload) => {
  const server = payload.server || {};
  const operations = server.operations || {};
  const players = server.players || {};
  const deliveries = payload.deliveries || {};
  const tickets = payload.tickets || {};
  const moderation = payload.moderation?.summary || {};
  const notifications = payload.notifications || {};
  const objectives = payload.objectives || {};
  const shop = payload.shop || {};

  commandCentreSet('[data-command-centre-server]', String(server.status || 'unavailable').replace(/^./, (c) => c.toUpperCase()));
  commandCentreSet('[data-command-centre-nitrado]', `Nitrado ${operations.nitrado_state || 'unknown'}`);
  commandCentreSet('[data-command-centre-api]', 'Online');
  commandCentreSet('[data-command-centre-api-uptime]', `Uptime ${commandCentreDuration(operations.api_uptime_seconds)}`);
  commandCentreSet('[data-command-centre-discord]', operations.discord_ready ? 'Ready' : (operations.discord_connected ? 'Connected' : 'Unavailable'));
  commandCentreSet('[data-command-centre-players]', `${Number(players.current || 0)} / ${Number(players.maximum || 0)}`);
  commandCentreSet('[data-command-centre-tracked]', `Tracked online ${Number(payload.activity?.tracked_online || 0)}`);
  commandCentreSet('[data-command-centre-restart]', commandCentreTime(operations.next_scheduled_restart));
  commandCentreSet('[data-command-centre-countdown]', operations.restart_countdown_seconds == null ? 'Countdown unavailable' : `${commandCentreDuration(operations.restart_countdown_seconds)} remaining`);

  commandCentreSet('[data-command-centre-deliveries]', Number(deliveries.items_pending || 0));
  commandCentreSet('[data-command-centre-delivery-failures]', `${Number(deliveries.failed || 0)} failures`);
  commandCentreSet('[data-command-centre-rentals]', Number(deliveries.rentals_open || 0));
  commandCentreSet('[data-command-centre-expiring]', `${Number(deliveries.rentals_expiring || 0)} near expiration`);
  commandCentreSet('[data-command-centre-tickets]', Number(tickets.open || 0));
  commandCentreSet('[data-command-centre-unclaimed]', `${Number(tickets.unclaimed || 0)} unclaimed`);
  commandCentreSet('[data-command-centre-moderation]', Number(moderation.awaiting_review || 0));
  commandCentreSet('[data-command-centre-overdue]', `${Number(moderation.overdue || 0)} overdue`);
  commandCentreSet('[data-command-centre-failures]', Number((payload.failures || []).length + Number(deliveries.failed || 0) + Number((payload.configuration_failures || []).length)));
  commandCentreSet('[data-command-centre-routes]', Number(notifications.enabled_routes || 0));
  commandCentreSet('[data-command-centre-notification-failures]', `${Number(notifications.failed || 0)} failed`);
  const notificationJump = document.querySelector('[data-command-centre-notification-jump]');
  if (notificationJump) {
    const owner = payload.access_level === 'owner';
    notificationJump.disabled = !owner;
    notificationJump.title = owner ? 'Open notification routing' : 'Notification routing is Owner-managed';
  }
  commandCentreSet('[data-command-centre-bounties]', Number(objectives.active_bounties || 0));
  commandCentreSet('[data-command-centre-contracts]', `${Number(objectives.active_contracts || 0)} active contracts`);
  commandCentreSet('[data-command-centre-refunds]', Number(shop.refunded || 0));
  commandCentreSet('[data-command-centre-shop-open]', `${Number(shop.pending || 0) + Number(shop.processing || 0)} manual orders open`);
  commandCentreSet('[data-command-centre-updated]', `Updated ${commandCentreTime(payload.checked_at)}`);

  renderCommandCentreAttention(Array.isArray(payload.attention) ? payload.attention : []);
  renderCommandCentreActivity(payload);
};

const loadCommandCentre = async (sessionToken = storageGet(AUTH_SESSION_KEY)) => {
  if (!sessionToken || commandCentreRequestInProgress) return false;
  commandCentreRequestInProgress = true;
  commandCentreRefresh?.setAttribute('disabled', '');
  if (commandCentreError) commandCentreError.hidden = true;
  try {
    const response = await fetch(`${DASHBOARD_API_BASE}/api/admin/command-centre`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${sessionToken}` },
      cache: 'no-store'
    });
    const payload = await response.json().catch(() => ({}));
    if (typeof handleAdminPlayerAuthorizationResponse === 'function' && handleAdminPlayerAuthorizationResponse(response, payload, { actionRequest: false })) return false;
    if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Command Centre unavailable.');
    renderCommandCentre(payload);
    return true;
  } catch (error) {
    if (commandCentreError) {
      commandCentreError.hidden = false;
      commandCentreError.textContent = error instanceof Error ? error.message : 'The Command Centre is temporarily unavailable.';
    }
    return false;
  } finally {
    commandCentreRequestInProgress = false;
    commandCentreRefresh?.removeAttribute('disabled');
  }
};

const scheduleCommandCentreRefresh = (active) => {
  if (commandCentreTimer) window.clearInterval(commandCentreTimer);
  commandCentreTimer = 0;
  if (active) commandCentreTimer = window.setInterval(() => loadCommandCentre(), 30_000);
};

commandCentreRefresh?.addEventListener('click', () => loadCommandCentre());
window.addEventListener('wwz:viewchange', (event) => {
  const active = event.detail?.view === 'staff' && event.detail?.section === 'command-centre';
  scheduleCommandCentreRefresh(active);
  if (active) loadCommandCentre();
});
