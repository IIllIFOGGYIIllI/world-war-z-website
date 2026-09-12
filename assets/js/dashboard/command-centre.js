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
let commandCentreBackgroundTimer = 0;
let commandCentreLastPayload = null;
let commandCentreLastSuccessAt = 0;
let commandCentreViewActive = false;
let commandCentreMonitorArmed = false;
let m10PushStatusCheckedAt = 0;
let m10PushStatusInProgress = false;
let commandCentreSecurityRequestInProgress = false;
let commandCentreSecurityLoaded = false;

const M10_MONITOR_SESSION_KEY = 'wwz_m10_admin_monitor_armed_v1';
const M10_STATE_STORAGE_PREFIX = 'wwz_m10_health_state_v1';
const M10_HISTORY_STORAGE_PREFIX = 'wwz_m10_health_history_v1';
const M10_MAX_HISTORY = 40;

const ensureM10Styles = () => {
  if (document.querySelector('link[data-command-centre-m10-style]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'assets/css/dashboard/command-centre-m10.css?v=1.46.0&rev=command-centre-security-1';
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

const m10SelectedServer = () => window.WWZServerContext?.getSelectedServer?.() || null;

const m10ServerKey = () => {
  const server = m10SelectedServer();
  const key = String(server?.key || server?.map_key || 'unknown').trim().toLowerCase();
  return key.replace(/[^a-z0-9-]/g, '-') || 'unknown';
};

const m10StorageKey = (prefix) => `${prefix}:${m10ServerKey()}`;

const m10ReadJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const m10WriteJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

const m10SetMonitorArmed = (armed) => {
  commandCentreMonitorArmed = Boolean(armed);
  try {
    if (commandCentreMonitorArmed) sessionStorage.setItem(M10_MONITOR_SESSION_KEY, '1');
    else sessionStorage.removeItem(M10_MONITOR_SESSION_KEY);
  } catch {}
};

const m10RestoreMonitorArmed = () => {
  try {
    commandCentreMonitorArmed = sessionStorage.getItem(M10_MONITOR_SESSION_KEY) === '1';
  } catch {
    commandCentreMonitorArmed = false;
  }
};

const m10ReadHistory = () => {
  const history = m10ReadJson(m10StorageKey(M10_HISTORY_STORAGE_PREFIX), []);
  return Array.isArray(history) ? history : [];
};

const m10WriteHistory = (history) => {
  const clean = Array.isArray(history) ? history.slice(0, M10_MAX_HISTORY) : [];
  m10WriteJson(m10StorageKey(M10_HISTORY_STORAGE_PREFIX), clean);
};

const m10MarkHistoryReviewed = () => {
  const history = m10ReadHistory().map((item) => ({ ...item, unread: false }));
  m10WriteHistory(history);
  renderM10ChangeHistory();
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
      <article class="m10-health-card m10-change-card">
        <header>
          <div><span>PROACTIVE ATTENTION</span><h3>Recent Health Changes</h3></div>
          <div class="m10-change-actions">
            <b data-m10-change-count>0 new</b>
            <button type="button" data-m10-mark-reviewed disabled>Mark reviewed</button>
          </div>
        </header>
        <div class="m10-change-list" data-m10-change-list></div>
      </article>
      <article class="m10-health-card m10-push-card">
        <header><div><span>ADMIN NOTIFICATION DELIVERY</span><h3>Browser / Companion Push</h3></div><b data-m10-push-badge>Checking</b></header>
        <div class="m10-push-control">
          <div>
            <strong data-m10-push-state>Checking Admin health notifications…</strong>
            <small data-m10-push-detail>Only warning, critical and recovery transitions are delivered. Stable healthy checks stay quiet.</small>
          </div>
          <div class="m10-push-actions">
            <button type="button" data-m10-push-settings>Notification settings</button>
            <button type="button" data-m10-push-test disabled>Send test alert</button>
          </div>
        </div>
      </article>
    </div>`;

  const healthGrid = commandCentrePanel.querySelector('.command-centre-health-grid');
  if (healthGrid) healthGrid.insertAdjacentElement('beforebegin', shell);
  else commandCentrePanel.querySelector('.panel-intro')?.insertAdjacentElement('afterend', shell);

  const markReviewed = shell.querySelector('[data-m10-mark-reviewed]');
  markReviewed?.addEventListener('click', () => m10MarkHistoryReviewed());
  shell.querySelector('[data-m10-push-settings]')?.addEventListener('click', () => {
    commandCentreJump('community', 'notifications');
  });
  shell.querySelector('[data-m10-push-test]')?.addEventListener('click', () => {
    void sendM10AdminPushTest();
  });
  renderM10ChangeHistory();
  void refreshM10AdminPushStatus({ force: true });
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

const m10SnapshotCounters = (payload = {}) => ({
  delivery_failures: Number(payload.deliveries?.failed || 0),
  moderation_overdue: Number(payload.moderation?.summary?.overdue || 0),
  notification_failures: Number(payload.notifications?.failed || 0),
  configuration_failures: Array.isArray(payload.configuration_failures) ? payload.configuration_failures.length : 0,
  operational_failures: Array.isArray(payload.failures) ? payload.failures.length : 0,
  unclaimed_tickets: Number(payload.tickets?.unclaimed || 0),
});

const m10BuildState = (payload, signals) => {
  const health = calculateM10Health(payload, signals);
  return {
    captured_at: new Date().toISOString(),
    health: { score: health.score, state: health.state, label: health.label },
    signals: Object.fromEntries(signals.map((item) => [m10SignalKey(item), {
      severity: item.severity,
      title: item.title,
      detail: item.detail,
      target_view: item.target_view,
      target_section: item.target_section,
      source: item.source,
    }])),
    counters: m10SnapshotCounters(payload),
  };
};

const m10CreateChange = ({ type, severity = 'info', title, detail, target_view = 'staff', target_section = 'command-centre' }) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  at: new Date().toISOString(),
  type,
  severity: normaliseM10Severity(severity),
  title,
  detail,
  target_view,
  target_section,
  unread: true,
});

const m10CounterDefinitions = Object.freeze({
  delivery_failures: ['Automatic delivery failures increased', 'delivery', 'queue'],
  moderation_overdue: ['Overdue moderation queue increased', 'staff', 'queue'],
  notification_failures: ['Notification failures increased', 'configuration', 'notifications'],
  configuration_failures: ['Configuration failures increased', 'staff', 'failures'],
  operational_failures: ['Operational failure queue increased', 'staff', 'failures'],
  unclaimed_tickets: ['Unclaimed ticket queue increased', 'tickets', 'administration'],
});

const detectM10Changes = (previous, current) => {
  if (!previous || !previous.signals || !previous.health) return [];

  const changes = [];
  const previousSignals = previous.signals || {};
  const currentSignals = current.signals || {};

  Object.entries(currentSignals).forEach(([key, signal]) => {
    const before = previousSignals[key];
    if (!before) {
      if (['critical', 'warning', 'info'].includes(signal.severity)) {
        changes.push(m10CreateChange({
          type: 'new',
          severity: signal.severity,
          title: `New: ${signal.title}`,
          detail: signal.detail,
          target_view: signal.target_view,
          target_section: signal.target_section,
        }));
      }
      return;
    }

    const beforeWeight = m10SeverityWeight[normaliseM10Severity(before.severity)] ?? 9;
    const afterWeight = m10SeverityWeight[normaliseM10Severity(signal.severity)] ?? 9;
    if (afterWeight < beforeWeight) {
      changes.push(m10CreateChange({
        type: 'escalated',
        severity: signal.severity,
        title: `Escalated: ${signal.title}`,
        detail: `${before.severity} → ${signal.severity}. ${signal.detail}`,
        target_view: signal.target_view,
        target_section: signal.target_section,
      }));
    } else if (afterWeight > beforeWeight) {
      changes.push(m10CreateChange({
        type: 'improved',
        severity: signal.severity === 'info' ? 'good' : signal.severity,
        title: `Improved: ${signal.title}`,
        detail: `${before.severity} → ${signal.severity}. ${signal.detail}`,
        target_view: signal.target_view,
        target_section: signal.target_section,
      }));
    }
  });

  Object.entries(previousSignals).forEach(([key, signal]) => {
    if (currentSignals[key]) return;
    changes.push(m10CreateChange({
      type: 'recovered',
      severity: 'good',
      title: `Recovered: ${signal.title}`,
      detail: 'The condition is no longer present in the latest Command Centre snapshot.',
      target_view: signal.target_view,
      target_section: signal.target_section,
    }));
  });

  const previousCounters = previous.counters || {};
  const currentCounters = current.counters || {};
  Object.entries(m10CounterDefinitions).forEach(([key, [label, view, section]]) => {
    const before = Number(previousCounters[key] || 0);
    const after = Number(currentCounters[key] || 0);
    if (before > 0 && after > before) {
      changes.push(m10CreateChange({
        type: 'increased',
        severity: key === 'operational_failures' && after >= 3 ? 'critical' : 'warning',
        title: label,
        detail: `${before} → ${after} since the previous successful health snapshot.`,
        target_view: view,
        target_section: section,
      }));
    }
  });

  const beforeState = String(previous.health?.state || '');
  const afterState = String(current.health?.state || '');
  const stateRank = { healthy: 0, watch: 1, degraded: 2, critical: 3 };
  if (beforeState && afterState && beforeState !== afterState) {
    const worsened = (stateRank[afterState] ?? 9) > (stateRank[beforeState] ?? 9);
    changes.push(m10CreateChange({
      type: worsened ? 'health-drop' : 'health-recovery',
      severity: worsened ? (afterState === 'critical' ? 'critical' : 'warning') : 'good',
      title: worsened ? 'Overall operational health dropped' : 'Overall operational health recovered',
      detail: `${previous.health.label || beforeState} ${previous.health.score}/100 → ${current.health.label || afterState} ${current.health.score}/100.`,
      target_view: 'staff',
      target_section: 'command-centre',
    }));
  }

  return changes;
};

const storeM10StateAndChanges = (payload, signals) => {
  const stateKey = m10StorageKey(M10_STATE_STORAGE_PREFIX);
  const previous = m10ReadJson(stateKey, null);
  const current = m10BuildState(payload, signals);
  const changes = detectM10Changes(previous, current);

  m10WriteJson(stateKey, current);

  if (changes.length) {
    const history = [...changes, ...m10ReadHistory()].slice(0, M10_MAX_HISTORY);
    m10WriteHistory(history);
  }

  return { current, changes, baselineCreated: !previous };
};

const createM10ChangeRow = (item) => {
  const row = document.createElement('button');
  row.type = 'button';
  row.disabled = false;
  row.className = 'm10-change-row';
  row.dataset.state = normaliseM10Severity(item.severity);
  row.dataset.unread = String(Boolean(item.unread));

  const marker = document.createElement('span');
  marker.className = 'm10-change-marker';
  marker.setAttribute('aria-hidden', 'true');

  const copy = document.createElement('div');
  const strong = document.createElement('strong');
  const small = document.createElement('small');
  strong.textContent = item.title || 'Operational change';
  small.textContent = `${commandCentreRelative(item.at)} · ${item.detail || ''}`.trim();
  copy.append(strong, small);

  const state = document.createElement('b');
  state.textContent = String(item.type || 'change').replaceAll('-', ' ');

  row.append(marker, copy, state);
  row.addEventListener('click', () => commandCentreJump(item.target_view || 'staff', item.target_section || 'command-centre'));
  return row;
};

const renderM10ChangeHistory = () => {
  const shell = ensureM10Panel();
  if (!shell) return;

  const list = shell.querySelector('[data-m10-change-list]');
  const count = shell.querySelector('[data-m10-change-count]');
  const markReviewed = shell.querySelector('[data-m10-mark-reviewed]');
  if (!list) return;

  const history = m10ReadHistory();
  const unread = history.filter((item) => item.unread).length;
  if (count) count.textContent = `${unread} new`;
  if (markReviewed) markReviewed.disabled = unread === 0;

  list.replaceChildren();
  if (!history.length) {
    const empty = document.createElement('div');
    empty.className = 'm10-change-empty';
    const strong = document.createElement('strong');
    const small = document.createElement('small');
    strong.textContent = 'Monitoring baseline established';
    small.textContent = 'Stable healthy refreshes stay quiet. New problems, escalations, recoveries and queue growth will appear here.';
    empty.append(strong, small);
    list.append(empty);
    return;
  }

  history.slice(0, 12).forEach((item) => list.append(createM10ChangeRow(item)));
};

const ensureM10Toast = () => {
  let toast = document.querySelector('[data-m10-proactive-toast]');
  if (toast) return toast;

  toast = document.createElement('button');
  toast.type = 'button';
  toast.disabled = false;
  toast.className = 'm10-proactive-toast';
  toast.dataset.m10ProactiveToast = '';
  toast.hidden = true;
  toast.addEventListener('click', () => {
    toast.hidden = true;
    commandCentreJump('staff', 'command-centre');
  });
  document.body.append(toast);
  return toast;
};

let m10ToastTimer = 0;
const surfaceM10Changes = (changes = []) => {
  renderM10ChangeHistory();
  const actionable = changes.filter((item) => ['critical', 'warning'].includes(normaliseM10Severity(item.severity)));
  const recovery = changes.filter((item) => normaliseM10Severity(item.severity) === 'good');
  const chosen = actionable[0] || recovery[0];
  if (!chosen) return;

  const toast = ensureM10Toast();
  const extra = changes.length > 1 ? ` +${changes.length - 1} more` : '';
  toast.textContent = `${chosen.title}${extra}`;
  toast.dataset.state = normaliseM10Severity(chosen.severity);
  toast.hidden = false;

  window.clearTimeout(m10ToastTimer);
  m10ToastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 9_000);
};

const setM10PushStatus = ({ badge = '—', state = 'Unavailable', detail = '', enabled = false } = {}) => {
  const shell = ensureM10Panel();
  if (!shell) return;
  const badgeNode = shell.querySelector('[data-m10-push-badge]');
  const stateNode = shell.querySelector('[data-m10-push-state]');
  const detailNode = shell.querySelector('[data-m10-push-detail]');
  const testButton = shell.querySelector('[data-m10-push-test]');
  if (badgeNode) badgeNode.textContent = badge;
  if (stateNode) stateNode.textContent = state;
  if (detailNode) detailNode.textContent = detail;
  if (testButton) {
    testButton.disabled = !enabled || m10PushStatusInProgress;
    testButton.title = enabled
      ? 'Queue an Admin-health Web Push test for your subscribed browser devices.'
      : 'Enable the Admin health alerts topic in Notification settings first.';
  }
};

const refreshM10AdminPushStatus = async ({ force = false } = {}) => {
  if (m10PushStatusInProgress) return false;
  if (!force && m10PushStatusCheckedAt && Date.now() - m10PushStatusCheckedAt < 60_000) return true;

  const sessionToken = storageGet(AUTH_SESSION_KEY);
  if (!sessionToken) {
    setM10PushStatus({
      badge: 'Sign in', state: 'Discord sign-in required',
      detail: 'Admin notification preferences require the current authenticated Discord account.'
    });
    return false;
  }

  m10PushStatusInProgress = true;
  try {
    const response = await window.WWZHttp.request(`${DASHBOARD_API_BASE}/api/account/notifications`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${sessionToken}` },
      cache: 'no-store'
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Notification preferences unavailable.');

    const push = payload.push || {};
    const topics = new Set(Array.isArray(push.topics) ? push.topics : []);
    const available = new Set(Array.isArray(push.available_topics) ? push.available_topics : []);
    const adminTopicAvailable = available.has('admin_health');
    const enabled = Boolean(push.server_enabled && push.subscribed && topics.has('admin_health'));

    if (!push.server_enabled) {
      setM10PushStatus({
        badge: 'Unavailable', state: 'Web Push is not configured',
        detail: 'Railway VAPID delivery is currently unavailable.'
      });
    } else if (!adminTopicAvailable) {
      setM10PushStatus({
        badge: 'Restricted', state: 'Admin health topic unavailable',
        detail: 'Your current Discord account is not authorised for Admin-health notifications.'
      });
    } else if (!push.subscribed) {
      setM10PushStatus({
        badge: 'Off', state: 'Browser Push is not enabled on this account',
        detail: 'Open Notification settings, enable browser notifications, then select Admin health alerts.'
      });
    } else if (!topics.has('admin_health')) {
      setM10PushStatus({
        badge: 'Topic off', state: 'Admin health alerts are not selected',
        detail: 'Open Notification settings and enable the Admin health alerts topic for this server.'
      });
    } else {
      setM10PushStatus({
        badge: 'Enabled', state: `Admin health Push enabled · ${Number(push.devices || 0)} device(s)`,
        detail: 'Server-side monitoring can now notify you when a new warning/critical condition appears or an alerted condition recovers.',
        enabled: true,
      });
    }
    m10PushStatusCheckedAt = Date.now();
    return enabled;
  } catch (error) {
    setM10PushStatus({
      badge: 'Unavailable', state: 'Notification status could not refresh',
      detail: error instanceof Error ? error.message : 'Try again from Notification settings.'
    });
    return false;
  } finally {
    m10PushStatusInProgress = false;
    const testButton = ensureM10Panel()?.querySelector('[data-m10-push-test]');
    if (testButton && testButton.title.startsWith('Queue an Admin-health')) testButton.disabled = false;
  }
};

const sendM10AdminPushTest = async () => {
  if (m10PushStatusInProgress) return false;
  const enabled = await refreshM10AdminPushStatus({ force: true });
  if (!enabled) return false;

  const sessionToken = storageGet(AUTH_SESSION_KEY);
  const testButton = ensureM10Panel()?.querySelector('[data-m10-push-test]');
  const originalLabel = testButton?.textContent || 'Send test alert';
  m10PushStatusInProgress = true;
  if (testButton) {
    testButton.disabled = true;
    testButton.textContent = 'Queuing…';
  }
  try {
    const response = await window.WWZHttp.request(`${DASHBOARD_API_BASE}/api/admin/community/action`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      cache: 'no-store',
      body: JSON.stringify({ action: 'test_admin_health_push' }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Admin notification test could not be queued.');
    setM10PushStatus({
      badge: 'Test queued', state: 'Admin health test notification queued',
      detail: 'The server will deliver the test through the same Admin-only Web Push path used by real M10 alerts.',
      enabled: true,
    });
    return true;
  } catch (error) {
    setM10PushStatus({
      badge: 'Test failed', state: 'Admin health test could not be queued',
      detail: error instanceof Error ? error.message : 'Try again after refreshing your notification preferences.',
      enabled: true,
    });
    return false;
  } finally {
    m10PushStatusInProgress = false;
    if (testButton) {
      testButton.textContent = originalLabel;
      testButton.disabled = false;
    }
  }
};

const securityField = (selector) => document.querySelector(selector);

const setSecurityMessage = (message = '', tone = '') => {
  const element = securityField('[data-security-message]');
  if (!element) return;
  element.hidden = !message;
  element.textContent = message;
  element.dataset.tone = tone;
};

const securityNumber = (selector, fallback = 0) => {
  const value = Number(securityField(selector)?.value);
  return Number.isFinite(value) ? value : fallback;
};

const renderSecurityEvents = (events = []) => {
  const list = securityField('[data-security-recent-list]');
  const empty = securityField('[data-security-recent-empty]');
  if (!list) return;
  list.replaceChildren();
  const threats = (Array.isArray(events) ? events : []).filter((event) => {
    const type = String(event?.event_type || '');
    return type.startsWith('spam_') || type.startsWith('raid_');
  });
  if (empty) empty.hidden = threats.length > 0;
  commandCentreSet('[data-security-recent-count]', `${threats.length} shown`);
  threats.slice(0, 12).forEach((event) => {
    const row = document.createElement('div');
    row.className = 'security-event-row';
    row.dataset.severity = String(event.severity || 'info');
    const marker = document.createElement('span');
    marker.className = 'security-event-marker';
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    const type = String(event.event_type || '').replaceAll('_', ' ');
    title.textContent = `${type.replace(/^./, (c) => c.toUpperCase())}${event.user_name ? ` · ${event.user_name}` : ''}`;
    const detail = document.createElement('small');
    detail.textContent = `${event.detail || 'Security event'} · ${event.action || 'alert'} · ${commandCentreTime(event.created_at)}`;
    copy.append(title, detail);
    row.append(marker, copy);
    list.append(row);
  });
};

const populateSecurityResources = (payload = {}) => {
  const settings = payload.settings || {};
  const channelSelect = securityField('[data-security-alert-channel]');
  if (channelSelect) {
    const selected = String(settings.alert_channel_key || '');
    channelSelect.replaceChildren();
    const automatic = document.createElement('option');
    automatic.value = '';
    automatic.textContent = 'Use existing moderation / alt logs';
    channelSelect.append(automatic);
    (payload.channels || []).forEach((channel) => {
      const option = document.createElement('option');
      option.value = String(channel.key || '');
      option.textContent = channel.category ? `${channel.category} / #${channel.name}` : `#${channel.name}`;
      channelSelect.append(option);
    });
    channelSelect.value = selected;
  }
  const roleSelect = securityField('[data-security-exempt-roles]');
  if (roleSelect) {
    const selected = new Set((settings.exempt_role_keys || []).map(String));
    roleSelect.replaceChildren();
    (payload.roles || []).forEach((role) => {
      const option = document.createElement('option');
      option.value = String(role.key || '');
      option.textContent = role.name || 'Role';
      option.selected = selected.has(option.value);
      roleSelect.append(option);
    });
  }
};

const renderSecuritySettings = (payload = {}) => {
  const settings = payload.settings || {};
  const summary = payload.summary || {};
  const setCheck = (selector, value) => {
    const field = securityField(selector);
    if (field) field.checked = Boolean(value);
  };
  const setValue = (selector, value) => {
    const field = securityField(selector);
    if (field) field.value = value ?? '';
  };
  setCheck('[data-security-enabled]', settings.enabled);
  setCheck('[data-security-spam-enabled]', settings.anti_spam_enabled);
  setCheck('[data-security-raid-enabled]', settings.anti_raid_enabled);
  setCheck('[data-security-lockdown]', settings.emergency_join_quarantine);
  setValue('[data-security-burst-limit]', settings.burst_message_limit);
  setValue('[data-security-burst-window]', settings.burst_window_seconds);
  setValue('[data-security-duplicate-limit]', settings.duplicate_message_limit);
  setValue('[data-security-duplicate-window]', settings.duplicate_window_seconds);
  setValue('[data-security-mention-limit]', settings.mention_limit);
  setValue('[data-security-timeout]', settings.timeout_minutes);
  setValue('[data-security-spam-action]', settings.spam_action || 'delete_timeout');
  setValue('[data-security-join-limit]', settings.join_limit);
  setValue('[data-security-join-window]', settings.join_window_seconds);
  setValue('[data-security-account-age]', settings.suspicious_account_age_days);
  setValue('[data-security-raid-action]', settings.raid_action || 'alert');
  commandCentreSet('[data-security-server-name]', `${payload.server?.name || 'Selected server'} · ${payload.server?.map || ''}`.replace(/ · $/, ''));
  commandCentreSet('[data-security-events-24h]', Number(summary.events_24h || 0));
  commandCentreSet('[data-security-spam-24h]', Number(summary.spam_24h || 0));
  commandCentreSet('[data-security-raid-24h]', Number(summary.raid_24h || 0));
  commandCentreSet('[data-security-quarantine-state]', settings.emergency_join_quarantine ? 'ACTIVE' : 'Off');
  commandCentreSet('[data-command-centre-security-events]', Number(summary.events_24h || 0));
  commandCentreSet(
    '[data-command-centre-security-state]',
    settings.emergency_join_quarantine
      ? 'Emergency quarantine ACTIVE'
      : (settings.enabled ? 'Protection enabled' : 'Protection disabled')
  );
  populateSecurityResources(payload);
  renderSecurityEvents(payload.recent || []);
};

const loadSecurityCentre = async (sessionToken = storageGet(AUTH_SESSION_KEY), { quiet = false } = {}) => {
  if (!sessionToken || commandCentreSecurityRequestInProgress) return false;
  commandCentreSecurityRequestInProgress = true;
  const refresh = securityField('[data-refresh-security]');
  const original = refresh?.textContent || 'Refresh';
  if (refresh && !quiet) {
    refresh.disabled = true;
    refresh.textContent = 'Refreshing…';
  }
  try {
    const response = await window.WWZHttp.request(`${DASHBOARD_API_BASE}/api/admin/security`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${sessionToken}` },
      cache: 'no-store'
    });
    const payload = await response.json().catch(() => ({}));
    if (typeof handleAdminPlayerAuthorizationResponse === 'function' && handleAdminPlayerAuthorizationResponse(response, payload, { actionRequest: false })) return false;
    if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Security Centre unavailable.');
    renderSecuritySettings(payload);
    commandCentreSecurityLoaded = true;
    if (!quiet) setSecurityMessage('Security settings refreshed.', 'success');
    return true;
  } catch (error) {
    if (!quiet) setSecurityMessage(error instanceof Error ? error.message : 'Security Centre unavailable.', 'error');
    return false;
  } finally {
    commandCentreSecurityRequestInProgress = false;
    if (refresh) {
      refresh.disabled = false;
      refresh.textContent = original;
    }
  }
};

const securityActionRequest = async (payload, pendingButton) => {
  const sessionToken = storageGet(AUTH_SESSION_KEY);
  if (!sessionToken || commandCentreSecurityRequestInProgress) return false;
  commandCentreSecurityRequestInProgress = true;
  const original = pendingButton?.textContent || '';
  if (pendingButton) {
    pendingButton.disabled = true;
    pendingButton.textContent = 'Working…';
  }
  setSecurityMessage('');
  try {
    const response = await window.WWZHttp.request(`${DASHBOARD_API_BASE}/api/admin/security/action`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (typeof handleAdminPlayerAuthorizationResponse === 'function' && handleAdminPlayerAuthorizationResponse(response, result, { actionRequest: true })) return false;
    if (!response.ok || result.status !== 'ok') throw new Error(result.message || 'Security action failed.');
    setSecurityMessage(result.message || 'Security action completed.', 'success');
    return true;
  } catch (error) {
    setSecurityMessage(error instanceof Error ? error.message : 'Security action failed.', 'error');
    return false;
  } finally {
    commandCentreSecurityRequestInProgress = false;
    if (pendingButton) {
      pendingButton.disabled = false;
      pendingButton.textContent = original;
    }
  }
};

const saveSecurityCentre = async () => {
  const roles = securityField('[data-security-exempt-roles]');
  const payload = {
    action: 'save',
    enabled: Boolean(securityField('[data-security-enabled]')?.checked),
    anti_spam_enabled: Boolean(securityField('[data-security-spam-enabled]')?.checked),
    burst_message_limit: securityNumber('[data-security-burst-limit]', 6),
    burst_window_seconds: securityNumber('[data-security-burst-window]', 8),
    duplicate_message_limit: securityNumber('[data-security-duplicate-limit]', 3),
    duplicate_window_seconds: securityNumber('[data-security-duplicate-window]', 20),
    mention_limit: securityNumber('[data-security-mention-limit]', 6),
    spam_action: securityField('[data-security-spam-action]')?.value || 'delete_timeout',
    timeout_minutes: securityNumber('[data-security-timeout]', 10),
    anti_raid_enabled: Boolean(securityField('[data-security-raid-enabled]')?.checked),
    join_limit: securityNumber('[data-security-join-limit]', 5),
    join_window_seconds: securityNumber('[data-security-join-window]', 60),
    suspicious_account_age_days: securityNumber('[data-security-account-age]', 7),
    raid_action: securityField('[data-security-raid-action]')?.value || 'alert',
    emergency_join_quarantine: Boolean(securityField('[data-security-lockdown]')?.checked),
    alert_channel_key: securityField('[data-security-alert-channel]')?.value || '',
    exempt_role_keys: roles ? Array.from(roles.selectedOptions).map((option) => option.value) : [],
  };
  if (payload.emergency_join_quarantine) {
    const confirmed = window.confirm('Enable Emergency Join Quarantine? Every non-exempt new Discord join will be temporarily timed out until you turn it off.');
    if (!confirmed) return;
  }
  const button = securityField('[data-save-security]');
  if (await securityActionRequest(payload, button)) {
    await loadSecurityCentre(storageGet(AUTH_SESSION_KEY), { quiet: true });
    await loadCommandCentre();
  }
};

securityField('[data-refresh-security]')?.addEventListener('click', () => loadSecurityCentre());
securityField('[data-save-security]')?.addEventListener('click', () => saveSecurityCentre());
securityField('[data-test-security]')?.addEventListener('click', async (event) => {
  if (await securityActionRequest({ action: 'test_alert' }, event.currentTarget)) {
    await loadSecurityCentre(storageGet(AUTH_SESSION_KEY), { quiet: true });
  }
});
securityField('[data-command-centre-security-focus]')?.addEventListener('click', () => {
  securityField('[data-command-centre-security-panel]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

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
  const changeResult = storeM10StateAndChanges(payload, signals);

  renderM10Health(payload, signals);
  renderCommandCentreAttention(signals);
  renderCommandCentreActivity(payload);
  renderM10ChangeHistory();

  if (!changeResult.baselineCreated && changeResult.changes.length) {
    surfaceM10Changes(changeResult.changes);
  }

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
    if (typeof handleAdminPlayerAuthorizationResponse === 'function' && handleAdminPlayerAuthorizationResponse(response, payload, { actionRequest: false })) {
      m10SetMonitorArmed(false);
      scheduleM10BackgroundMonitor();
      return false;
    }
    if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Command Centre unavailable.');
    renderCommandCentre(payload);
    m10SetMonitorArmed(true);
    updateCommandCentreFreshness();
    scheduleM10BackgroundMonitor();
    void refreshM10AdminPushStatus();
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

const stopM10BackgroundMonitor = () => {
  if (commandCentreBackgroundTimer) window.clearInterval(commandCentreBackgroundTimer);
  commandCentreBackgroundTimer = 0;
};

const scheduleM10BackgroundMonitor = () => {
  stopM10BackgroundMonitor();
  if (!commandCentreMonitorArmed || commandCentreViewActive || document.hidden || navigator.onLine === false) return;

  commandCentreBackgroundTimer = window.setInterval(() => {
    if (!document.hidden && !commandCentreViewActive && navigator.onLine !== false) {
      loadCommandCentre();
    }
  }, 60_000);
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
  commandCentreViewActive = active;
  scheduleCommandCentreRefresh(active);
  scheduleM10BackgroundMonitor();
  if (active) {
    ensureM10Panel();
    loadCommandCentre();
    loadSecurityCentre(storageGet(AUTH_SESSION_KEY), { quiet: commandCentreSecurityLoaded });
  }
};

commandCentreRefresh?.addEventListener('click', () => loadCommandCentre());
window.addEventListener('wwz:viewchange', (event) => {
  activateCommandCentreView(event.detail || {});
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    scheduleCommandCentreRefresh(false);
    stopM10BackgroundMonitor();
    return;
  }
  activateCommandCentreView({
    view: document.querySelector('[data-view-panel="staff"].active') ? 'staff' : '',
    section: typeof activeDashboardSection === 'string' ? activeDashboardSection : '',
  });
});

window.addEventListener('online', () => {
  scheduleM10BackgroundMonitor();
  if (commandCentreViewActive) loadCommandCentre();
});
window.addEventListener('offline', () => {
  stopM10BackgroundMonitor();
});
window.addEventListener('wwz:serverchange', () => {
  commandCentreLastPayload = null;
  commandCentreLastSuccessAt = 0;
  commandCentreSecurityLoaded = false;
  m10PushStatusCheckedAt = 0;
  renderM10ChangeHistory();
  void refreshM10AdminPushStatus({ force: true });
  if (commandCentreMonitorArmed && !document.hidden) loadCommandCentre();
  if (commandCentreViewActive && !document.hidden) loadSecurityCentre(storageGet(AUTH_SESSION_KEY), { quiet: true });
});

m10RestoreMonitorArmed();
scheduleM10BackgroundMonitor();

window.__wwzCommandCentreReady = true;
if (document.querySelector('[data-view-panel="staff"].active')) {
  activateCommandCentreView({
    view: 'staff',
    section: typeof activeDashboardSection === 'string' ? activeDashboardSection : '',
  });
}
