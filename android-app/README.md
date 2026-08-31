# World War Z Companion — Android v1.0.0

This Android package wraps the existing World War Z PWA as a **Trusted Web Activity (TWA)**. The website remains the canonical application, so normal website/API updates are immediately available to Android users without shipping a duplicate 294 MB map inside every APK.

## Why TWA

- Uses the live WWZ dashboard and existing Discord authentication.
- Retains the PWA/service-worker model and Web Push notification path.
- Keeps the Android download small because Chernarus map tiles remain on GitHub Pages.
- Gives us an APK/App Bundle path today and a Play Store path later.
- Website content/data can continue evolving independently of the native package version.

## First test build

The included GitHub Actions workflow automatically builds an installable **debug APK** whenever these Android app files are pushed, and it can also be run manually.

1. Put this `android-app/` folder and `.github/workflows/build-wwz-companion-android.yml` into the website repository.
2. Commit and push.
3. Open GitHub -> **Actions** -> **Build WWZ Companion Android**.
4. Open the completed run and download `wwz-companion-debug-apk`.
5. Extract the artifact ZIP and install `app-debug.apk` on an Android test device.

The first debug build is intended for testing. Without Digital Asset Links, Chrome may show a small browser toolbar instead of a fully verified fullscreen TWA.

## Stable signed builds and seamless updates

Before distributing broadly, create one permanent Android signing key:

```powershell
powershell -ExecutionPolicy Bypass -File android-app\scripts\create_signing_key.ps1
```

The script creates a `.jks` file locally and tells you the four GitHub repository secrets required by the workflow. **Never commit the `.jks`, its Base64 copy or either password.** Keep the original key backed up permanently; Android updates must be signed by the same certificate.

After the key exists, generate the Digital Asset Links file using the SHA-256 fingerprint printed by the script:

```powershell
python android-app\scripts\generate_assetlinks.py "AA:BB:..."
```

Upload the resulting `.well-known/assetlinks.json` to the root of the website repository. Once GitHub Pages publishes it, Android can verify `iillifoggyiilli.github.io` as belonging to `com.worldwarz.companion` and launch the PWA as a trusted fullscreen app.

When all four signing secrets exist, the same workflow also produces:

- `app-release-signed.apk` — direct-download Android installer.
- `app-release-bundle.aab` — Google Play upload bundle.

## App versioning

Android v1.0.0 currently uses `appVersionCode` 10000. Future native releases should increment both fields in `twa-manifest.json`, for example:

- 1.0.1 -> 10001
- 1.1.0 -> 10100
- 2.0.0 -> 20000

Most server content, quests, events, analytics, dashboard changes and API-driven features remain live website updates and do **not** inherently require a new APK. Ship a new native version when Android metadata, permissions, native integration or store packaging changes.

## Current identity

- App name: **World War Z Companion**
- Launcher: **WWZ Companion**
- Android package: `com.worldwarz.companion`
- Website: `https://iillifoggyiilli.github.io/world-war-z-website/`
- Start page: `/world-war-z-website/dashboard.html`
