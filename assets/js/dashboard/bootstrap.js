(() => {
  'use strict';

  const discordAuthReady = () => {
    try {
      return typeof discordAuthEnabled !== 'undefined' && Boolean(discordAuthEnabled);
    } catch (_) {
      return false;
    }
  };

  const failDashboardBootstrap = (error, { authFailure = false } = {}) => {
    const authUnavailable = authFailure && !discordAuthReady();
    console.error('WWZ dashboard bootstrap issue.', error);
    try {
      window.WWZServerContext?.showLogin({ unavailable: authUnavailable });
    } catch (_) {
      document.body.classList.remove('dashboard-ready');
      document.body.classList.add('dashboard-gated');
    }
    try {
      showAuthMessage(
        authUnavailable
          ? 'The secure dashboard session could not be restored. No protected action was sent; retry Discord sign-in when the connection is ready.'
          : 'The dashboard interface hit a temporary restore issue. Discord sign-in is still available; retry sign-in or refresh the page.',
        authUnavailable ? 'error' : 'info'
      );
    } catch (_) {
      // The gateway notice still provides a terminal state if account UI helpers failed.
    }
  };

  const startDashboard = async () => {
    try {
      window.WWZServerContext?.showLoading('Verifying your Discord session…');
      await configureDiscordAuth();
    } catch (error) {
      failDashboardBootstrap(error, { authFailure: true });
    }

    try {
      showView(location.hash.slice(1), false);
    } catch (error) {
      // Navigation/UI restore failures must never be reported as Discord outages.
      failDashboardBootstrap(error, { authFailure: false });
    }
  };

  void startDashboard();
})();
