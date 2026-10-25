'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const a=read('assets/js/dashboard/account.js'),h=read('dashboard.html'),c=read('companion.html'),p=read('assets/js/pwa.js');
for(const token of [
'const statusResponseIsCurrent = (epoch, key) =>',
'epoch === liveStatusRequestEpoch && key === liveStatusServerKey()',
"window.addEventListener('wwz:serverchange'",
'liveStatusRequestEpoch += 1;',
'if (!statusResponseIsCurrent(epoch, serverKey)) return;',
'Next website status check in',
'DayZ data may update separately',
"window.addEventListener('online'",
"window.addEventListener('offline'"
])assert.ok(a.includes(token),'missing status safeguard '+token);
assert.equal((h.match(/data-status-next-check=""/g)||[]).length,2);
assert.ok(h.includes('Selected server')&&h.includes('data-detail-map="">Nasdara'));
assert.ok(h.includes('status-timing.css?v=1.22.93&rev=stage5-1'));
assert.ok(h.includes('account.js?v=1.58.3&amp;rev=stage5-status-1'));
assert.ok(c.includes('Nasdara PvE and Nasdara PvP')&&!c.includes('Keeps Chernarus and Livonia'));
assert.ok(c.includes('data-iphone-install-guide')&&c.includes('Add to Home Screen'));
assert.ok(c.includes('Checking published release'));
for(const token of [
'FOREGROUND_UPDATE_CHECK_MS = 15 * 60_000',
'const checkForegroundUpdates = () =>',
"window.addEventListener('pageshow', checkForegroundUpdates)",
"document.addEventListener('visibilitychange', checkForegroundUpdates)",
'lastForegroundCheckAt = Date.now();',
'void activeServiceWorkerRegistration.update().catch(() => null);'
])assert.ok(p.includes(token),'missing PWA foreground safeguard '+token);
assert.match(read('sw.js'), /WWZ_PWA_UPDATE_REVISION = '2026-10-26-stage5-qol-\d+';/);
console.log('PASS: Stage 5 status timing, Nasdara Companion and foreground updates');
