const commandCentreRefresh = document.querySelector('[data-refresh-command-centre]');
const commandCentreError = document.querySelector('[data-command-centre-error]');
const commandCentreAttention = document.querySelector('[data-command-centre-attention]');
const commandCentreAttentionEmpty = document.querySelector('[data-command-centre-attention-empty]');
const commandCentreActivity = document.querySelector('[data-command-centre-activity]');
const commandCentreActivityEmpty = document.querySelector('[data-command-centre-activity-empty]');
const commandCentreNavBadge = document.querySelector('[data-command-centre-nav-badge]');
const commandCentrePanel = document.querySelector('#dashboard-admin-command-centre');
let commandCentreRequestInProgress = false;
let commandCentreTimer = 0;
let commandCentreStaleTimer = 0;
let commandCentreLastPayload = null;
let commandCentreLastSuccessAt = 0;

const ensureM10Styles = () => {
  if (document.querySelector('link[data-command-centre-m10-style]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'assets/css/dashboard/command-centre-m10.css?v=1.27.0&rev=m10-admin-health-1';
  link.dataset.commandCentreM10Style = '';
  document.head.append(link);
};

const commandCentreSet = (selector, value) => {
  const element = document.querySelector(selector);
  if (element) element.textContent = value ?? '—';
};

const commandCentreDuration = (seconds) => {
  const total = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const commandCentreTime = (value) => {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

const commandCentreRelative = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'unknown';
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absolute = Math.abs(seconds);
  const formatter = new Intl.RelativeTimeFormat('en-AU', { numeric: 'auto' });
  if (absolute < 60) return formatter.format(seconds, 'second');
  if (absolute < 3600) return formatter.format(Math.round(seconds / 60), 'minute');
  if (absolute < 86400) return formatter.format(Math.round(seconds / 3600), 'hour');
  return formatter.format(Math.round(seconds / 86400), 'day');
};

const commandCentreJump = (view, section = '') => {
  if (typeof showView === 'function') showView(view, true, section);
};

document.querySelectorAll('[data-command-centre-jump]').forEach((button) => {
  button.addEventListener('click', () => commandCentreJump(button.dataset.commandCentreJump, button.dataset.commandCentreJumpSection || ''));
});

const m10SeverityWeight = Object.freeze({ critical: 0, warning: 1, info: 2, good: 3 });

const normaliseM10Severity = (value = '') => {
  const severity = String(value || '').trim().toLowerCase();
  if (['critical', 'danger', 'error'].includes(severity)) return 'critical';
  if (['warning', 'warn'].includes(severity)) return 'warning';
  if (['good', 'healthy', 'ok', 'success'].includes(severity)) return 'good';
  return 'info';
};

const m10SignalKey = (item) => `${String(item.title || '').trim().toLowerCase()}|${String(item.target_view || '')}|${String(item.target_section || '')}`;

const collectM10Signals = (payload = {}) => {
  const server = payload.server || {};
  const operations = server.operations || {};
  const deliveries = payload.deliveries || {};
  const tickets = payload.tickets || {};
  const moderation = payload.moderation?.summary || {};
  const notifications = payload.notifications || {};
  const configurationFailures = Array.isArray(payload.configuration_failures) ? payload.configuration_failures : [];
  const failures = Array.isArray(payload.failures) ? payload.failures : [];

  const signals = [];
  const seen = new Set();
  const add = (item) => {
    const normalized = {
      severity: normaliseM10Severity(item.severity),
      title: item.title || 'Operational signal',
      detail: item.detail || 'Open the relevant workspace for details.',
      target_view: item.target_view || 'staff',
      target_section: item.target_section || 'command-centre',
      source: item.source || 'command-centre',
    };
    const key = m10SignalKey(normalized);
    if (seen.has(key)) return;
    seen.add(key);
    signals.push(normalized);
  };

  (Array.isArray(payload.attention) ? payload.attention : []).forEach(add);

  const serverState = String(server.status || 'unavailable').toLowerCase();
  if (serverState === 'offline' || serverState === 'unavailable') {
    add({
      severity: 'critical',
      title: 'DayZ server is unavailable',
      detail: `Current server state: ${serverState}. Check Nitrado and server controls.`,
      target_view: 'staff',
      target_section: 'server-controls',
      source: 'server',
    });
  } else if (serverState === 'restarting') {
    add({
      severity: 'info',
      title: 'DayZ server is restarting',
      detail: 'The current restart cycle is in progress.',
      target_view: 'server',
      target_section: 'health',
      source: 'server',
    });
  }

  const nitradoState = String(operations.nitrado_state || 'unknown').toLowerCase();
  if (!['online', 'started', 'running'].includes(nitradoState) && serverState !== 'restarting') {
    add({
      severity: ['offline', 'stopped', 'unavailable'].includes(nitradoState) ? 'critical' : 'warning',
      title: 'Nitrado service needs attention',
      detail: `Nitrado reports ${nitradoState || 'unknown'}.`,
      target_view: 'staff',
      target_section: 'server-controls',
      source: 'nitrado',
    });
  }

  if (!operations.discord_ready) {
    add({
      severity: operations.discord_connected ? 'warning' : 'critical',
      title: 'Discord gateway is not ready',
      detail: operations.discord_connected
        ? 'The bot is connected to Discord but is not reporting a ready gateway.'
        : 'The bot is not reporting an active Discord gateway connection.',
      target_view: 'server',
      target_section: 'health',
      source: 'discord',
    });
  }

  if (operations.restart_schedule_configured && !operations.restart_schedule_synchronised) {
    add({
      severity: 'warning',
      title: 'Restart schedule is waiting for sync',
      detail: 'The restart schedule is configured but the next restart has not been synchronised.',
      target_view: 'server',
      target_section: 'health',
      source: 'restart',
    });
  }

  if (Number(deliveries.failed || 0) > 0) {
    add({
      severity: Number(deliveries.failed || 0) >= 3 ? 'critical' : 'warning',
      title: 'Automatic delivery failures',
      detail: `${Number(deliveries.failed || 0)} delivery job${Number(deliveries.failed || 0) === 1 ? '' : 's'} currently failed.`,
      target_view: 'delivery',
      target_section: 'queue',
      source: 'deliveries',
    });
  }

  if (Number(moderation.overdue || 0) > 0) {
    add({
      severity: Number(moderation.overdue || 0) >= 4 ? 'critical' : 'warning',
      title: 'Moderation deadlines overdue',
      detail: `${Number(moderation.overdue || 0)} moderation item${Number(moderation.overdue || 0) === 1 ? '' : 's'} passed the internal deadline.`,
      target_view: 'staff',
      target_section: 'queue',
      source: 'moderation',
    });
  }

  if (Number(tickets.unclaimed || 0) > 0) {
    add({
      severity: Number(tickets.unclaimed || 0) >= 5 ? 'warning' : 'info',
      title: 'Support tickets waiting for claim',
      detail: `${Number(tickets.unclaimed || 0)} open ticket${Number(tickets.unclaimed || 0) === 1 ? '' : 's'} currently unclaimed.`,
      target_view: 'tickets',
      target_section: 'administration',
      source: 'tickets',
    });
  }

  if (Number(notifications.failed || 0) > 0) {
    add({
      severity: 'warning',
      title: 'Notification routes have failures',
      detail: `${Number(notifications.failed || 0)} notification route${Number(notifications.failed || 0) === 1 ? '' : 's'} reported a failure.`,
      target_view: payload.access_level === 'owner' ? 'configuration' : 'staff',
      target_section: payload.access_level === 'owner' ? 'notifications' : 'failures',
      source: 'notifications',
    });
  }

  if (configurationFailures.length) {
    add({
      severity: configurationFailures.length >= 3 ? 'critical' : 'warning',
      title: 'Configuration validation failures',
      detail: `${configurationFailures.length} configuration check${configurationFailures.length === 1 ? '' : 's'} need review.`,
      target_view: 'staff',
      target_section: 'failures',
      source: 'configuration',
    });
  }

  if (failures.length) {
    add({
      severity: failures.length >= 3 ? 'critical' : 'warning',
      title: 'Operational failure queue is not empty',
      detail: `${failures.length} recorded operational failure${failures.length === 1 ? '' : 's'} need review or retry.`,
      target_view: 'staff',
      target_section: 'failures',
      source: 'failures',
    });
  }

  return signals.sort((a, b) => (m10SeverityWeight[a.severity] ?? 9) - (m10SeverityWeight[b.severity] ?? 9));
};

const calculateM10Health = (payload, signals) => {
  const server = payload.server || {};
  const operations = server.operations || {};
  const deliveries = payload.deliveries || {};
  const moderation = payload.moderation?.summary || {};
  const notifications = payload.notifications || {};
  const configurationFailures = Array.isArray(payload.configuration_failures) ? payload.configuration_failures.length : 0;
  const failures = Array.isArray(payload.failures) ? payload.failures.length : 0;

  let score = 100;
  const serverState = String(server.status || 'unavailable').toLowerCase();
  if (['offline', 'unavailable'].includes(serverState)) score -= 38;
  else if (serverState === 'restarting') score -= 4;

  const nitrado = String(operations.nitrado_state || 'unknown').toLowerCase();
  if (['offline', 'stopped', 'unavailable'].includes(nitrado)) score -= 24;
  else if (!['online', 'started', 'running'].includes(nitrado)) score -= 8;

  if (!operations.discord_connected) score -= 20;
  else if (!operations.discord_ready) score -= 10;

  if (operations.restart_schedule_configured && !operations.restart_schedule_synchronised) score -= 7;
  score -= Math.min(15, Number(deliveries.failed || 0) * 5);
  score -= Math.min(12, Number(moderation.overdue || 0) * 3);
  score -= Math.min(10, Number(notifications.failed || 0) * 4);
  score -= Math.min(12, configurationFailures * 4);
  score -= Math.min(15, failures * 5);
  score = Math.max(0, Math.min(100, Math.round(score)));

  const critical = signals.filter((item) => item.severity === 'critical').length;
  const warning = signals.filter((item) => item.severity === 'warning').length;
  const state = score >= 90 ? 'healthy' : score >= 75 ? 'watch' : score >= 55 ? 'degraded' : 'critical';
  const label = state === 'healthy' ? 'Healthy' : state === 'watch' ? 'Watch' : state === 'degraded' ? 'Degraded' : 'Critical';

  return { score, state, label, critical, warning };
};

const createM10AutomationRow = ({ label, state = 'good', value = 'Healthy', detail = '', view = '', section = '' }) => {
  const row = document.createElement('button');
  row.type = 'button';
  row.disabled = false;
  row.className = 'm10-automation-row';
  row.dataset.state = state;

  const indicator = document.createElement('span');
  indicator.className = 'm10-automation-indicator';
  indicator.setAttribute('aria-hidden', 'true');

  const copy = document.createElement('div');
  const strong = document.createElement('strong');
  const small = document.createElement('small');
  strong.textContent = label;
  small.textContent = detail;
  copy.append(strong, small);

  const status = document.createElement('b');
  status.textContent = value;

  row.append(indicator, copy, status);
  row.addEventListener('click', () => {
    if (view) commandCentreJump(view, section);
  });
  return row;
};

const ensureM10Panel = () => {
  ensureM10Styles();
  if (!commandCentrePanel) return null;
  let shell = commandCentrePanel.querySelector('[data-m10-health-shell]');
  if (shell) return shell;

  shell = document.createElement('section');
  shell.className = 'm10-health-shell';
  shell.dataset.m10HealthShell = '';
  shell.innerHTML = `
    <div class="m10-health-overview" data-m10-health-state="loading">
      <div class="m10-health-score">
        <span class="m10-health-ring" data-m10-health-ring><strong data-m10-health-score>—</strong><small>/100</small></span>
        <div>
          <p class="panel-kicker">Milestone 10 · Admin automation &amp; health</p>
          <h3 data-m10-health-label>Checking operational health</h3>
          <p data-m10-health-summary>Evaluating Railway, Discord, Nitrado, restart automation, queues and configuration health.</p>
        </div>
      </div>
      <div class="m10-health-stats">
        <div><span>Critical</span><strong data-m10-critical>—</strong></div>
        <div><span>Warnings</span><strong data-m10-warning>—</strong></div>
        <div><span>Automation</span><strong data-m10-automation-count>—</strong></div>
        <div><span>Snapshot</span><strong data-m10-snapshot>Waiting</strong></div>
      </div>
    </div>
    <div class="m10-health-grid">
      <article class="m10-health-card">
        <header><div><span>AUTOMATION WATCH</span><h3>Background Systems</h3></div><b>Read only</b></header>
        <div class="m10-automation-list" data-m10-automation-list></div>
      </article>
      <article class="m10-health-card">
        <header><div><span>HEALTH EXPLAINER</span><h3>Why This Score?</h3></div><b data-m10-health-grade>—</b></header>
        <div class="m10-health-explainer" data-m10-health-explainer></div>
      </article>
    </div>`;

  const healthGrid = commandCentrePanel.querySelector('.command-centre-health-grid');
  if (healthGrid) healthGrid.insertAdjacentElement('beforebegin', shell);
  else commandCentrePanel.querySelector('.panel-intro')?.insertAdjacentElement('afterend', shell);
  return shell;
};

const renderM10Automation = (payload = {}) => {
  const shell = ensureM10Panel();
  const list = shell?.querySelector('[data-m10-automation-list]');
  if (!list) return;
  list.replaceChildren();

  const server = payload.server || {};
  const operations = server.operations || {};
  const deliveries = payload.deliveries || {};
  const moderation = payload.moderation?.summary || {};
  const notifications = payload.notifications || {};
  const failures = Array.isArray(payload.failures) ? payload.failures : [];
  const configurationFailures = Array.isArray(payload.configuration_failures) ? payload.configuration_failures : [];

  const serverState = String(server.status || 'unavailable').toLowerCase();
  const nitradoState = String(operations.nitrado_state || 'unknown').toLowerCase();
  const restartState = operations.restart_schedule_configured
    ? (operations.restart_schedule_synchronised ? 'good' : 'warning')
    : 'info';
  const restartValue = operations.restart_schedule_configured
    ? (operations.restart_schedule_synchronised ? 'Synced' : 'Waiting')
    : 'Not configured';

  const rows = [
    {
      label: 'Restart scheduler',
      state: restartState,
      value: restartValue,
      detail: operations.restart_schedule_synchronised
        ? `${operations.next_scheduled_restart ? `Next ${commandCentreRelative(operations.next_scheduled_restart)}` : 'Schedule synchronised'}`
        : 'Open Operational Health for restart intelligence.',
      view: 'server',
      section: 'health',
    },
    {
      label: 'Discord gateway',
      state: operations.discord_ready ? 'good' : (operations.discord_connected ? 'warning' : 'critical'),
      value: operations.discord_ready ? 'Ready' : (operations.discord_connected ? 'Connected' : 'Offline'),
      detail: operations.discord_ready ? 'Gateway connected and ready.' : 'Bot gateway readiness needs review.',
      view: 'server',
      section: 'health',
    },
    {
      label: 'Nitrado link',
      state: ['online', 'started', 'running'].includes(nitradoState) ? 'good' : (serverState === 'restarting' ? 'info' : 'critical'),
      value: nitradoState.replace(/^./, (letter) => letter.toUpperCase()),
      detail: `DayZ server reports ${serverState}.`,
      view: 'staff',
      section: 'server-controls',
    },
    {
      label: 'Automatic deliveries',
      state: Number(deliveries.failed || 0) ? (Number(deliveries.failed || 0) >= 3 ? 'critical' : 'warning') : 'good',
      value: Number(deliveries.failed || 0) ? `${Number(deliveries.failed || 0)} failed` : 'Healthy',
      detail: `${Number(deliveries.items_pending || 0)} item deliveries pending · ${Number(deliveries.rentals_open || 0)} rentals open.`,
      view: 'delivery',
      section: 'queue',
    },
    {
      label: 'Notification routing',
      state: Number(notifications.failed || 0) ? 'warning' : 'good',
      value: Number(notifications.failed || 0) ? `${Number(notifications.failed || 0)} failed` : 'Healthy',
      detail: `${Number(notifications.enabled_routes || 0)} routes currently enabled.`,
      view: payload.access_level === 'owner' ? 'configuration' : 'staff',
      section: payload.access_level === 'owner' ? 'notifications' : 'failures',
    },
    {
      label: 'Moderation deadlines',
      state: Number(moderation.overdue || 0) ? (Number(moderation.overdue || 0) >= 4 ? 'critical' : 'warning') : 'good',
      value: Number(moderation.overdue || 0) ? `${Number(moderation.overdue || 0)} overdue` : 'On time',
      detail: `${Number(moderation.awaiting_review || 0)} moderation items awaiting review.`,
      view: 'staff',
      section: 'queue',
    },
    {
      label: 'Configuration checks',
      state: configurationFailures.length ? (configurationFailures.length >= 3 ? 'critical' : 'warning') : 'good',
      value: configurationFailures.length ? `${configurationFailures.length} failed` : 'Healthy',
      detail: configurationFailures.length ? 'Open Operational Failures to review validation issues.' : 'No reported configuration failures.',
      view: 'staff',
      section: 'failures',
    },
    {
      label: 'Failure / retry queue',
      state: failures.length ? (failures.length >= 3 ? 'critical' : 'warning') : 'good',
      value: failures.length ? `${failures.length} open` : 'Clear',
      detail: failures.length ? 'Recorded service failures are waiting for review or retry.' : 'No recorded operational failures.',
      view: 'staff',
      section: 'failures',
    },
  ];

  rows.forEach((row) => list.append(createM10AutomationRow(row)));
  commandCentreSet('[data-m10-automation-count]', rows.filter((row) => row.state === 'good').length + '/' + rows.length);
};

const renderM10Health = (payload = {}, signals = []) => {
  const shell = ensureM10Panel();
  if (!shell) return;

  const health = calculateM10Health(payload, signals);
  const overview = shell.querySelector('.m10-health-overview');
  if (overview) overview.dataset.m10HealthState = health.state;

  commandCentreSet('[data-m10-health-score]', health.score);
  commandCentreSet('[data-m10-health-label]', `${health.label} operational health`);
  commandCentreSet('[data-m10-critical]', health.critical);
  commandCentreSet('[data-m10-warning]', health.warning);
  commandCentreSet('[data-m10-health-grade]', health.label.toUpperCase());
  commandCentreSet('[data-m10-snapshot]', 'Live');

  const summary = health.state === 'healthy'
    ? 'Core services and automation are reporting healthy. Keep the Command Centre open for 30-second monitoring.'
    : health.state === 'watch'
      ? 'The platform is operating, but one or more queues or automation signals need observation.'
      : health.state === 'degraded'
        ? 'Multiple operational signals need Admin review. Use the prioritised queue below to open the affected workspace.'
        : 'Critical operational conditions are present. Review the highest-severity signals before routine administration.';
  commandCentreSet('[data-m10-health-summary]', summary);

  const explainer = shell.querySelector('[data-m10-health-explainer]');
  if (explainer) {
    explainer.replaceChildren();
    const priority = signals.filter((item) => ['critical', 'warning'].includes(item.severity)).slice(0, 5);
    if (!priority.length) {
      const row = document.createElement('div');
      row.className = 'm10-explainer-row';
      row.dataset.state = 'good';
      const strong = document.createElement('strong');
      const small = document.createElement('small');
      strong.textContent = 'No health deductions';
      small.textContent = 'No critical or warning conditions are currently reported by the Command Centre aggregate.';
      row.append(strong, small);
      explainer.append(row);
    } else {
      priority.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'm10-explainer-row';
        row.dataset.state = item.severity;
        const strong = document.createElement('strong');
        const small = document.createElement('small');
        strong.textContent = item.title;
        small.textContent = item.detail;
        row.append(strong, small);
        explainer.append(row);
      });
    }
  }

  renderM10Automation(payload);
};

const renderCommandCentreAttention = (items = []) => {
  if (!commandCentreAttention) return;
  commandCentreAttention.replaceChildren();
  if (commandCentreAttentionEmpty) commandCentreAttentionEmpty.hidden = items.length > 0;
  commandCentreSet('[data-command-centre-attention-count]', `${items.length} signal${items.length === 1 ? '' : 's'}`);
  if (commandCentreNavBadge) {
    const urgent = items.filter((item) => ['critical', 'warning'].includes(normaliseM10Severity(item.severity))).length;
    commandCentreNavBadge.textContent = String(urgent || items.length);
    commandCentreNavBadge.hidden = items.length === 0;
    commandCentreNavBadge.classList.toggle('danger', urgent > 0);
  }

  items.forEach((item) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = `command-centre-signal ${normaliseM10Severity(item.severity)}`;
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

  const signals = collectM10Signals(payload);
  renderM10Health(payload, signals);
  renderCommandCentreAttention(signals);
  renderCommandCentreActivity(payload);

  commandCentreLastPayload = payload;
  commandCentreLastSuccessAt = Date.now();
};

const updateCommandCentreFreshness = () => {
  const shell = ensureM10Panel();
  if (!shell) return;
  const overview = shell.querySelector('.m10-health-overview');
  const snapshot = shell.querySelector('[data-m10-snapshot]');
  if (!commandCentreLastSuccessAt) {
    if (snapshot) snapshot.textContent = 'Waiting';
    return;
  }

  const ageSeconds = Math.max(0, Math.floor((Date.now() - commandCentreLastSuccessAt) / 1000));
  const stale = ageSeconds >= 75;
  if (overview) overview.classList.toggle('is-stale', stale);
  if (snapshot) snapshot.textContent = stale ? `Stale · ${commandCentreDuration(ageSeconds)}` : ageSeconds < 10 ? 'Live' : `${ageSeconds}s ago`;
};

const startCommandCentreFreshnessWatch = () => {
  if (commandCentreStaleTimer) window.clearInterval(commandCentreStaleTimer);
  commandCentreStaleTimer = window.setInterval(updateCommandCentreFreshness, 5_000);
  updateCommandCentreFreshness();
};

const stopCommandCentreFreshnessWatch = () => {
  if (commandCentreStaleTimer) window.clearInterval(commandCentreStaleTimer);
  commandCentreStaleTimer = 0;
};

const loadCommandCentre = async (sessionToken = storageGet(AUTH_SESSION_KEY)) => {
  if (!sessionToken || commandCentreRequestInProgress) return false;
  commandCentreRequestInProgress = true;
  const originalLabel = commandCentreRefresh?.textContent || 'Refresh Overview';
  if (commandCentreRefresh) {
    commandCentreRefresh.setAttribute('disabled', '');
    commandCentreRefresh.textContent = 'Refreshing…';
  }
  if (commandCentreError) commandCentreError.hidden = true;

  try {
    const response = await window.WWZHttp.request(`${DASHBOARD_API_BASE}/api/admin/command-centre`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${sessionToken}` },
      cache: 'no-store'
    });
    const payload = await response.json().catch(() => ({}));
    if (typeof handleAdminPlayerAuthorizationResponse === 'function' && handleAdminPlayerAuthorizationResponse(response, payload, { actionRequest: false })) return false;
    if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Command Centre unavailable.');
    renderCommandCentre(payload);
    updateCommandCentreFreshness();
    return true;
  } catch (error) {
    updateCommandCentreFreshness();
    if (commandCentreError) {
      commandCentreError.hidden = false;
      commandCentreError.textContent = commandCentreLastPayload
        ? `Live refresh failed. The last successful Command Centre snapshot remains displayed. ${error instanceof Error ? error.message : ''}`.trim()
        : (error instanceof Error ? error.message : 'The Command Centre is temporarily unavailable.');
    }
    const shell = ensureM10Panel();
    shell?.querySelector('.m10-health-overview')?.classList.add('is-stale');
    commandCentreSet('[data-m10-snapshot]', commandCentreLastPayload ? 'Refresh failed' : 'Unavailable');
    return false;
  } finally {
    commandCentreRequestInProgress = false;
    if (commandCentreRefresh) {
      commandCentreRefresh.removeAttribute('disabled');
      commandCentreRefresh.textContent = originalLabel;
    }
  }
};

const scheduleCommandCentreRefresh = (active) => {
  if (commandCentreTimer) window.clearInterval(commandCentreTimer);
  commandCentreTimer = 0;
  if (active && !document.hidden) {
    commandCentreTimer = window.setInterval(() => {
      if (!document.hidden) loadCommandCentre();
    }, 30_000);
    startCommandCentreFreshnessWatch();
  } else {
    stopCommandCentreFreshnessWatch();
  }
};

const activateCommandCentreView = ({ view = '', section = '' } = {}) => {
  const active = view === 'staff' && section === 'command-centre';
  scheduleCommandCentreRefresh(active);
  if (active) {
    ensureM10Panel();
    loadCommandCentre();
  }
};

commandCentreRefresh?.addEventListener('click', () => loadCommandCentre());
window.addEventListener('wwz:viewchange', (event) => {
  activateCommandCentreView(event.detail || {});
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    scheduleCommandCentreRefresh(false);
    return;
  }
  activateCommandCentreView({
    view: document.querySelector('[data-view-panel="staff"].active') ? 'staff' : '',
    section: typeof activeDashboardSection === 'string' ? activeDashboardSection : '',
  });
});

window.__wwzCommandCentreReady = true;
if (document.querySelector('[data-view-panel="staff"].active')) {
  activateCommandCentreView({
    view: 'staff',
    section: typeof activeDashboardSection === 'string' ? activeDashboardSection : '',
  });
}
