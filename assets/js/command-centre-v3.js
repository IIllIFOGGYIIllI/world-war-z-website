/* WWZ V3 command centre — lightweight presentation bindings only.
 * Never changes dashboard routes, permissions, data, purchases, map, or server
 * settings. Existing controllers remain the only source of live data.
 */
(() => {
  'use strict';
  const body = document.body;
  const wideToggle = document.querySelector('[data-v3-wide-toggle]');
  const key = 'wwz:command-centre:v3:wide';
  const desktop = window.matchMedia('(min-width: 981px)');
  const syncWide = (wide) => {
    const active = Boolean(wide && desktop.matches);
    body.classList.toggle('wwz-v3-wide', active);
    if (!wideToggle) return;
    wideToggle.setAttribute('aria-pressed', String(active));
    wideToggle.setAttribute('aria-label', active ? 'Show dashboard sidebar' : 'Expand dashboard workspace');
    wideToggle.setAttribute('title', active ? 'Show sidebar' : 'Expand workspace');
    const glyph = wideToggle.querySelector('[data-v3-wide-icon]');
    if (glyph) glyph.textContent = active ? '⇥' : '⇤';
  };
  if (wideToggle && body.classList.contains('wwz-v3-dashboard')) {
    let initial = false;
    try { initial = localStorage.getItem(key) === 'on'; } catch { /* storage optional */ }
    syncWide(initial);
    wideToggle.addEventListener('click', () => {
      const next = !body.classList.contains('wwz-v3-wide');
      syncWide(next);
      try { localStorage.setItem(key, next ? 'on' : 'off'); }
      catch { /* private mode */ }
    });
    const onBreakpoint = () => {
      let desired = false;
      try { desired = localStorage.getItem(key) === 'on'; }
      catch { desired = body.classList.contains('wwz-v3-wide'); }
      syncWide(desired);
    };
    if (desktop.addEventListener) desktop.addEventListener('change', onBreakpoint);
    else desktop.addListener?.(onBreakpoint);
  }
  // Mirror the existing source-of-truth status from the live dashboard
  // controller. Do not duplicate data-* bindings or contact the bot API.
  const liveSource = document.querySelector('[data-view-panel="overview"] [data-server-status]');
  const liveTarget = document.querySelector('[data-v3-live-status]');
  if (liveSource && liveTarget) {
    const sync = () => {
      const value = (liveSource.textContent || '').replace(/\s+/g, ' ').trim();
      liveTarget.textContent = value || 'Connecting';
      const status = value.toLowerCase();
      liveTarget.dataset.state =
        /^(online|running|live)\b/.test(status) ? 'online' :
        /^(offline|stopped|down|error|unavailable)\b/.test(status) ? 'offline' : 'loading';
    };
    new MutationObserver(sync).observe(liveSource, { childList:true, subtree:true, characterData:true });
    sync();
  }
  // Do not create competing poll loops; defer to the pre-existing status
  // updates and the existing PWA cache/version workflow.
})();
