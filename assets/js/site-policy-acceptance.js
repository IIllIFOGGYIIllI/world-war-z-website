/* WWZ public policy metadata (V3.18.1).
 * Public policy pages remain accessible without a blocking acceptance modal.
 * The ONE actionable policy acceptance is verified against the signed-in
 * Discord account, on the selected Nasdara server, by policy-account-v318.js.
 *
 * This module retains the legacy browser-preference reader for compatibility
 * only. A browser preference is NEVER proof of account-level acceptance.
 */
(function (root) {
  'use strict';
  const POLICY_REVISION = '2026-11-13.1';
  const STORAGE_KEY = 'wwz:website:policy-ack:v1';
  const EXEMPT = new Set([
    'legal.html', 'terms.html', 'privacy.html', 'rules.html',
    'community-guidelines.html', 'moderation-policy.html', '404.html', 'offline.html'
  ]);
  const read = (storage) => {
    try {
      const value = JSON.parse(storage?.getItem(STORAGE_KEY) || 'null');
      return Boolean(value && value.version === POLICY_REVISION &&
        value.agreedToTerms === true && value.acknowledgedPrivacy === true);
    } catch (_) {
      return false;
    }
  };
  const helpers = Object.freeze({ POLICY_REVISION, STORAGE_KEY, EXEMPT, read });
  if (typeof module === 'object' && module.exports) module.exports = helpers;
  // Deliberately no modal, storage write, or page-locking side effect.
})(typeof window !== 'undefined' ? window : null);
