(() => {
  'use strict';

  const pendingScripts = new Map();
  const pendingStylesheets = new Map();
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

  const loadScriptOnce = (key, src, ready, { integrity = '', crossOrigin = '' } = {}) => {
    if (ready?.()) return Promise.resolve();
    if (pendingScripts.has(key)) return pendingScripts.get(key);

    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.dataset.wwzLazyAsset = key;
      if (integrity) script.integrity = integrity;
      if (crossOrigin) script.crossOrigin = crossOrigin;
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

  const loadStylesheetOnce = (key, href, { integrity = '', crossOrigin = '' } = {}) => {
    if (pendingStylesheets.has(key)) return pendingStylesheets.get(key);

    const promise = new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.dataset.wwzLazyAsset = key;
      if (integrity) link.integrity = integrity;
      if (crossOrigin) link.crossOrigin = crossOrigin;
      link.addEventListener('load', resolve, { once: true });
      link.addEventListener('error', () => {
        reject(new Error(`${key} could not be loaded.`));
      }, { once: true });
      document.head.append(link);
    }).catch((error) => {
      pendingStylesheets.delete(key);
      throw error;
    });

    pendingStylesheets.set(key, promise);
    return promise;
  };

  const ensureMapRuntime = () => Promise.all([
    ensureCatalogueStyles(),
    loadStylesheetOnce(
      'leaflet-css',
      'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
      {
        integrity: 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=',
        crossOrigin: 'anonymous'
      }
    ),
    loadStylesheetOnce(
      'wwz-map-css',
      'assets/css/components/chernarus-map.css?v=1.22.93&rev=2'
    ),
    loadScriptOnce(
      'leaflet-runtime',
      'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
      () => Boolean(window.L?.map),
      {
        integrity: 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=',
        crossOrigin: 'anonymous'
      }
    )
  ]).then(() => loadScriptOnce(
    'wwz-map-runtime',
    'assets/js/map/wwz-map.js?v=1.22.93&rev=3',
    () => Boolean(window.WWZMap?.create)
  ));



  const ensureCatalogueStyles = () => loadStylesheetOnce(
    'catalogue-css',
    'assets/css/dashboard/catalogue.css?v=1.22.93&rev=2'
  );

  const ensureModerationStyles = () => loadStylesheetOnce(
    'moderation-css',
    'assets/css/dashboard/moderation.css?v=1.22.93'
  );

  const ensureRulesManager = () => Promise.all([
    loadStylesheetOnce('rules-manager-css', 'assets/css/dashboard/rules-manager.css?v=1.22.93&rev=rules-manager-1'),
    loadAfterDashboardRuntime(() => loadScriptOnce(
      'rules-manager',
      'assets/js/dashboard/rules-manager.js?v=1.22.93&rev=rules-manager-1',
      () => window.__wwzRulesManagerReady === true
    ))
  ]).then(() => undefined);

  const ensureDonationManager = () => Promise.all([
    loadStylesheetOnce('donation-manager-css', 'assets/css/dashboard/donation-manager.css?v=1.22.101&rev=donation-manager-1'),
    loadAfterDashboardRuntime(() => loadScriptOnce(
      'donation-manager',
      'assets/js/dashboard/donation-manager.js?v=1.22.101&rev=donation-manager-1',
      () => window.__wwzDonationManagerReady === true
    ))
  ]).then(() => undefined);

  const ensureDonationOrders = () => Promise.all([
    loadStylesheetOnce('donation-orders-css', 'assets/css/dashboard/donation-orders.css?v=1.37.0&rev=commerce-workflow-1'),
    loadAfterDashboardRuntime(() => loadScriptOnce(
      'donation-orders',
      'assets/js/dashboard/donation-orders.js?v=1.37.0&rev=commerce-workflow-1',
      () => window.__wwzDonationOrdersReady === true
    ))
  ]).then(() => undefined);

  const ensureTicketsStyles = () => loadStylesheetOnce(
    'tickets-css',
    'assets/css/dashboard/tickets.css?v=1.22.93'
  );

  const ensureProgressionStyles = () => loadStylesheetOnce(
    'progression-css',
    'assets/css/dashboard/progression.css?v=1.37.0&rev=quest-progression-1'
  );

  const ensureObjectivesStyles = () => loadStylesheetOnce(
    'objectives-css',
    'assets/css/dashboard/objectives.css?v=1.37.0&rev=quest-progression-1'
  );

  const ensureFactionsStyles = () => loadStylesheetOnce(
    'factions-css',
    'assets/css/dashboard/factions.css?v=1.34.0&rev=faction-upgrade-1'
  );

  const ensureCommandLibrary = () => loadScriptOnce(
    'command-library',
    'assets/js/data/command-library.js?v=1.22.93',
    () => window.__wwzCommandLibraryReady === true
  );

  const ensureMapIntelligenceStyles = () => loadStylesheetOnce(
    'map-intelligence-css',
    'assets/css/components/map-intelligence.css?v=1.25.3'
  );

  const ensureDashboardMap = () => ensureMapRuntime().then(() => loadAfterDashboardRuntime(() => Promise.all([
    ensureMapIntelligenceStyles(),
    loadScriptOnce(
      'dashboard-map',
      'assets/js/pages/dashboard-map-loader.js?v=1.22.93&rev=4',
      () => Boolean(window.WWZDashboardMap?.initialise)
    )
  ]))).then(() => loadScriptOnce(
    'dashboard-map-intelligence',
    'assets/js/pages/dashboard-map-intelligence.js?v=1.26.0&rev=chernarus-progression-1',
    () => window.__wwzMapIntelligenceReady === true
  ));

  const ensureZonesStyles = () => loadStylesheetOnce(
    'zones-css',
    'assets/css/dashboard/zones.css?v=1.22.93'
  );

  const ensureZones = () => Promise.all([ensureMapRuntime(), ensureZonesStyles()])
    .then(() => loadAfterDashboardRuntime(() => loadScriptOnce(
      'zones',
      'assets/js/dashboard/zones.js?v=1.25.5&rev=console-pve-travel-1',
      () => window.__wwzZonesReady === true
    )));

  const ensureServerFeedsStyles = () => loadStylesheetOnce(
    'server-feeds-css',
    'assets/css/dashboard/server-feeds.css?v=1.22.93'
  );

  const ensureServerFeeds = () => ensureServerFeedsStyles()
    .then(() => loadAfterDashboardRuntime(() => loadScriptOnce(
      'server-feeds',
      'assets/js/dashboard/server-feeds.js?v=1.22.93',
      () => window.__wwzServerFeedsReady === true
    )));

  const ensureConfigurationStudio = () => loadAfterDashboardRuntime(() => loadScriptOnce(
    'configuration-studio',
    'assets/js/dashboard/configuration-studio.js?v=1.22.93',
    () => window.__wwzConfigurationStudioReady === true
  ));

  const ensureShopWikiPreviews = () => loadScriptOnce(
    'shop-wiki-previews',
    'assets/js/shop-wiki-previews.js?v=1.22.93',
    () => Boolean(window.WWZShopWikiPreviews?.createImage)
  );

  const ensureShopHelpers = () => loadAfterDashboardRuntime(() => loadScriptOnce(
    'shop-helpers',
    'assets/js/dashboard/shop-helpers.js?v=1.22.93',
    () => window.__wwzShopHelpersReady === true
  ));

  const ensureShopController = () => ensureShopHelpers().then(() => loadScriptOnce(
    'shop-controller',
    'assets/js/dashboard/shop.js?v=1.22.93&rev=4',
    () => window.__wwzShopControllerReady === true
  ));

  const ensureDeliveryController = () => ensureShopController().then(() => loadScriptOnce(
    'delivery-controller',
    'assets/js/dashboard/delivery.js?v=1.22.93&rev=3',
    () => window.__wwzDeliveryControllerReady === true
  ));

  const ensureCommerceRuntime = () => loadAfterDashboardRuntime(() => Promise.all([
    ensureCatalogueStyles(),
    ensureDeliveryController()
  ]).then(() => undefined));

  const commerceView = ({ view = '', section = '' } = {}) => (
    ['shop', 'shopadmin', 'locations', 'delivery', 'serverconfig'].includes(view)
    || (view === 'staff' && section === 'shop-orders')
    || (view === 'configuration' && ['workflow', 'backups'].includes(section))
  );

  const mapDependentCommerceView = ({ view = '' } = {}) => (
    ['shop', 'shopadmin', 'locations', 'delivery'].includes(view)
  );

  const activateCommerceView = (detail = {}) => Promise.all([
    ensureCommerceRuntime(),
    mapDependentCommerceView(detail) ? ensureMapRuntime() : Promise.resolve()
  ]).then(() => {
    window.WWZShopController?.activate?.(detail);
    window.WWZDeliveryController?.activate?.(detail);
  });

  const ensureAppeals = () => ensureModerationStyles().then(() => loadAfterDashboardRuntime(() => loadScriptOnce(
    'appeals',
    'assets/js/dashboard/appeals.js?v=1.22.93',
    () => window.__wwzAppealsReady === true
  )));

  const ensureAdministration = () => Promise.all([
    ensureModerationStyles(),
    loadStylesheetOnce('player-intelligence-css', 'assets/css/dashboard/player-intelligence.css?v=1.31.0&rev=player-intelligence-1')
  ]).then(() => loadAfterDashboardRuntime(() => loadScriptOnce(
    'administration',
    'assets/js/dashboard/administration.js?v=1.36.0&rev=operations-centre-1',
    () => window.__wwzAdministrationReady === true
  )));

  const ensureActionCentre = () => Promise.all([
    loadStylesheetOnce('action-centre-css', 'assets/css/dashboard/action-centre.css?v=1.38.0&rev=action-centre-1'),
    loadAfterDashboardRuntime(() => loadScriptOnce(
      'action-centre',
      'assets/js/dashboard/action-centre.js?v=1.38.0&rev=action-centre-1',
      () => window.__wwzActionCentreReady === true
    ))
  ]).then(() => undefined);

  const ensureOperationsCentre = () => Promise.all([
    loadStylesheetOnce('operations-centre-css', 'assets/css/dashboard/operations-centre.css?v=1.36.0&rev=operations-centre-1'),
    loadAfterDashboardRuntime(() => loadScriptOnce(
      'operations-centre',
      'assets/js/dashboard/operations-centre.js?v=1.36.0&rev=operations-centre-1',
      () => window.__wwzOperationsCentreReady === true
    ))
  ]).then(() => undefined);

  const ensureDataManagement = () => Promise.all([
    loadStylesheetOnce('data-management-css', 'assets/css/dashboard/data-management.css?v=1.39.0&rev=data-management-1'),
    loadAfterDashboardRuntime(() => loadScriptOnce(
      'data-management',
      'assets/js/dashboard/data-management.js?v=1.39.0&rev=data-management-1',
      () => window.__wwzDataManagementReady === true
    ))
  ]).then(() => undefined);

  const ensureTickets = () => ensureTicketsStyles().then(() => loadAfterDashboardRuntime(() => loadScriptOnce(
    'tickets',
    'assets/js/dashboard/tickets.js?v=1.22.93',
    () => window.__wwzTicketsReady === true
  )));

  const ensureProgression = () => ensureProgressionStyles().then(() => loadAfterDashboardRuntime(() => loadScriptOnce(
    'progression',
    'assets/js/dashboard/progression.js?v=1.37.0&rev=quest-progression-1',
    () => window.__wwzProgressionReady === true
  )));

  const ensureObjectives = () => ensureObjectivesStyles().then(() => loadAfterDashboardRuntime(() => loadScriptOnce(
    'objectives',
    'assets/js/dashboard/objectives.js?v=1.37.0&rev=quest-progression-1',
    () => window.__wwzObjectivesReady === true
  )));

  const ensureFactions = () => ensureFactionsStyles().then(() => loadAfterDashboardRuntime(() => loadScriptOnce(
    'factions',
    'assets/js/dashboard/factions.js?v=1.34.0&rev=faction-upgrade-1',
    () => window.__wwzFactionsReady === true
  )));

  const ensureLivoniaPvp = () => Promise.all([
    loadStylesheetOnce('livonia-pvp-css', 'assets/css/dashboard/livonia-pvp.css?v=1.25.3'),
    loadAfterDashboardRuntime(() => loadScriptOnce(
      'livonia-pvp',
      'assets/js/dashboard/livonia-pvp.js?v=1.25.3',
      () => window.__wwzLivoniaPvpReady === true
    ))
  ]).then(() => undefined);

  const ensureDeathmatchRotation = () => Promise.all([
    loadStylesheetOnce('deathmatch-rotation-css', 'assets/css/dashboard/deathmatch-rotation.css?v=1.32.0&rev=livonia-dm-1'),
    loadAfterDashboardRuntime(() => loadScriptOnce(
      'deathmatch-rotation',
      'assets/js/dashboard/deathmatch-rotation.js?v=1.32.0&rev=livonia-dm-1',
      () => window.__wwzDeathmatchRotationReady === true
    ))
  ]).then(() => undefined);

  const ensureChernarusPve = () => Promise.all([
    loadStylesheetOnce('chernarus-pve-css', 'assets/css/dashboard/chernarus-pve.css?v=1.26.0&rev=chernarus-progression-1'),
    loadAfterDashboardRuntime(() => loadScriptOnce(
      'chernarus-pve',
      'assets/js/dashboard/chernarus-pve.js?v=1.26.0&rev=chernarus-progression-1',
      () => window.__wwzChernarusPveReady === true
    ))
  ]).then(() => undefined);


  const ensureCommunity = () => Promise.all([
    loadStylesheetOnce('community-css', 'assets/css/dashboard/community.css?v=1.33.0&rev=events-overhaul-1'),
    loadAfterDashboardRuntime(() => loadScriptOnce(
      'community',
      'assets/js/dashboard/community.js?v=1.33.0&rev=events-overhaul-1',
      () => window.__wwzCommunityReady === true
    ))
  ]).then(() => undefined);

  const ensureFlagClaims = () => Promise.all([
    loadStylesheetOnce('flag-claims-css', 'assets/css/dashboard/flag-claims.css?v=1.30.0&rev=flag-phase2-1'),
    loadAfterDashboardRuntime(() => loadScriptOnce(
      'flag-claims',
      'assets/js/dashboard/flag-claims.js?v=1.30.0&rev=flag-phase2-1',
      () => window.__wwzFlagClaimsReady === true
    ))
  ]).then(() => undefined);

  const ensureCommandCentre = () => loadAfterDashboardRuntime(() => loadScriptOnce(
    'command-centre',
    'assets/js/dashboard/command-centre.js?v=1.28.0&rev=m10-admin-push-1',
    () => window.__wwzCommandCentreReady === true
  ));

  const requestedLocation = () => {
    const raw = String(location.hash || '').replace(/^#/, '');
    const [view = '', section = ''] = raw.split('/', 2);
    return { view, section };
  };

  const administrationView = ({ view = '', section = '' } = {}) => (
    (view === 'staff' && ['queue', 'cases', 'banlists', 'players', 'server-controls', 'server-audit', 'failures', 'rules', 'donations', 'donation-orders'].includes(section))
    || (view === 'configuration' && ['discord-onboarding', 'community-tools', 'discord-logs', 'notifications'].includes(section))
  );

  const loadViewAssets = ({ view = '', section = '' } = {}) => {
    const detail = { view, section };
    if (view === 'actioncentre') ensureActionCentre().then(() => window.WWZActionCentre?.activate?.(detail)).catch(() => {});
    if (view === 'commands') ensureCommandLibrary().catch(() => {});
    if (view === 'map') ensureDashboardMap().catch(() => {});
    if (view === 'zones') ensureZones().then(() => window.WWZZones?.activate?.(detail)).catch(() => {});
    if (view === 'feeds') ensureServerFeeds().then(() => window.WWZServerFeeds?.activate?.(detail)).catch(() => {});
    if (view === 'serverconfig' && section === 'structured') ensureConfigurationStudio().catch(() => {});
    if (view === 'shop' || view === 'shopadmin') ensureShopWikiPreviews().catch(() => {});
    if (commerceView(detail)) activateCommerceView(detail).catch(() => {});
    if (administrationView(detail)) ensureAdministration().catch(() => {});
    if (view === 'staff' && section === 'server-audit') ensureOperationsCentre().then(() => window.WWZOperationsCentre?.activate?.(detail)).catch(() => {});
    if (view === 'configuration' && section === 'data-management') ensureDataManagement().then(() => window.WWZDataManagement?.activate?.(detail)).catch(() => {});
    if (view === 'staff' && section === 'rules') ensureRulesManager().catch(() => {});
    if (view === 'staff' && section === 'donations') ensureDonationManager().catch(() => {});
    if (view === 'staff' && section === 'donation-orders') ensureDonationOrders().catch(() => {});
    if (view === 'appeals' || (view === 'configuration' && section === 'appeals')) ensureAppeals().then(() => window.WWZAppeals?.activate?.(detail)).catch(() => {});
    if (view === 'tickets') ensureTickets().catch(() => {});
    if (view === 'progression' || view === 'players') ensureProgression().catch(() => {});
    if (view === 'objectives') ensureObjectives().catch(() => {});
    if (view === 'factions') ensureFactions().catch(() => {});
    if (view === 'livoniapvp') ensureLivoniaPvp().then(() => window.WWZLivoniaPvp?.activate?.(detail)).catch(() => {});
    if (view === 'deathmatch') ensureDeathmatchRotation().then(() => window.WWZDeathmatchRotation?.activate?.(detail)).catch(() => {});
    if (view === 'chernaruspve') ensureChernarusPve().then(() => window.WWZChernarusPve?.activate?.(detail)).catch(() => {});
    if (view === 'community') ensureCommunity().then(() => window.WWZCommunity?.activate?.(detail)).catch(() => {});
    if (view === 'flags') ensureFlagClaims().then(() => window.WWZFlagClaims?.activate?.(detail)).catch(() => {});
    if (view === 'staff' && section === 'command-centre') ensureCommandCentre().catch(() => {});
  };

  let sawViewChange = false;
  window.addEventListener('wwz:viewchange', (event) => {
    sawViewChange = true;
    loadViewAssets(event.detail || {});
  });

  const preloads = [
    ['actioncentre', ensureActionCentre],
    ['commands', ensureCommandLibrary],
    ['map', ensureDashboardMap],
    ['zones', ensureZones],
    ['feeds', ensureServerFeeds],
    ['shop', () => Promise.all([ensureCommerceRuntime(), ensureMapRuntime()])],
    ['shopadmin', () => Promise.all([ensureCommerceRuntime(), ensureMapRuntime()])],
    ['locations', () => Promise.all([ensureCommerceRuntime(), ensureMapRuntime()])],
    ['delivery', () => Promise.all([ensureCommerceRuntime(), ensureMapRuntime()])],
    ['serverconfig', ensureCommerceRuntime],
    ['tickets', ensureTickets],
    ['progression', ensureProgression],
    ['players', ensureProgression],
    ['objectives', ensureObjectives],
    ['factions', ensureFactions],
    ['livoniapvp', ensureLivoniaPvp],
    ['community', ensureCommunity],
    ['flags', ensureFlagClaims],
  ];
  dashboardRuntimeReadyPromise.then(() => ensureActionCentre().catch(() => {}));

  preloads.forEach(([view, load]) => {
    document.querySelectorAll(`[data-view="${view}"]`).forEach((button) => {
      button.addEventListener('pointerenter', () => load().catch(() => {}), { passive: true });
      button.addEventListener('focus', () => load().catch(() => {}));
    });
  });

  document.querySelectorAll('[data-view="staff"][data-section="shop-orders"], [data-view="configuration"][data-section="workflow"], [data-view="configuration"][data-section="backups"]').forEach((button) => {
    button.addEventListener('pointerenter', () => ensureCommerceRuntime().catch(() => {}), { passive: true });
    button.addEventListener('focus', () => ensureCommerceRuntime().catch(() => {}));
  });

  document.querySelectorAll('[data-view="appeals"], [data-view="configuration"][data-section="appeals"]').forEach((button) => {
    button.addEventListener('pointerenter', () => ensureAppeals().catch(() => {}), { passive: true });
    button.addEventListener('focus', () => ensureAppeals().catch(() => {}));
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

  [
    ['rules', ensureRulesManager],
    ['donations', ensureDonationManager],
    ['donation-orders', ensureDonationOrders],
  ].forEach(([section, load]) => {
    document.querySelectorAll(`[data-view="staff"][data-section="${section}"]`).forEach((button) => {
      button.addEventListener('pointerenter', () => load().catch(() => {}), { passive: true });
      button.addEventListener('focus', () => load().catch(() => {}));
    });
  });

  document.querySelectorAll('[data-view="staff"][data-section="server-audit"]').forEach((button) => {
    button.addEventListener('pointerenter', () => ensureOperationsCentre().catch(() => {}), { passive: true });
    button.addEventListener('focus', () => ensureOperationsCentre().catch(() => {}));
  });

  document.querySelectorAll('[data-view="configuration"][data-section="data-management"]').forEach((button) => {
    button.addEventListener('pointerenter', () => ensureDataManagement().catch(() => {}), { passive: true });
    button.addEventListener('focus', () => ensureDataManagement().catch(() => {}));
  });

  document.querySelectorAll('[data-view="staff"][data-section="command-centre"]').forEach((button) => {
    button.addEventListener('pointerenter', () => ensureCommandCentre().catch(() => {}), { passive: true });
    button.addEventListener('focus', () => ensureCommandCentre().catch(() => {}));
  });

  const loadInitialViewAssets = () => {
    if (!sawViewChange) loadViewAssets(requestedLocation());
  };
  if (document.readyState === 'complete') loadInitialViewAssets();
  else document.addEventListener('DOMContentLoaded', loadInitialViewAssets, { once: true });

  window.WWZLazyAssets = Object.freeze({
    ensureAdministration,
    ensureAppeals,
    ensureCatalogueStyles,
    ensureCommandCentre,
    ensureCommandLibrary,
    ensureCommunity,
    ensureCommerceRuntime,
    ensureConfigurationStudio,
    ensureDashboardMap,
    ensureZones,
    ensureZonesStyles,
    ensureServerFeeds,
    ensureServerFeedsStyles,
    ensureDeliveryController,
    ensureFactions,
    ensureFlagClaims,
    ensureLivoniaPvp,
    ensureMapRuntime,
    ensureModerationStyles,
    ensureOperationsCentre,
    ensureDataManagement,
    ensureRulesManager,
    ensureDonationManager,
    ensureDonationOrders,
    ensureObjectives,
    ensureObjectivesStyles,
    ensureProgressionStyles,
    ensureTicketsStyles,
    ensureFactionsStyles,
    ensureProgression,
    ensureShopController,
    ensureShopHelpers,
    ensureShopWikiPreviews,
    ensureTickets,
  });
})();
