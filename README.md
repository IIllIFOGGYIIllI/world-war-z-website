# World War Z Bot Website — v1.22.86

Static GitHub Pages dashboard for the World War Z PlayStation DayZ community.

## Current release

Website v1.22.86 adds installable Progressive Web App support to the existing World War Z website without creating a second frontend. Supported browsers can install the same GitHub Pages dashboard as the WWZ Server Companion while all live/authenticated data continues to come from the existing Railway API.

The release also hardens dashboard session restoration: authentication bootstrap failures now terminate in a usable login/unavailable state, an 18-second gateway watchdog prevents the “Restoring the Command Centre” screen from remaining indefinitely, and a temporary Railway/Discord verification outage preserves the selected Chernarus/Livonia context for the next retry.

The PWA uses a GitHub Pages-safe relative manifest/service-worker scope, bounded static map caching, explicit update handling, offline/network-state messaging, safe-area support and platform install controls. Railway API responses, authentication, economy, tickets, Shop transactions, moderation, Nitrado/server controls and other live data are never stored in the service-worker cache.

Pairs with Bot v1.18.86.
