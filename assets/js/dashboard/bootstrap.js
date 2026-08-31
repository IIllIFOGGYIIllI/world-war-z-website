(() => {
  'use strict';

  const failDashboardBootstrap = (error) => {
    console.error('WWZ dashboard authentication bootstrap failed.', error);
    try {
      window.WWZServerContext?.showLogin({ unavailable: true });
    } catch (_) {
      document.body.classList.remove('dashboard-ready');
      document.body.classList.add('dashboard-gated');
    }
    try {
      showAuthMessage(
        'The secure dashboard session could not be restored. No protected action was sent; retry Discord sign-in when the connection is ready.',
        'error'
      );
    } catch (_) {
      // The gateway notice still provides a terminal state if account UI helpers failed.
    }
  };

  const failDashboardNavigationRestore = (error) => {
    console.error('WWZ dashboard navigation restore failed.', error);
    try {
      // Authentication has already completed/configured at this point, so a
      // navigation/UI restore problem must not be presented as a Discord outage.
      window.WWZServerContext?.showLogin();
    } catch (_) {
      document.body.classList.remove('dashboard-ready');
      document.body.classList.add('dashboard-gated');
    }
    try {
      showAuthMessage(
        'The dashboard interface hit a temporary restore issue. Discord sign-in is still available; retry sign-in or refresh the page.',
        'info'
      );
    } catch (_) {
      // The normal gateway login state still provides a safe terminal state.
    }
  };

  const startDashboard = async () => {
    try {
      window.WWZServerContext?.showLoading('Verifying your Discord session…');
      await configureDiscordAuth();
    } catch (error) {
      failDashboardBootstrap(error);
    }

    try {
      showView(location.hash.slice(1), false);
    } catch (error) {
      failDashboardNavigationRestore(error);
    }
  };

  void startDashboard();
})();
