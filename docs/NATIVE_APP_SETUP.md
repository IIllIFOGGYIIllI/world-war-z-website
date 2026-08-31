# World War Z native app foundation

Website v1.27.0 keeps the PWA as the canonical application and adds a repeatable Capacitor 8 wrapper workflow. Do not maintain a separate copy of the dashboard by hand.

## One-time local setup

1. Install a current Node.js LTS release.
2. Run `npm install` in the website repository.
3. Run `npm run native:prepare` to build the `www/` web payload.
4. Android: run `npm run native:add:android` once, then `npm run native:android` for future releases.
5. iOS: run `npm run native:add:ios` once on macOS, then `npm run native:ios` for future releases.

`npm run native:sync` refreshes native projects from the same website release. The generated `www/`, `android/`, `ios/`, and `node_modules/` folders should not replace the source website.

## Store publication

The repository can prepare and synchronize the native wrapper, but store publication still requires credentials owned by the community administrator:

- Google Play Console developer account and Android signing key.
- Apple Developer membership, macOS/Xcode, provisioning/signing, and App Store Connect access.
- Store listing metadata, screenshots, privacy declarations and review approval.

Never commit signing keys, certificates, provisioning profiles or store credentials.

## Notifications

Web Push in v1.27.0 is for supported installed/browser PWAs and is opt-in per browser. A future store submission can additionally connect native APNs/FCM credentials if native push is desired; those credentials should remain outside the repository.
