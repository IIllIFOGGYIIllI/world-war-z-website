# World War Z — Stage 2D website selector and branding

- PvE and PvP logos now follow selected server identity in the dashboard brand, selected-service badge and overview mark.
- The saved PvP key is restored after Discord OAuth only when listed in the authenticated membership response. No guild bypass or cross-server economy fallback.
- A PvP-specific 403 during account summary no longer invalidates a valid Discord session; it displays access guidance. HTTP 401 still ends the invalid session.
- Selector text corrected to DayZ World, Your Access and Select A Server.
- Older static-page logos replaced with Nasdara community branding; browser favicon, Apple touch icon and PWA launch icons are refreshed from the supplied Nasdara community artwork.
- Service worker now precaches the active favicon instead of legacy WWZ icon assets.
- No player data, Discord configuration or Railway variables changed.
- PvP server runtime is separate from website selection: setting `WWZ_NASDARA_PVP_LIVE=0` or `paused:true` still blocks protected PvP writes.
- Historical Chernarus/Livonia map packages remain in this patch; remove them only as an independently validated cleanup with all map fallback references and validation scripts updated.
