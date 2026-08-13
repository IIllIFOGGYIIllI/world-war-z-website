(() => {
  'use strict';

  const pendingScripts = new Map();
  let dashboardRuntimeReady = document.readyState === 'complete';
  const dashboardRuntimeReadyPromise = dashboardRuntimeReady
    ? Promise.resolve()
    : new Promise((resolve) => {
        document.addEventListener('DOMContentLoaded', () => {
          dashboardRuntimeReady = true;
          resolve();
        }, { once: true });
      });

  const loadAfterDashboardRuntime = (load) => (
    dashboardRuntimeReady ? load() : dashboardRuntimeReadyPromise.then(load)
  );

  const loadScriptOnce = (key, src, ready) => {
    if (ready?.()) return Promise.resolve();
    if (pendingScripts.has(key)) return pendingScripts.get(key);

    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.dataset.wwzLazyAsset = key;
      script.addEventListener('load', () => {
        if (ready && !ready()) {
          reject(new Error(`${key} loaded without becoming ready.`));
          return;
        }
        resolve();
      }, { once: true });
      script.addEventListener('error', () => {
        reject(new Error(`${key} could not be loaded.`));
      }, { once: true });
      document.head.append(script);
    }).catch((error) => {
      pendingScripts.delete(key);
      throw error;
    });

    pendingScripts.set(key, promise);
    return promise;
  };

  const ensureCommandLibrary = () => loadScriptOnce(
    'command-library',
    'assets/js/data/command-library.js?v=1.22.78',
    () => window.__wwzCommandLibraryReady === true
  );

  const ensureDashboardMap = () => loadAfterDashboardRuntime(() => loadScriptOnce(
    'dashboard-map',
    'assets/js/pages/dashboard-map-loader.js?v=1.22.78&rev=3',
    () => Boolean(window.WWZDashboardMap?.initialise)
  ));

  const ensureConfigurationStudio = () => loadAfterDashboardRuntime(() => loadScriptOnce(
    'configuration-studio',
    'assets/js/dashboard/configuration-studio.js?v=1.22.78',
    () => window.__wwzConfigurationStudioReady === true
  ));

  const ensureShopWikiPreviews = () => loadScriptOnce(
    'shop-wiki-previews',
    'assets/js/shop-wiki-previews.js?v=1.22.78',
    () => Boolean(window.WWZShopWikiPreviews?.createImage)
  );

  const ensureAdministration = () => loadAfterDashboardRuntime(() => loadScriptOnce(
    'administration',
    'assets/js/dashboard/administration.js?v=1.22.78',
    () => window.__wwzAdministrationReady === true
  ));

  const ensureTickets = () => loadAfterDashboardRuntime(() => loadScriptOnce(
    'tickets',
    'assets/js/dashboard/tickets.js?v=1.22.78',
    () => window.__wwzTicketsReady === true
  ));

  const ensureProgression = () => loadAfterDashboardRuntime(() => loadScriptOnce(
    'progression',
    'assets/js/dashboard/progression.js?v=1.22.78&rev=3',
    () => window.__wwzProgressionReady === true
  ));

  const ensureObjectives = () => loadAfterDashboardRuntime(() => loadScriptOnce(
    'objectives',
    'assets/js/dashboard/objectives.js?v=1.22.78',
    () => window.__wwzObjectivesReady === true
  ));

  const ensureFactions = () => loadAfterDashboardRuntime(() => loadScriptOnce(
    'factions',
    'assets/js/dashboard/factions.js?v=1.22.78&rev=2',
    () => window.__wwzFactionsReady === true
  ));

  const ensureCommandCentre = () => loadAfterDashboardRuntime(() => loadScriptOnce(
    'command-centre',
    'assets/js/dashboard/command-centre.js?v=1.22.78',
    () => window.__wwzCommandCentreReady === true
  ));

  const requestedLocation = () => {
    const raw = String(location.hash || '').replace(/^#/, '');
    const [view = '', section = ''] = raw.split('/', 2);
    return { view, section };
  };

  const administrationView = ({ view = '', section = '' } = {}) => (
    (view === 'staff' && ['queue', 'cases', 'banlists', 'players', 'server-controls', 'server-audit', 'failures'].includes(section))
    || (view === 'configuration' && ['discord-logs', 'notifications'].includes(section))
  );

  const loadViewAssets = ({ view = '', section = '' } = {}) => {
    if (view === 'commands') ensureCommandLibrary().catch(() => {});
    if (view === 'map') ensureDashboardMap().catch(() => {});
    if (view === 'serverconfig' && section === 'structured') ensureConfigurationStudio().catch(() => {});
    if (view === 'shop' || view === 'shopadmin') ensureShopWikiPreviews().catch(() => {});
    if (administrationView({ view, section })) ensureAdministration().catch(() => {});
    if (view === 'tickets') ensureTickets().catch(() => {});
    if (view === 'progression' || view === 'players') ensureProgression().catch(() => {});
    if (view === 'objectives') ensureObjectives().catch(() => {});
    if (view === 'factions') ensureFactions().catch(() => {});
    if (view === 'staff' && section === 'command-centre') ensureCommandCentre().catch(() => {});
  };

  window.addEventListener('wwz:viewchange', (event) => {
    loadViewAssets(event.detail || {});
  });

  const preloads = [
    ['commands', ensureCommandLibrary],
    ['map', ensureDashboardMap],
    ['shop', ensureShopWikiPreviews],
    ['shopadmin', ensureShopWikiPreviews],
    ['tickets', ensureTickets],
    ['progression', ensureProgression],
    ['players', ensureProgression],
    ['objectives', ensureObjectives],
    ['factions', ensureFactions],
  ];
  preloads.forEach(([view, load]) => {
    document.querySelectorAll(`[data-view="${view}"]`).forEach((button) => {
      button.addEventListener('pointerenter', () => load().catch(() => {}), { passive: true });
      button.addEventListener('focus', () => load().catch(() => {}));
    });
  });

  document.querySelectorAll('[data-view="serverconfig"][data-section="structured"]').forEach((button) => {
    button.addEventListener('pointerenter', () => ensureConfigurationStudio().catch(() => {}), { passive: true });
    button.addEventListener('focus', () => ensureConfigurationStudio().catch(() => {}));
  });

  document.querySelectorAll('[data-view="staff"], [data-view="configuration"]').forEach((button) => {
    const detail = { view: button.dataset.view || '', section: button.dataset.section || '' };
    if (!administrationView(detail)) return;
    button.addEventListener('pointerenter', () => ensureAdministration().catch(() => {}), { passive: true });
    button.addEventListener('focus', () => ensureAdministration().catch(() => {}));
  });

  document.querySelectorAll('[data-view="staff"][data-section="command-centre"]').forEach((button) => {
    button.addEventListener('pointerenter', () => ensureCommandCentre().catch(() => {}), { passive: true });
    button.addEventListener('focus', () => ensureCommandCentre().catch(() => {}));
  });

  const loadInitialViewAssets = () => loadViewAssets(requestedLocation());
  if (document.readyState === 'complete') loadInitialViewAssets();
  else document.addEventListener('DOMContentLoaded', loadInitialViewAssets, { once: true });

  window.WWZLazyAssets = Object.freeze({
    ensureAdministration,
    ensureCommandCentre,
    ensureCommandLibrary,
    ensureConfigurationStudio,
    ensureDashboardMap,
    ensureFactions,
    ensureObjectives,
    ensureProgression,
    ensureShopWikiPreviews,
    ensureTickets,
  });
})();
