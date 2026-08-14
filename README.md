# World War Z Bot Website — v1.22.88

Static GitHub Pages website/dashboard and installable WWZ Server Companion for the World War Z PlayStation DayZ community.

## Current release

Website v1.22.88 synchronizes the public roadmap, deployment status and release metadata with the actual production platform. The normal runtime/UI feature set is unchanged by this documentation-focused release.

Current state:

- Chernarus is live in production.
- Livonia onboarding and multi-server isolation are complete; its Nitrado-dependent runtime is temporarily paused while that hosting service is inactive, with all Livonia data/configuration preserved.
- The performance/optimisation audit is complete.
- The existing website is installable as the **WWZ Server Companion** PWA; Windows and mobile installation have been confirmed in real-device testing.
- Natural XP/Prestige milestone QA remains deferred until genuine production milestones occur.
- Future app work can build toward opt-in push notifications and optional Capacitor/App Store packaging without creating a second frontend.

The PWA continues to use the same GitHub Pages frontend, Railway API, Discord authentication and server-owned data as the normal website. Railway/API/authenticated responses, economy, tickets, Shop transactions, moderation and Nitrado/server controls remain network-only and are never treated as offline-confirmed state.

Pairs with Bot v1.18.91.
