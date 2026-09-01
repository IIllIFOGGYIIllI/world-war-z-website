#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

SIGNING_CERT_SHA256 = "79:21:5A:49:A1:B9:5B:9E:A9:B4:63:BF:36:1E:43:87:6B:F6:D6:95:4F:0B:63:48:80:B1:9F:F4:3B:F7:D2:5F"
LEGACY_FIRST_RELEASE = "1.0.0"


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open('rb') as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def validate_manifest(manifest: dict) -> tuple[str, int]:
    version = str(manifest.get('appVersion') or '').strip()
    code = int(manifest.get('appVersionCode') or 0)
    if not version or code <= 0:
        raise SystemExit('twa-manifest.json must contain appVersion and appVersionCode.')

    start_url = str(manifest.get('startUrl') or '')
    params = parse_qs(urlsplit(start_url).query)
    source = (params.get('source') or [''])[0]
    query_version = (params.get('app_version') or [''])[0]
    query_code = (params.get('app_code') or [''])[0]
    if source != 'android-app':
        raise SystemExit('TWA startUrl must include source=android-app.')
    if query_version != version or query_code != str(code):
        raise SystemExit(
            'TWA startUrl app_version/app_code must match appVersion/appVersionCode. '
            f'Expected {version}/{code}, got {query_version or "missing"}/{query_code or "missing"}.'
        )
    return version, code


def main() -> int:
    parser = argparse.ArgumentParser(description='Package a signed WWZ Companion APK for direct website distribution.')
    parser.add_argument('--apk', required=True, type=Path)
    parser.add_argument('--manifest', type=Path, default=Path('twa-manifest.json'))
    parser.add_argument('--output-root', required=True, type=Path)
    parser.add_argument('--released-at', default='')
    args = parser.parse_args()

    apk = args.apk.resolve()
    manifest_path = args.manifest.resolve()
    output_root = args.output_root.resolve()
    if not apk.is_file():
        raise SystemExit(f'APK not found: {apk}')
    if not manifest_path.is_file():
        raise SystemExit(f'Manifest not found: {manifest_path}')

    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    version, code = validate_manifest(manifest)
    minimum_sdk = int(manifest.get('minSdkVersion') or 23)
    package_name = str(manifest.get('packageId') or 'com.worldwarz.companion')

    downloads = output_root / 'downloads' / 'android'
    data_dir = output_root / 'assets' / 'data'
    downloads.mkdir(parents=True, exist_ok=True)
    data_dir.mkdir(parents=True, exist_ok=True)

    apk_name = f'World-War-Z-Companion-v{version}.apk'
    zip_name = f'World-War-Z-Companion-v{version}.zip'
    apk_target = downloads / apk_name
    zip_target = downloads / zip_name
    shutil.copy2(apk, apk_target)

    with zipfile.ZipFile(zip_target, 'w', zipfile.ZIP_DEFLATED) as archive:
        archive.write(apk_target, apk_name)

    apk_sha = sha256_file(apk_target)
    zip_sha = sha256_file(zip_target)
    released_at = args.released_at.strip() or datetime.now(timezone.utc).date().isoformat()

    payload = {
        'schema_version': 1,
        'channel': 'stable',
        'platform': 'android',
        'app_name': 'World War Z Companion',
        'package_name': package_name,
        'version': version,
        'version_code': code,
        'released_at': released_at,
        'minimum_android_api': minimum_sdk,
        'apk_url': f'downloads/android/{apk_name}',
        'zip_url': f'downloads/android/{zip_name}',
        'release_page_url': 'companion.html',
        'apk_size_bytes': apk_target.stat().st_size,
        'zip_size_bytes': zip_target.stat().st_size,
        'apk_sha256': apk_sha,
        'zip_sha256': zip_sha,
        'signing_cert_sha256': SIGNING_CERT_SHA256,
        'legacy_version_without_query': LEGACY_FIRST_RELEASE,
        'notes': [
            'Signed direct Android release for the World War Z community.',
            'Uses the live WWZ GitHub Pages PWA and existing Railway/Discord services.',
            'Website/PWA updates are delivered separately without requiring a new APK.',
        ],
    }
    (data_dir / 'companion-release.json').write_text(json.dumps(payload, indent=2) + '\n', encoding='utf-8')

    print(f'WWZ Companion v{version} ({code})')
    print(f'APK: {apk_target} [{apk_sha}]')
    print(f'ZIP fallback: {zip_target} [{zip_sha}]')
    print(f'Metadata: {data_dir / "companion-release.json"}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
