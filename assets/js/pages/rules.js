(() => {
  'use strict';
  const API_BASE = 'https://world-war-z.up.railway.app';
  const host = document.querySelector('[data-public-rules]');
  const status = document.querySelector('[data-rules-status]');
  const meta = document.querySelector('[data-rules-meta]');
  if (!host) return;

  const load = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/rules/public`, { headers: { Accept: 'application/json' } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Rules unavailable.');
      host.replaceChildren();
      (payload.sections || []).forEach((section, index) => {
        const article = document.createElement('article');
        article.className = 'content-card rules-public-section';
        const title = document.createElement('h2');
        title.textContent = `${index + 1}. ${section.title || 'RULES'}`;
        const list = document.createElement('ul');
        (section.rules || []).forEach((rule) => { const item = document.createElement('li'); item.textContent = rule; list.append(item); });
        article.append(title, list);
        host.append(article);
      });
      if (meta) {
        const updated = payload.updated_at ? new Date(payload.updated_at).toLocaleString('en-AU') : 'initial ruleset';
        meta.textContent = `${payload.server?.name || 'World War Z'} · ${payload.server?.map_name || 'DayZ'} · Revision ${payload.revision || 0} · Updated ${updated}`;
      }
      if (status) status.hidden = true;
    } catch (error) {
      if (status) { status.hidden = false; status.textContent = error instanceof Error ? error.message : 'Server rules are temporarily unavailable.'; }
    }
  };
  load();
})();
