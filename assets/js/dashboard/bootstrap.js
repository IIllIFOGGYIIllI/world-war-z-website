(() => {
  'use strict';

  /*
   * account.js intentionally keeps the Appeals controller lazy, but its signed-out
   * reset path still calls resetAppealPanels(). On a fresh signed-out load the
   * appeals bundle has not been loaded yet, which previously threw a ReferenceError
   * after Discord auth had already been confirmed. bootstrap.js then interpreted
   * that unrelated UI reset exception as an authentication outage.
   *
   * Provide a temporary configurable no-op only until appeals.js is lazy-loaded.
   * appeals.js later declares its real global lexical resetAppealPanels binding,
   * which takes precedence for subsequent signed-out resets.
   */
  const ensureLazyAuthResetFallbacks = () => {
    if (typeof resetAppealPanels !== 'function') {
      Object.defineProperty(window, 'resetAppealPanels', {
        value: () => {},
        configurable: true,
        writable: true
      });
    }
  };

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

  const loadMyWwzExperience = () => {
    if (!document.querySelector('link[data-wwz-my-wwz-style]')) {
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = 'assets/css/dashboard/my-wwz.css?v=1.28.0&rev=my-wwz-m09-polish-1';
      style.dataset.wwzMyWwzStyle = '';
      document.head.append(style);
    }

    if (window.__wwzMyWwzReady) {
      window.WWZMyWwz?.activate?.();
      return;
    }
    if (document.querySelector('script[data-wwz-my-wwz-script]')) return;

    const script = document.createElement('script');
    script.src = 'assets/js/dashboard/my-wwz.js?v=1.28.0&rev=my-wwz-m09-polish-1';
    script.async = true;
    script.dataset.wwzMyWwzScript = '';
    script.addEventListener('load', () => window.WWZMyWwz?.activate?.(), { once: true });
    script.addEventListener('error', () => {
      console.warn('WWZ My WWZ overview could not be loaded.');
    }, { once: true });
    document.head.append(script);
  };

  const startDashboard = async () => {
    ensureLazyAuthResetFallbacks();

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

    loadMyWwzExperience();
  };

  void startDashboard();
})();
