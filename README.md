# World War Z Bot Website — v1.22.87


**Mobile PWA navigation QA:** sidebar labels no longer inherit icon-box styling, and mobile installation is exposed inside the sidebar rather than behind the topbar account control.
Static GitHub Pages dashboard for the World War Z PlayStation DayZ community.

## Current release

Website v1.22.87 is the first mobile-device QA follow-up for the installable WWZ Server Companion. It fixes the dashboard sidebar text/icon overlap seen on Android and moves the install action out of the crowded mobile topbar into a full-width control inside the sidebar.

The underlying v1.22.86 PWA architecture remains unchanged: the installed app and normal GitHub Pages site use the same frontend, Discord authentication and Railway API, with live/protected API data kept out of the service-worker cache.

Pairs with Bot v1.18.90.
