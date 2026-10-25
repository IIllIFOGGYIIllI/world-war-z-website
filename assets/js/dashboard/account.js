// Authentication and signed-in account/economy presentation.

const renderTransactions = (transactions) => {
  const list = document.querySelector('[data-economy-transactions]');
  const empty = document.querySelector('[data-economy-empty]');
  if (!list) return;

  list.replaceChildren();
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  empty?.toggleAttribute('hidden', safeTransactions.length !== 0);

  safeTransactions.forEach((transaction) => {
    const change = Math.trunc(Number(transaction.change) || 0);
    const item = document.createElement('li');
    const symbol = document.createElement('span');
    symbol.className = `activity-symbol ${change >= 0 ? 'green' : 'red'}`;
    symbol.textContent = change >= 0 ? '+' : '−';

    const content = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = String(transaction.details || transaction.command || 'Economy activity');
    const details = document.createElement('small');
    const signedChange = `${change >= 0 ? '+' : '−'}${formatMoney(Math.abs(change))}`;
    details.textContent = `${signedChange} · Balance ${formatMoney(transaction.balance_after)} · ${formatAccountDate(transaction.created_at)}`;
    content.append(title, details);
    item.append(symbol, content);
    list.append(item);
  });
};


const renderBankTransactions = (transactions) => {
  const list = document.querySelector('[data-bank-transactions]');
  const empty = document.querySelector('[data-bank-empty]');
  if (!list) return;

  list.replaceChildren();
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  empty?.toggleAttribute('hidden', safeTransactions.length !== 0);

  safeTransactions.forEach((transaction) => {
    const change = Math.trunc(Number(transaction.change) || 0);
    const item = document.createElement('li');
    const symbol = document.createElement('span');
    symbol.className = `activity-symbol ${change >= 0 ? 'green' : 'red'}`;
    symbol.textContent = change >= 0 ? '+' : '−';

    const content = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = String(transaction.details || transaction.type || 'Bank activity');
    const details = document.createElement('small');
    const signedChange = `${change >= 0 ? '+' : '−'}${formatMoney(Math.abs(change))}`;
    const counterparty = transaction.counterparty_psn_id
      ? ` · ${String(transaction.counterparty_psn_id)}`
      : '';
    details.textContent = `${signedChange} · Bank ${formatMoney(transaction.balance_after)}${counterparty} · ${formatAccountDate(transaction.created_at)}`;
    content.append(title, details);
    item.append(symbol, content);
    list.append(item);
  });
};

const setBankActionState = (busy, message = '', tone = 'info') => {
  document.querySelectorAll('[data-bank-action]').forEach((button) => {
    button.toggleAttribute('disabled', Boolean(busy));
  });
  const messageBox = document.querySelector('[data-bank-message]');
  if (!messageBox) return;
  if (!message) {
    messageBox.setAttribute('hidden', '');
    messageBox.textContent = '';
    delete messageBox.dataset.tone;
    return;
  }
  messageBox.textContent = message;
  messageBox.dataset.tone = tone;
  messageBox.removeAttribute('hidden');
};

const performBankAction = async (action) => {
  const token = storageGet(AUTH_SESSION_KEY);
  if (!token) {
    setBankActionState(false, 'Sign in with Discord before using WWZ Bank controls.', 'error');
    return;
  }

  const input = document.querySelector('[data-bank-amount]');
  const amount = Math.trunc(Number(input?.value) || 0);
  if (amount <= 0) {
    setBankActionState(false, 'Enter a valid whole-dollar amount.', 'error');
    input?.focus();
    return;
  }

  setBankActionState(true, action === 'deposit' ? 'Depositing funds…' : 'Withdrawing funds…', 'info');
  try {
    const response = await authFetch(ACCOUNT_BANK_ACTION_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ action, amount })
    });
    const payload = await response.json().catch(() => ({}));
    // Banking is server-scoped. A denial here must not invalidate the shared
    // PvE/PvP Discord session; /api/auth/me owns global session validity.
    if (response.status === 401 || response.status === 403) {
      setBankActionState(false, payload.message || 'Bank access is unavailable for this selected server. Your Discord sign-in is unchanged.', 'error');
      return;
    }
    if (!response.ok) {
      throw new Error(payload.message || 'The banking transaction could not be completed.');
    }

    if (input) input.value = '';
    await loadAccountSummary(token);
    setBankActionState(false, String(payload.message || 'Bank account updated.'), 'success');
  } catch (error) {
    setBankActionState(false, error.message || 'The banking transaction could not be completed.', 'error');
  }
};

const applyAccountSummary = (payload) => {
  const profile = payload?.profile;
  const economy = payload?.economy;
  if (!profile || !economy) throw new Error('Unexpected account-summary response');

  document.querySelector('[data-profile-guest]')?.setAttribute('hidden', '');
  document.querySelector('[data-economy-guest]')?.setAttribute('hidden', '');

  if (!profile.linked) {
    document.querySelector('[data-profile-unlinked]')?.removeAttribute('hidden');
    document.querySelector('[data-economy-unlinked]')?.removeAttribute('hidden');
    document.querySelector('[data-profile-content]')?.setAttribute('hidden', '');
    document.querySelector('[data-economy-content]')?.setAttribute('hidden', '');
    setText('[data-profile-badge-label]', 'Not linked');
    setText('[data-economy-badge-label]', 'Not linked');
    setText('[data-account-balance]', 'Not linked');
    setText('[data-account-balance-note]', 'Use /account link in Discord');
    setStatusClass(document.querySelector('[data-profile-badge]'), 'offline');
    setStatusClass(document.querySelector('[data-economy-badge]'), 'offline');
    return;
  }

  document.querySelector('[data-profile-unlinked]')?.setAttribute('hidden', '');
  document.querySelector('[data-economy-unlinked]')?.setAttribute('hidden', '');
  document.querySelector('[data-profile-content]')?.removeAttribute('hidden');
  document.querySelector('[data-economy-content]')?.removeAttribute('hidden');

  const pvp = profile.pvp || {};
  const discord = payload.discord || {};
  const discordName = String(discord.display_name || authenticatedUser?.user?.display_name || 'Discord survivor');
  const discordUsername = String(discord.username || authenticatedUser?.user?.username || 'account');
  const discordInitials = discordName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'WZ';
  renderDiscordAvatar('[data-profile-discord-avatar]', discord.avatar_url, discordInitials, `${discordName} Discord avatar`);
  setText('[data-profile-discord-name]', discordName);
  setText('[data-profile-discord-username]', `@${discordUsername}`);
  setText('[data-profile-access-level]', accessLabel(payload.access_level || authenticatedUser?.membership?.access_level || 'member'));
  setText('[data-profile-discord-joined]', formatAccountDate(discord.joined_at));
  setText('[data-profile-psn]', String(profile.psn_id || 'Unknown survivor'));
  setText('[data-profile-status]', profile.online ? 'Online now' : 'Offline');
  setText('[data-profile-linked]', formatAccountDate(profile.linked_at));
  setText('[data-profile-playtime]', formatDuration(profile.playtime_seconds));
  setText('[data-profile-sessions]', new Intl.NumberFormat('en-AU').format(Number(profile.total_sessions) || 0));
  setText('[data-profile-kd]', Number(pvp.kd_ratio || 0).toFixed(2));
  setText('[data-profile-kills]', new Intl.NumberFormat('en-AU').format(Number(pvp.kills) || 0));
  setText('[data-profile-deaths]', new Intl.NumberFormat('en-AU').format(Number(pvp.deaths) || 0));
  setText('[data-profile-event-wins]', new Intl.NumberFormat('en-AU').format(Number(profile.event_wins) || 0));
  setText('[data-profile-flags]', new Intl.NumberFormat('en-AU').format(Number(profile.flags_captured) || 0));
  setText('[data-profile-first-joined]', formatAccountDate(profile.first_join));
  setText('[data-profile-last-seen]', profile.online ? 'Currently online' : formatAccountDate(profile.last_seen));
  setText('[data-profile-faction]', String(profile.faction || 'None'));
  setText('[data-profile-reputation]', new Intl.NumberFormat('en-AU').format(Number(profile.reputation) || 0));
  setText('[data-profile-streak]', new Intl.NumberFormat('en-AU').format(Number(pvp.current_streak) || 0));
  setText('[data-profile-longest]', pvp.longest_kill_metres == null ? 'Not recorded' : `${Number(pvp.longest_kill_metres).toFixed(1)} m`);
  setText('[data-profile-weapon]', String(pvp.favourite_weapon || 'Not recorded'));

  const onlineState = document.querySelector('[data-profile-online-state]');
  onlineState?.classList.toggle('online', Boolean(profile.online));
  setText('[data-profile-badge-label]', profile.online ? 'Verified · Online' : 'Verified survivor');
  setStatusClass(document.querySelector('[data-profile-badge]'), 'online');

  const heat = Math.max(0, Math.min(5, Math.trunc(Number(economy.heat) || 0)));
  const balance = formatMoney(economy.balance);
  setText('[data-economy-balance]', balance);
  setText('[data-economy-jackpot]', formatMoney(economy.community_jackpot));
  setText('[data-economy-heat]', `${'🔥'.repeat(heat)}${'○'.repeat(5 - heat)}`);
  setText('[data-economy-daily]', new Intl.NumberFormat('en-AU').format(Number(economy.daily_streak) || 0));
  setText('[data-economy-earned]', formatMoney(economy.total_earned));
  setText('[data-economy-spent]', formatMoney(economy.total_spent));
  setText('[data-economy-work]', new Intl.NumberFormat('en-AU').format(Number(economy.work_completed) || 0));
  setText('[data-economy-gambling]', `${Number(economy.gambling_wins) || 0} wins · ${Number(economy.gambling_losses) || 0} losses`);
  setText('[data-economy-crime]', `${Number(economy.crime_successes) || 0} successes · ${Number(economy.crime_failures) || 0} failures`);
  setText('[data-economy-protection]', economy.protection_until ? `Until ${formatAccountDate(economy.protection_until)}` : 'Inactive');
  setText('[data-bank-wallet]', formatMoney(economy.wallet_balance ?? economy.balance));
  setText('[data-bank-balance]', formatMoney(economy.bank_balance));
  setText('[data-bank-net-worth]', formatMoney(economy.net_worth ?? ((Number(economy.balance) || 0) + (Number(economy.bank_balance) || 0))));
  setText('[data-bank-deposited]', formatMoney(economy.bank_total_deposited));
  setText('[data-bank-withdrawn]', formatMoney(economy.bank_total_withdrawn));
  setText('[data-bank-transfers]', `In ${formatMoney(economy.bank_total_transferred_in)} · Out ${formatMoney(economy.bank_total_transferred_out)}`);
  setText('[data-bank-minimums]', `Deposit ${formatMoney(economy.bank_minimum_deposit)} · Withdraw ${formatMoney(economy.bank_minimum_withdrawal)} · Transfer ${formatMoney(economy.bank_minimum_transfer)}`);
  setText('[data-economy-badge-label]', 'Live account');
  setStatusClass(document.querySelector('[data-economy-badge]'), 'online');
  setText('[data-account-balance]', balance);
  setText('[data-account-balance-note]', 'Your verified survivor wallet');
  renderTransactions(payload.recent_transactions);
  renderBankTransactions(payload.recent_bank_transactions);
};

const loadAccountSummary = async (sessionToken) => {
  try {
    const response = await authFetch(ACCOUNT_SUMMARY_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${sessionToken}`
      }
    });

    // Account data is server-scoped. Its 401/403 must never revoke a valid
    // GLOBAL Discord session. Only /api/auth/me determines session validity.
    if (response.status === 401 || response.status === 403) {
      showAuthMessage('Discord sign-in is valid, but this server’s account data could not be accessed. Please retry shortly.', 'error');
      setText('[data-profile-badge-label]', 'Server access unavailable');
      setText('[data-economy-badge-label]', 'Server access unavailable');
      return false;
    }

    if (!response.ok) throw new Error('Account information is temporarily unavailable');
    applyAccountSummary(await response.json());
    return true;
  } catch (error) {
    setText('[data-profile-badge-label]', 'Data unavailable');
    setText('[data-economy-badge-label]', 'Data unavailable');
    setStatusClass(document.querySelector('[data-profile-badge]'), 'unavailable');
    setStatusClass(document.querySelector('[data-economy-badge]'), 'unavailable');
    showAuthMessage('You are signed in, but your profile and economy data could not be loaded. Please refresh shortly.', 'error');
    return false;
  }
};

const loadCurrentAccount = async (sessionToken) => {
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await authFetch(AUTH_ME_URL, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${sessionToken}`
        }
      });

      if (response.status === 401) {
        storageRemove(AUTH_SESSION_KEY);
        applySignedOutState({ preserveSelection: true });
        return;
      }
      if (response.status === 403) {
        window.WWZServerContext?.showLogin();
        showAuthMessage('Your Discord sign-in is valid, but this server denied account access. Check membership and server permissions.', 'error');
        return;
      }

      if (response.ok) {
        const payload = await response.json();
        applyAuthenticatedState(payload);
        window.WWZServerContext?.handleAuthenticated(payload, { requireSelection: false });
        showView(location.hash.slice(1), false);
        await loadAccountSummary(sessionToken);
        return;
      }

      lastError = new Error(`Session verification returned HTTP ${response.status}`);
      if (response.status !== 503 || attempt === 2) break;
    } catch (error) {
      lastError = error;
      if (attempt === 2) break;
    }

    await new Promise((resolve) => window.setTimeout(resolve, 450 * (attempt + 1)));
  }

  // A transient session-refresh failure does not mean Discord sign-in itself is
  // unavailable. Keep the saved session token so a refresh can retry it, release
  // the gateway back to the normal sign-in view, and avoid the misleading red
  // "Discord verification unavailable" state.
  applySignedOutState({ preserveSelection: true });
  showAuthMessage(
    'Your saved dashboard session could not be refreshed. Discord sign-in is still available; retry or sign in again.',
    'info'
  );
  if (lastError) console.warn('WWZ dashboard session refresh delayed.', lastError);
};

const IOS_AUTH_PENDING_KEY = 'wwz_ios_oauth_pending';

const prepareIOSAuthRecovery = () => {
  const help = document.querySelector('[data-ios-auth-app-help]');
  if (!help || window.WWZIOSAuth?.isInstalled() !== true) return;
  help.hidden = false;
  if (storageGet(IOS_AUTH_PENDING_KEY) === '1') help.open = true;
};

const displaySafariTransferChoice = () => {
  const panel = document.querySelector('[data-ios-auth-safari-help]');
  if (!panel) return false;
  window.WWZServerContext?.showLogin();
  panel.hidden = false;
  const notice = document.querySelector('[data-gateway-notice]');
  if (notice) notice.textContent = 'Discord authentication succeeded. Choose where to finish signing in.';
  return true;
};

const completeDiscordLogin = async (loginTicket) => {
  if (authRequestInProgress) return;
  authRequestInProgress = true;
  let sessionSaved = false;
  showAuthMessage('Finishing your secure Discord sign-in…', 'info');

  try {
    const response = await authFetch(AUTH_COMPLETE_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ticket: loginTicket })
    });
    const payload = await response.json();

    if (!response.ok || !payload.session_token) {
      throw new Error(payload.message || 'Unable to complete Discord sign-in');
    }

    if (!storageSet(AUTH_SESSION_KEY, payload.session_token)) {
      throw new Error('Browser session storage is unavailable');
    }
    sessionSaved = true;
    storageRemove(IOS_AUTH_PENDING_KEY);
    // The ticket is single-use. Clear it before rendering to avoid accidentally
    // redeeming it again if iOS suspends the app midway through sign-in.
    const returnView = clearCallbackFragment();
    applyAuthenticatedState(payload);
    window.WWZServerContext?.handleAuthenticated(payload, { requireSelection: true });
    showView(returnView, false);
    await loadAccountSummary(payload.session_token);
    showAuthMessage(`Signed in as ${payload.user.display_name || payload.user.username}.`, 'success');
  } catch (error) {
    // Do not throw away a valid, already-issued session because a lazily loaded
    // dashboard panel failed to render after the OAuth exchange committed.
    if (sessionSaved) {
      console.error('WWZ post-login dashboard restore failed.', error);
      try { clearCallbackFragment(); } catch (_) {}
      window.WWZServerContext?.showLogin();
      showAuthMessage(
        'Discord sign-in succeeded, but the dashboard did not finish opening. Refresh this page to restore your signed-in session.',
        'error'
      );
    } else {
      storageRemove(AUTH_SESSION_KEY);
      const returnView = clearCallbackFragment();
      showView(returnView, false);
      applySignedOutState();
      showAuthMessage(error.message || 'Discord sign-in could not be completed.', 'error');
    }
  } finally {
    authRequestInProgress = false;
  }
};

const configureDiscordAuth = async () => {
  try {
    const response = await authFetch(AUTH_CONFIG_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' }
    });
    const payload = await response.json();
    discordAuthEnabled = Boolean(response.ok && payload?.discord_auth?.enabled);
  } catch (error) {
    discordAuthEnabled = false;
  }

  if (discordAuthEnabled) {
    startDiscordLoginButtons.forEach((button) => button.removeAttribute('disabled'));
    startDiscordLoginLabels.forEach((label) => { label.textContent = 'Continue Securely With Discord'; });
    if (authDialogNotice) authDialogNotice.querySelector('span').textContent = 'Your dashboard session lasts for this browser tab and expires automatically.';
    const gatewayNotice = document.querySelector('[data-gateway-notice]');
    if (gatewayNotice) gatewayNotice.textContent = 'Discord securely verifies your World War Z membership and access level.';
  } else {
    startDiscordLoginButtons.forEach((button) => button.setAttribute('disabled', ''));
    startDiscordLoginLabels.forEach((label) => { label.textContent = 'Discord Sign-In Is Being Configured'; });
    if (authDialogNotice) authDialogNotice.querySelector('span').textContent = 'The live server status remains available while Discord sign-in is being configured.';
    const gatewayNotice = document.querySelector('[data-gateway-notice]');
    if (gatewayNotice) {
      gatewayNotice.textContent = 'Discord sign-in is being configured. Please check back shortly.';
      gatewayNotice.dataset.tone = 'error';
    }
  }

  prepareIOSAuthRecovery();
  const fragment = callbackFragment();

  if (fragment.authError) {
    const returnView = clearCallbackFragment();
    showView(returnView, false);
    applySignedOutState();
    showAuthMessage(authErrorMessages[fragment.authError] || 'Discord sign-in could not be completed.', 'error');
    return;
  }

  if (fragment.loginTicket) {
    const ios = window.WWZIOSAuth;
    const locallyStartedInSafari = Boolean(storageGet(AUTH_RETURN_VIEW_KEY));
    if (ios?.shouldOfferSafariHandoff(locallyStartedInSafari) && displaySafariTransferChoice()) {
      return; // Do not consume the one-time ticket in Safari before the app can receive it.
    }
    await completeDiscordLogin(fragment.loginTicket);
    return;
  }

  const sessionToken = storageGet(AUTH_SESSION_KEY);

  if (sessionToken && discordAuthEnabled) {
    await loadCurrentAccount(sessionToken);
  } else {
    applySignedOutState();
  }
};

const isIOSInstalledWebApp = () => window.WWZIOSAuth?.isInstalled() === true;

const startDiscordOAuth = () => {
  if (isIOSInstalledWebApp()) {
    // iOS may move this cross-origin OAuth journey into Safari, which has
    // different storage from the installed web app. Keep an app-side recovery
    // marker and try the normal same-window navigation first.
    storageSet(IOS_AUTH_PENDING_KEY, '1');
    prepareIOSAuthRecovery();
    try {
      if (window.open(AUTH_LOGIN_URL, '_self')) return;
    } catch (_) {}
  }
  // Retain the established redirect path for Safari, Android and desktop.
  window.location.assign(AUTH_LOGIN_URL);
};


document.querySelector('[data-ios-auth-copy-link]')?.addEventListener('click', async () => {
  const status = document.querySelector('[data-ios-auth-copy-status]');
  const ticket = callbackFragment().loginTicket;
  if (!ticket || !/^[a-z0-9_-]{32,256}$/i.test(ticket)) {
    if (status) status.textContent = 'This sign-in link is invalid. Please start Discord sign-in again.';
    return;
  }
  const link = location.href;
  try {
    await navigator.clipboard.writeText(link);
    if (status) status.textContent = 'Copied. Return to the WWZ Companion Home Screen app and paste the link there.';
  } catch (_) {
    const input = document.querySelector('[data-ios-auth-manual-copy]');
    if (input) {
      input.hidden = false;
      input.value = link;
      input.focus();
      input.select();
    }
    if (status) status.textContent = 'Copy was blocked. Select the link above, copy it, then paste in the installed Companion.';
  }
});

document.querySelector('[data-ios-auth-continue-safari]')?.addEventListener('click', () => {
  document.querySelector('[data-ios-auth-safari-help]')?.setAttribute('hidden', '');
  const ticket = callbackFragment().loginTicket;
  if (ticket) void completeDiscordLogin(ticket);
});

document.querySelector('[data-ios-auth-transfer-submit]')?.addEventListener('click', async () => {
  if (authRequestInProgress) return;
  const input = document.querySelector('[data-ios-auth-transfer-input]');
  const status = document.querySelector('[data-ios-auth-transfer-status]');
  const ticket = window.WWZIOSAuth?.parseTransferLink(input?.value || '', location.href);
  if (!ticket) {
    if (status) status.textContent = 'Paste the complete, private WWZ dashboard login link from Safari. Other links cannot be accepted.';
    return;
  }
  if (status) status.textContent = 'Completing Discord sign-in in this app…';
  if (input) input.value = '';
  await completeDiscordLogin(ticket);
});

startDiscordLoginButtons.forEach((button) => {
  button.addEventListener('click', () => {
    if (!discordAuthEnabled || authRequestInProgress) return;
    const activeView = document.querySelector('[data-view-panel].active')?.dataset.viewPanel || 'overview';
    storageSet(AUTH_RETURN_VIEW_KEY, navigationKey(activeView, activeDashboardSection || defaultSectionForView(activeView)));
    startDiscordOAuth();
  });
});

signOutButton?.addEventListener('click', async () => {
  const sessionToken = storageGet(AUTH_SESSION_KEY);
  storageRemove(AUTH_SESSION_KEY);
  applySignedOutState();
  showAuthMessage('You have been signed out of this dashboard tab.', 'success');

  if (!sessionToken) return;

  try {
    await authFetch(AUTH_LOGOUT_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${sessionToken}`
      }
    });
  } catch (error) {
    // Local sign-out is complete even when Railway cannot be reached.
  }
});


document.querySelectorAll('[data-bank-action]').forEach((button) => {
  button.addEventListener('click', () => {
    void performBankAction(String(button.dataset.bankAction || '').trim().toLowerCase());
  });
});

const apiConnection = document.querySelector('[data-api-connection]');
const apiConnectionLabel = document.querySelector('[data-api-connection-label]');
const dashboardMode = document.querySelector('[data-dashboard-mode]');
const liveBanner = document.querySelector('[data-live-banner]');
const liveBannerTitle = document.querySelector('[data-live-banner-title]');
const liveBannerMessage = document.querySelector('[data-live-banner-message]');
const refreshStatusButton = document.querySelector('[data-refresh-status]');
let statusRequestInProgress = false;

const setText = (selector, value) => {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value;
  });
};

const setStatusClass = (element, status) => {
  if (!element) return;
  element.classList.remove(...STATUS_CLASSES);
  element.classList.add(status);
};

const setConnectionState = (state, label) => {
  if (apiConnection) apiConnection.dataset.state = state;
  if (apiConnectionLabel) apiConnectionLabel.textContent = label;
};

const formatUpdatedAt = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';

  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  }).format(date);
};

const applyLiveStatus = (payload) => {
  window.WWZServerContext?.updatePublicStatus(payload);
  if (!STATUS_LABELS[payload?.status] || !payload.server || !payload.players) {
    throw new Error('Unexpected server-status response');
  }

  const status = payload.status;
  currentServerStatus = status;
  const statusLabel = STATUS_LABELS[status];
  const currentPlayers = Math.max(0, Math.trunc(Number(payload.players.current) || 0));
  const maximumPlayers = Math.max(1, Math.trunc(Number(payload.players.maximum) || Number(payload.server?.player_capacity) || 26));
  const serverName = String(payload.server.name || 'World War Z');
  const serverMap = String(payload.server.map || window.WWZServerContext?.getSelectedServer?.()?.map_name || 'Nasdara');
  const platform = String(payload.server.platform || 'PlayStation 4 & 5');
  const updatedAt = formatUpdatedAt(payload.updated_at);
  const operations = window.WWZHttp?.normaliseRestartOperations?.(payload.operations || {}) || (payload.operations || {});
  window.WWZShopRestartOperations = operations;
  window.dispatchEvent(new CustomEvent('wwz:restartstatus', { detail: operations }));
  const operationUpdatedAt = formatUpdatedAt(operations.last_successful_update || payload.updated_at);
  const discordHealthy = Boolean(operations.discord_connected && operations.discord_ready);
  const nitradoState = titleCaseState(operations.nitrado_state || 'unknown');
  const restartConfigured = Boolean(operations.restart_schedule_configured);
  const restartSynchronised = Boolean(operations.restart_schedule_synchronised);
  const restartIntervalMinutes = Math.max(0, Math.trunc(Number(operations.restart_interval_minutes) || 0));
  const nextRestart = operations.next_scheduled_restart
    ? formatUpdatedAt(operations.next_scheduled_restart)
    : restartConfigured
      ? 'Waiting for restart sync'
      : 'No automatic restart configured';
  const restartCountdown = restartSynchronised && operations.restart_countdown_seconds != null
    ? formatDuration(operations.restart_countdown_seconds)
    : restartConfigured
      ? 'Syncs on the next observed DayZ restart'
      : 'Unavailable';
  const restartInterval = restartIntervalMinutes > 0
    ? `Every ${formatDuration(restartIntervalMinutes * 60)}`
    : 'Not configured';
  const restartSource = String(operations.restart_source || 'unavailable');
  const restartWarning = String(operations.restart_warning_text || '').trim() || 'No restart warning text available';

  setConnectionState('online', 'Bot API connected');
  if (dashboardMode) dashboardMode.textContent = 'Live status';
  liveBanner?.classList.remove('degraded');
  liveBanner?.classList.add('live');
  if (liveBannerTitle) liveBannerTitle.textContent = 'Live public server status connected.';
  if (liveBannerMessage) {
    liveBannerMessage.textContent = 'Status, population, capacity, map and platform are supplied by the bot. Signed-in members can also load their own profile and economy data.';
  }

  setText('[data-server-status]', statusLabel);
  setText('[data-server-status-note]', `Live status · updated ${updatedAt}`);
  setText('[data-status-label]', `${statusLabel} · Live`);
  setText('[data-server-name]', serverName);
  setText('[data-server-platform]', platform);
  setText('[data-server-map]', serverMap);
  setText('[data-server-capacity]', `${maximumPlayers} survivors`);
  setText('[data-live-updated-short]', updatedAt);
  setText('[data-live-updated]', updatedAt);
  setText('[data-detail-status]', statusLabel);
  setText('[data-detail-players]', `${currentPlayers} / ${maximumPlayers}`);
  setText('[data-detail-platform]', platform);
  setText('[data-detail-map]', serverMap);
  setText('[data-information-source]', 'Railway dashboard API · live');
  setText('[data-operations-uptime]', formatDuration(operations.api_uptime_seconds));
  setText('[data-operations-discord]', discordHealthy ? 'Connected and ready' : 'Connection degraded');
  setText('[data-operations-nitrado]', nitradoState);
  setText('[data-operations-updated]', operationUpdatedAt);
  setText('[data-operations-next-restart]', nextRestart);
  setText('[data-operations-restart-countdown]', restartCountdown);
  setText('[data-operations-restart-interval]', restartInterval);
  setText('[data-operations-restart-source]', restartSource);
  setText('[data-operations-restart-warning]', restartWarning);

  const overviewRestartValue = restartSynchronised
    ? restartCountdown
    : restartConfigured
      ? 'Sync pending'
      : 'Unavailable';
  const overviewRestartNote = restartSynchronised
    ? `Configured schedule · ${restartInterval}`
    : restartConfigured
      ? restartInterval
      : 'No automatic restart configured';
  setText('[data-overview-restart-countdown]', overviewRestartValue);
  setText('[data-overview-restart-note]', overviewRestartNote);
  setText('[data-overview-activity-server]', `${statusLabel} · ${currentPlayers} / ${maximumPlayers} survivors`);
  setText('[data-overview-activity-server-note]', `Nitrado ${nitradoState} · updated ${updatedAt}`);
  setText('[data-overview-activity-restart]', restartSynchronised ? `Next restart in ${restartCountdown}` : nextRestart);
  setText('[data-overview-activity-restart-note]', `${restartInterval} · source ${restartSource}`);
  setText('[data-overview-activity-health]', discordHealthy ? 'Discord gateway ready · Railway API online' : 'Connected-service health degraded');
  setText('[data-overview-activity-health-note]', `API uptime ${formatDuration(operations.api_uptime_seconds)} · last success ${operationUpdatedAt}`);

  const restartCycleSeconds = restartIntervalMinutes * 60;
  const restartRemainingSeconds = Math.max(0, Number(operations.restart_countdown_seconds) || 0);
  const restartProgress = restartSynchronised && restartCycleSeconds > 0
    ? Math.max(0, Math.min(100, ((restartCycleSeconds - restartRemainingSeconds) / restartCycleSeconds) * 100))
    : 0;
  document.querySelectorAll('[data-restart-progress]').forEach((element) => {
    element.style.setProperty('--progress', `${restartProgress.toFixed(1)}%`);
  });

  setText('[data-map-name]', serverMap.toUpperCase());
  setText('[data-map-server-name]', serverName);
  setText('[data-map-platform]', platform);

  document.querySelectorAll('[data-player-count]').forEach((element) => {
    element.replaceChildren(document.createTextNode(`${currentPlayers} `));
    const maximum = document.createElement('em');
    maximum.textContent = `/ ${maximumPlayers}`;
    element.append(maximum);
  });

  document.querySelectorAll('[data-server-status-badge], [data-live-status-class]').forEach((element) => {
    setStatusClass(element, status);
  });
  document.querySelectorAll('[data-detail-status]').forEach((element) => {
    element.classList.remove('online-text', 'restarting-text', 'offline-text', 'unavailable-text');
    element.classList.add(`${status}-text`);
  });
  syncServerActionControls();
};

const showStatusUnavailable = () => {
  currentServerStatus = 'unavailable';
  window.WWZShopRestartOperations = null;
  window.dispatchEvent(new CustomEvent('wwz:restartstatus', { detail: null }));
  setConnectionState('unavailable', 'Bot API unavailable');
  if (dashboardMode) dashboardMode.textContent = 'Status unavailable';
  liveBanner?.classList.remove('live');
  liveBanner?.classList.add('degraded');
  if (liveBannerTitle) liveBannerTitle.textContent = 'Live status is temporarily unavailable.';
  if (liveBannerMessage) {
    liveBannerMessage.textContent = 'The website could not reach the public bot API. Try the refresh button shortly; no protected account or server controls are affected.';
  }

  setText('[data-server-status]', 'Unavailable');
  setText('[data-server-status-note]', 'Unable to reach the Railway API');
  setText('[data-status-label]', 'Status unavailable');
  setText('[data-live-updated-short]', 'Unavailable');
  setText('[data-live-updated]', 'Unable to refresh');
  setText('[data-detail-status]', 'Unavailable');
  setText('[data-information-source]', 'Railway API · connection unavailable');
  setText('[data-operations-uptime]', 'Unavailable');
  setText('[data-operations-discord]', 'Unavailable');
  setText('[data-operations-nitrado]', 'Unavailable');
  setText('[data-operations-updated]', 'Unable to refresh');
  setText('[data-operations-next-restart]', 'Unavailable');
  setText('[data-operations-restart-countdown]', 'Unavailable');
  setText('[data-operations-restart-interval]', 'Unavailable');
  setText('[data-operations-restart-source]', 'Unavailable');
  setText('[data-operations-restart-warning]', 'Unavailable');
  setText('[data-overview-restart-countdown]', 'Unavailable');
  setText('[data-overview-restart-note]', 'Unable to reach the Railway API');
  setText('[data-overview-activity-server]', 'DayZ server status unavailable');
  setText('[data-overview-activity-server-note]', 'Railway could not refresh the public server state');
  setText('[data-overview-activity-restart]', 'Restart intelligence unavailable');
  setText('[data-overview-activity-restart-note]', 'Retry after the Railway API connection recovers');
  setText('[data-overview-activity-health]', 'Connected-service health unavailable');
  setText('[data-overview-activity-health-note]', 'Discord, Nitrado and API state could not be refreshed');
  document.querySelectorAll('[data-restart-progress]').forEach((element) => {
    element.style.setProperty('--progress', '0%');
  });
  document.querySelectorAll('[data-server-status-badge], [data-live-status-class]').forEach((element) => {
    setStatusClass(element, 'unavailable');
  });
  document.querySelectorAll('[data-detail-status]').forEach((element) => {
    element.classList.remove('online-text', 'restarting-text', 'offline-text', 'unavailable-text');
    element.classList.add('unavailable-text');
  });
  syncServerActionControls();
};

// Stage 5: the website API check is distinct from DayZ ADM ingestion.
let liveStatusRequestEpoch = 0;
let liveStatusPollTimer = 0;
let liveStatusCountdownTimer = 0;
let liveStatusNextCheckAt = 0;
const liveStatusServerKey = () => String(window.WWZServerContext?.getSelectedServer?.()?.key || '');
const statusResponseIsCurrent = (epoch, key) =>
  epoch === liveStatusRequestEpoch && key === liveStatusServerKey();
const showNextLiveCheck = () => {
  const message = document.hidden
    ? 'Website status checks pause while this app is in the background.'
    : navigator.onLine === false
      ? 'Offline — website status checks resume when connected.'
      : !liveStatusServerKey()
        ? 'Select a server to start website status checks.'
        : liveStatusNextCheckAt
          ? `Next website status check in ${Math.max(0, Math.ceil((liveStatusNextCheckAt - Date.now()) / 1000))}s · DayZ data may update separately.`
          : 'Connecting to your selected server…';
  setText('[data-status-next-check]', message);
};
const refreshLiveStatus = async () => {
  if (statusRequestInProgress || navigator.onLine === false) return;
  const epoch = ++liveStatusRequestEpoch;
  const serverKey = liveStatusServerKey();
  statusRequestInProgress = true;
  refreshStatusButton?.classList.add('is-loading');
  refreshStatusButton?.setAttribute('aria-busy', 'true');
  try {
    const response = await window.WWZHttp.request(SERVER_STATUS_URL, {
      method: 'GET', headers: { Accept: 'application/json' }
    }, 8_000);
    if (!response.ok) throw new Error(`Status request failed: ${response.status}`);
    const payload = await response.json();
    if (!statusResponseIsCurrent(epoch, serverKey)) return;
    applyLiveStatus(payload);
  } catch (error) {
    if (statusResponseIsCurrent(epoch, serverKey)) showStatusUnavailable();
  } finally {
    if (epoch === liveStatusRequestEpoch) {
      statusRequestInProgress = false;
      refreshStatusButton?.classList.remove('is-loading');
      refreshStatusButton?.removeAttribute('aria-busy');
    }
  }
};
const scheduleLiveStatusPolling = () => {
  if (liveStatusPollTimer) window.clearInterval(liveStatusPollTimer);
  if (liveStatusCountdownTimer) window.clearInterval(liveStatusCountdownTimer);
  liveStatusPollTimer = 0;
  liveStatusCountdownTimer = 0;
  liveStatusNextCheckAt = 0;
  if (document.hidden || navigator.onLine === false || !liveStatusServerKey()) {
    showNextLiveCheck();
    return;
  }
  liveStatusNextCheckAt = Date.now() + LIVE_STATUS_REFRESH_MS;
  showNextLiveCheck();
  liveStatusPollTimer = window.setInterval(() => {
    if (document.hidden) return;
    if (navigator.onLine === false) return;
    liveStatusNextCheckAt = Date.now() + LIVE_STATUS_REFRESH_MS;
    showNextLiveCheck();
    void refreshLiveStatus();
  }, LIVE_STATUS_REFRESH_MS);
  liveStatusCountdownTimer = window.setInterval(showNextLiveCheck, 5_000);
};
refreshStatusButton?.addEventListener('click', () => { void refreshLiveStatus(); });
document.addEventListener('visibilitychange', () => {
  scheduleLiveStatusPolling();
  if (!document.hidden) void refreshLiveStatus();
});
window.addEventListener('wwz:serverchange', () => {
  liveStatusRequestEpoch += 1;
  statusRequestInProgress = false;
  refreshStatusButton?.classList.remove('is-loading');
  refreshStatusButton?.removeAttribute('aria-busy');
  scheduleLiveStatusPolling();
  if (!document.hidden) void refreshLiveStatus();
});
window.addEventListener('online', () => {
  scheduleLiveStatusPolling();
  if (!document.hidden) void refreshLiveStatus();
});
window.addEventListener('offline', () => {
  scheduleLiveStatusPolling();
  showStatusUnavailable();
});
scheduleLiveStatusPolling();
if (!document.hidden) void refreshLiveStatus();


// Admin identity-sync controls. Settings are always scoped by the selected WWZ server.
(() => {
  const panel = document.querySelector('[data-dashboard-section="identity-sync"]');
  if (!panel) return;

  const roleSelect = panel.querySelector('[data-identity-verified-role]');
  const nicknameToggle = panel.querySelector('[data-identity-nickname-sync]');
  const roleNote = panel.querySelector('[data-identity-role-note]');
  const serverName = panel.querySelector('[data-identity-server-name]');
  const verifiedCount = panel.querySelector('[data-identity-verified-count]');
  const memberCount = panel.querySelector('[data-identity-member-count]');
  const activeRole = panel.querySelector('[data-identity-active-role]');
  const refreshButton = panel.querySelector('[data-refresh-identity-settings]');
  const saveButton = panel.querySelector('[data-save-identity-settings]');
  const resyncCurrentButton = panel.querySelector('[data-resync-identity-current]');
  const resyncAllButton = panel.querySelector('[data-resync-identity-all]');
  const message = panel.querySelector('[data-identity-message]');
  const resultWrap = panel.querySelector('[data-identity-results-wrap]');
  const resultBody = panel.querySelector('[data-identity-results]');
  let loaded = false;
  let busy = false;
  let requestEpoch = 0;
  const selectedServerKey = () => String(window.WWZServerContext?.getSelectedServer?.()?.key || '');
  const authorized = () => Boolean(storageGet(AUTH_SESSION_KEY) && selectedServerKey() && hasAdminAccess());
  const current = (epoch, key) => requestEpoch === epoch && selectedServerKey() === key && authorized();

  const token = () => storageGet(AUTH_SESSION_KEY);
  const setMessage = (text = '', tone = 'info') => {
    if (!message) return;
    message.textContent = text;
    message.dataset.tone = tone;
    message.hidden = !text;
  };

  const setBusy = (value) => {
    busy = Boolean(value);
    const locked = busy || !loaded || !authorized();
    [saveButton, resyncCurrentButton, resyncAllButton].forEach(button => {
      if (button) button.disabled = locked;
    });
    if (roleSelect) roleSelect.disabled = locked;
    if (nicknameToggle) nicknameToggle.disabled = locked;
    if (refreshButton) refreshButton.disabled = busy || !authorized();
  };

  const resetPanel = () => {
    requestEpoch += 1;
    loaded = false;
    busy = false;
    fillRoles([], { auto_detect_role: true });
    if (nicknameToggle) nicknameToggle.checked = false;
    if (serverName) serverName.textContent =
      String(window.WWZServerContext?.getSelectedServer?.()?.name || 'Select a server');
    if (verifiedCount) verifiedCount.textContent = '—';
    if (memberCount) memberCount.textContent = '—';
    if (activeRole) activeRole.textContent = 'Not verified';
    if (roleNote) roleNote.textContent = 'Load the selected server settings before editing.';
    if (resultBody) resultBody.replaceChildren();
    if (resultWrap) resultWrap.hidden = true;
    setBusy(false);
  };

  const fillRoles = (roles, settings) => {
    if (!roleSelect) return;
    roleSelect.replaceChildren();
    const automatic = document.createElement('option');
    automatic.value = '';
    automatic.textContent = 'Automatic: Verified / legacy Linked';
    roleSelect.append(automatic);
    (Array.isArray(roles) ? roles : []).forEach((role) => {
      const option = document.createElement('option');
      option.value = String(role.key || '');
      option.textContent = String(role.name || 'Discord role');
      roleSelect.append(option);
    });
    roleSelect.value = settings?.auto_detect_role ? '' : String(settings?.verified_role_key || '');
  };

  const apply = (payload) => {
    if (payload?.status !== 'ok' || String(payload?.server?.key || '') !== selectedServerKey()) {
      throw new Error('Identity settings did not match the selected server.');
    }
    const settings = payload?.settings || {};
    fillRoles(payload?.roles, settings);
    if (nicknameToggle) nicknameToggle.checked = Boolean(settings.nickname_sync_enabled);
    if (serverName) serverName.textContent = String(payload?.server?.name || 'Selected server');
    if (verifiedCount) verifiedCount.textContent = new Intl.NumberFormat('en-AU').format(Number(payload?.linked?.verified_records) || 0);
    if (memberCount) memberCount.textContent = new Intl.NumberFormat('en-AU').format(Number(payload?.linked?.members_in_discord) || 0);
    if (activeRole) activeRole.textContent = settings.verified_role_name || 'Not found';
    if (roleNote) {
      roleNote.textContent = settings.auto_detect_role
        ? `Automatic detection is active${settings.verified_role_name ? ` · currently ${settings.verified_role_name}` : ' · create/choose a safe Verified role'}`
        : `Explicit role${settings.verified_role_name ? ` · ${settings.verified_role_name}` : ' is unavailable'}`;
    }
    loaded = true;
    setBusy(false);
  };

  const request = async (url, options = {}) => {
    const sessionToken = token();
    if (!sessionToken) throw new Error('Sign in with Discord to continue.');
    const response = await authFetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${sessionToken}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
      }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Identity Sync access unavailable for this server.');
    return payload;
  };

  const load = async ({ quiet = false } = {}) => {
    resetPanel();
    if (!authorized()) return;
    const epoch = requestEpoch, serverKey = selectedServerKey();
    setBusy(true);
    if (!quiet) setMessage('Loading selected-server identity settings…', 'info');
    try {
      const payload = await request(ADMIN_IDENTITY_URL, { method: 'GET' });
      if (!current(epoch, serverKey)) return;
      apply(payload);
      if (!quiet) setMessage('Identity settings loaded for ' + String(payload.server?.name || 'selected server') + '.', 'success');
    } catch (error) {
      if (!current(epoch, serverKey)) return;
      loaded = false;
      setMessage(error.message || 'Selected-server identity settings are unavailable.', 'error');
    } finally {
      if (current(epoch, serverKey)) setBusy(false);
    }
  };

  const save = async () => {
    if (!loaded || busy || !authorized()) return;
    const epoch = requestEpoch, serverKey = selectedServerKey();
    setBusy(true);
    setMessage('Saving identity settings for this server…', 'info');
    try {
      const payload = await request(ADMIN_IDENTITY_ACTION_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'save_settings',
          verified_role_key: String(roleSelect?.value || ''),
          auto_detect_role: !String(roleSelect?.value || ''),
          nickname_sync_enabled: Boolean(nicknameToggle?.checked)
        })
      });
      if (!current(epoch, serverKey)) return;
      if (String(payload.server?.key || '') !== serverKey) throw new Error('Server mismatch in identity save response.');
      setMessage(payload.message || 'Identity settings saved.', 'success');
      await load({ quiet: true });
    } catch (error) {
      if (!current(epoch, serverKey)) return;
      setMessage(error.message || 'Identity settings could not be saved.', 'error');
    } finally {
      if (current(epoch, serverKey)) setBusy(false);
    }
  };

  const renderResults = (results) => {
    if (!resultBody || !resultWrap) return;
    resultBody.replaceChildren();
    (Array.isArray(results) ? results : []).forEach((result) => {
      const row = document.createElement('tr');
      const values = [
        String(result.server_name || result.map || 'Server') + (result.guild_available === false ? ' · unavailable' : ''),
        result.guild_available === false ? 'Unavailable' : `${Number(result.members_found) || 0} / ${Number(result.total_links) || 0}`,
        result.guild_available === false ? 'Not run' : `${Number(result.role_synced) || 0} synced${Number(result.role_failed) ? ` · ${Number(result.role_failed)} failed` : ''}`,
        result.guild_available === false ? 'Not run' : result.nickname_enabled
          ? `${Number(result.nickname_synced) || 0} synced${Number(result.nickname_failed) ? ` · ${Number(result.nickname_failed)} failed` : ''}`
          : `${Number(result.nickname_skipped) || 0} skipped · disabled`,
        result.guild_available === false ? 'Unavailable' : String(Number(result.members_missing) || 0)
      ];
      values.forEach((value) => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      });
      resultBody.append(row);
    });
    resultWrap.hidden = !resultBody.children.length;
  };

  const resync = async (allServers) => {
    if (!loaded || busy || !authorized()) return;
    const epoch = requestEpoch, serverKey = selectedServerKey();
    const scopeLabel = allServers ? 'both configured World War Z servers' :
      String(window.WWZServerContext?.getSelectedServer?.()?.name || 'the selected server');
    if (!window.confirm('Resync Verified roles and PSN nicknames for every linked Discord member on ' + scopeLabel + '?')) return;
    setBusy(true);
    setMessage('Resynchronising linked members on ' + scopeLabel + '…', 'info');
    try {
      const payload = await request(ADMIN_IDENTITY_ACTION_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'resync_all', all_servers: Boolean(allServers), confirmation: 'RESYNC' })
      });
      if (!current(epoch, serverKey)) return;
      renderResults(payload.results);
      const summaries = Array.isArray(payload.results) ? payload.results : [];
      const found = summaries.reduce((total, result) => total + (Number(result.members_found) || 0), 0);
      const failures = summaries.reduce((total, result) =>
        total + (Number(result.role_failed) || 0) + (Number(result.nickname_failed) || 0), 0);
      const unavailable = summaries.filter(result => result.guild_available === false).length;
      const needsAttention = Boolean(payload.needs_attention || unavailable || failures ||
        summaries.some(result => result.needs_attention));
      const suffix = needsAttention
        ? ` ${found} members checked; ${failures} role/nickname failures${unavailable ? ` · ${unavailable} Discord server(s) unavailable` : ''}. Review the results below.`
        : ` ${found} Discord members processed.`;
      setMessage(String(payload.message || 'Identity resync completed.') + suffix, needsAttention ? 'error' : 'success');
    } catch (error) {
      if (!current(epoch, serverKey)) return;
      setMessage(error.message || 'Linked-member resync could not be completed.', 'error');
    } finally {
      if (current(epoch, serverKey)) setBusy(false);
    }
  };

  refreshButton?.addEventListener('click', () => load());
  saveButton?.addEventListener('click', save);
  resyncCurrentButton?.addEventListener('click', () => resync(false));
  resyncAllButton?.addEventListener('click', () => resync(true));
  window.addEventListener('wwz:serverchange', () => {
    resetPanel();
    setMessage('');
    if (authorized() && panel.classList.contains('active')) void load({ quiet: true });
  });
  window.addEventListener('wwz:authchange', () => {
    resetPanel();
    if (authorized() && panel.classList.contains('active')) void load({ quiet: true });
  });
  window.addEventListener('wwz:accesschange', () => {
    if (!authorized()) {
      resetPanel();
      setMessage('Identity Sync requires Admin access on this server.', 'info');
    }
  });
  window.addEventListener('wwz:viewchange', (event) => {
    if (event.detail?.view === 'staff' && event.detail?.section === 'identity-sync' && !loaded && !busy) load();
  });
  resetPanel();
})();
