'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync('assets/js/dashboard/ios-auth-handoff.js', 'utf8');
const ua = { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', platform: 'iPhone', maxTouchPoints: 5, standalone: false };
const ctx = {
  URL, URLSearchParams, navigator: ua,
  window: { navigator: ua, matchMedia: () => ({matches: false}) },
  location: { href: 'https://iillifoggyiilli.github.io/world-war-z-website/dashboard.html' }
};
vm.runInNewContext(code, ctx);
const auth = ctx.window.WWZIOSAuth;
const validTicket = 'ABcd0123_-'.repeat(5);
const base = ctx.location.href;
assert.equal(auth.isIOS(), true);
assert.equal(auth.isInstalled(), false);
const sessionToken = 'A'.repeat(64);
const handoffRecord = auth.createSessionHandoff(sessionToken, 1000);
assert.ok(handoffRecord);
assert.equal(auth.parseSessionHandoff(handoffRecord, 1001).token, sessionToken);
assert.equal(auth.parseSessionHandoff(handoffRecord, 45999).token, sessionToken);
assert.equal(auth.parseSessionHandoff(handoffRecord, 46000), null, 'handoff expires after 45 seconds');
assert.equal(auth.parseSessionHandoff('{bad json', 1001), null);
assert.equal(auth.createSessionHandoff('too-short', 1000), null);
assert.equal(auth.parseSessionHandoff(JSON.stringify({version:1,token:sessionToken,created_at:1000,expires_at:999999}), 1001), null, 'oversized TTL is rejected');
assert.equal(auth.shouldOfferSafariHandoff(false), false, 'normal Safari login must finish automatically');
assert.equal(auth.shouldOfferSafariHandoff(false, true), true, 'explicit installed-app redirect offers transfer');
assert.equal(auth.shouldOfferSafariHandoff(true, true), false, 'Safari-initiated login remains automatic');
ua.standalone = true;
assert.equal(auth.isInstalled(), true);
assert.equal(auth.shouldOfferSafariHandoff(false, true), false);
ua.standalone = false;
assert.equal(auth.parseTransferLink(base + '#login_ticket=' + validTicket), validTicket);
assert.equal(auth.parseTransferLink(base + '?wwz_handoff=ios_app#login_ticket=' + validTicket), validTicket);
for (const url of [
  base.replace('https:', 'http:') + '#login_ticket=' + validTicket,
  base.replace('github.io', 'github.io.evil.example') + '#login_ticket=' + validTicket,
  'https://example.org/dashboard.html#login_ticket=' + validTicket,
  base + '?debug=1#login_ticket=' + validTicket,
  base + '?wwz_handoff=other#login_ticket=' + validTicket,
  base + '?wwz_handoff=ios_app&extra=1#login_ticket=' + validTicket,
  base + '#auth_error=cancelled',
  base + '#login_ticket=too-short',
  base + '#login_ticket=' + validTicket + '&other=data',
  validTicket
]) assert.equal(auth.parseTransferLink(url), null, 'reject untrusted or malformed transfer link');
ua.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'; ua.platform = 'Win32';
assert.equal(auth.isIOS(), false);
assert.equal(auth.shouldOfferSafariHandoff(false), false);
const page = fs.readFileSync('dashboard.html', 'utf8');
const account = fs.readFileSync('assets/js/dashboard/account.js', 'utf8');
for (const token of [
  'data-ios-auth-app-help', 'data-ios-auth-safari-help',
  'data-ios-auth-copy-link', 'data-ios-auth-transfer-submit',
  'ios-auth-handoff.js?v=1.22.93', 'ios-auth.css?v=1.22.93'
]) assert.ok(page.includes(token), 'missing iOS recovery UI ' + token);
assert.ok(account.includes('shouldOfferSafariHandoff(locallyStartedInSafari, appHandoffRequested)'));
assert.ok(account.includes("loginUrl.searchParams.set('handoff', 'ios_app')"));
assert.ok(account.includes('window.location.assign(loginUrl.toString())'));
assert.ok(!account.includes("window.open(AUTH_LOGIN_URL, '_self')"));
assert.ok(account.includes('Do not consume the one-time ticket in Safari'));
assert.ok(account.includes('await completeDiscordLogin(ticket)'));
assert.ok(account.includes("new URLSearchParams(location.search).get('wwz_handoff') === 'ios_app'"));
assert.ok(account.includes("wwz_tab_handoff"));
assert.ok(account.includes("new BroadcastChannel(iosAuthTabChannelName(nonce))"));
assert.ok(account.includes("publishIOSAuthTabHandoff(tabHandoffNonce, payload.session_token)"));
assert.ok(account.includes("parseSessionHandoff?.(message.handoff, Date.now())"));
const core = fs.readFileSync('assets/js/dashboard/core.js','utf8');
assert.ok(core.includes("currentUrl.searchParams.delete('wwz_tab_handoff')"));
assert.ok(account.includes('showSavedSessionRetry(true)'));
assert.ok(account.includes('data-auth-session-retry'));
assert.ok(account.includes('window.WWZHttp.request(AUTH_COMPLETE_URL'));
assert.ok(account.includes('window.WWZHttp.request(AUTH_ME_URL'));
assert.ok(!account.includes("window.open(AUTH_LOGIN_URL, '_self')"));
assert.ok(page.includes('data-auth-session-retry'));
assert.ok(page.includes('iosreturn=4'));
assert.ok(core.includes("window.localStorage.getItem('wwz_ios_oauth_return_view')"));
assert.ok(core.includes("window.localStorage.removeItem('wwz_ios_oauth_return_view')"));
assert.ok(account.includes("window.localStorage.setItem('wwz_ios_oauth_return_view', returnKey)"));
assert.ok(account.includes("window.localStorage.setItem('wwz_ios_oauth_pending_return', '1')"));
assert.ok(account.includes("window.localStorage.removeItem('wwz_ios_oauth_pending_return')"));
const sw = fs.readFileSync('sw.js', 'utf8');
assert.ok(sw.includes("const WWZ_PWA_UPDATE_REVISION = '"));
assert.ok(sw.includes("url.pathname.endsWith('/assets/js/dashboard/ios-auth-handoff.js')"));
console.log('PASS: iOS PWA OAuth handoff and safe one-time-ticket validation');
