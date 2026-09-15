# World War Z Website v1.53.0 — Companion Distribution & Chernarus PvE Alignment

## Companion / App Download Repair
- Repairs the Android Companion distribution path after the old `companion-v1.0.0` GitHub Release disappeared and left direct APK/ZIP links returning 404.
- Advances the signed Android wrapper to **v1.0.1 / version code 10001** and triggers a fresh signed build when this update is pushed.
- The Android workflow now publishes both versioned files and stable `World-War-Z-Companion.apk` / `.zip` aliases to the matching GitHub Release.
- Exact APK/ZIP size and SHA-256 metadata is written back to `assets/data/companion-release.json` automatically after the signed release is published, eliminating manually stale release metadata.
- Companion buttons verify the GitHub Release and actual APK asset before exposing a direct download; a missing release is shown as temporarily unavailable instead of sending players to a dead link.
- Homepage Android downloads only switch from the Companion page to a direct APK after the GitHub asset is confirmed live.

## Installable Web App
- `Install App` controls remain available whenever the site is not already installed instead of disappearing when a browser does not expose `beforeinstallprompt`.
- Browsers without a programmatic install prompt now receive platform-appropriate Android, iPhone/iPad or desktop installation instructions.
- Native app-update prompts return to the Companion page, where release availability is verified before download.

## Chernarus PvE Alignment
- Public Chernarus copy now states that the world is PvE outside designated fenced military PvP areas or explicitly announced temporary event zones.
- My WWZ identifies the selected world as `Chernarus PvE · Military PvP Zones`.
- The public home command count is corrected to 100.
- Live rules remain sourced from Bot v1.54.0, which safely migrates untouched stock Chernarus rules to the new PvE / fenced military PvP model.

## PWA / Compatibility
- PWA advances to v1.53.0 without rotating the bounded map-cache generation.
- Pairs with Bot v1.54.0.
- No map tile/data replacement, Railway database wipe, DayZ mission upload or Nitrado configuration change is required.
- DayZ++ fenced military zone definitions are not modified by the website release.
