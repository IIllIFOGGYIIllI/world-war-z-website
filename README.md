# World War Z Bot Website — v1.22.86

Static GitHub Pages dashboard for the World War Z PlayStation DayZ community.

## Current release

Website v1.22.86 adds installable Progressive Web App support to the existing World War Z website without creating a second frontend. Supported browsers can install the same GitHub Pages dashboard as the WWZ Server Companion while all live/authenticated data continues to come from the existing Railway API.

The PWA uses a GitHub Pages-safe relative manifest/service-worker scope, bounded static map caching, explicit update handling, offline/network-state messaging, safe-area support and platform install controls. Railway API responses, authentication, economy, tickets, Shop transactions, moderation, Nitrado/server controls and other live data are never stored in the service-worker cache.

Chernarus/Livonia routing, Shop, Delivery, map geometry and protected Railway API behaviour are unchanged.
