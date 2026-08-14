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
      failDashboardBootstrap(error);
    }
  };

  void startDashboard();
})();
