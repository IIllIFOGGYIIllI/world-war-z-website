#!/usr/bin/env python3
"""Generate Digital Asset Links for the WWZ Companion signing certificate."""
from __future__ import annotations
import argparse
import json
from pathlib import Path

PACKAGE_ID = "com.worldwarz.companion"


def normalize_fingerprint(value: str) -> str:
    raw = value.strip().upper().replace(" ", "")
    if not raw:
        raise ValueError("Fingerprint is empty")
    parts = raw.split(":")
    if len(parts) == 1 and len(raw) == 64:
        parts = [raw[i:i+2] for i in range(0, 64, 2)]
    if len(parts) != 32 or any(len(p) != 2 for p in parts):
        raise ValueError("Expected a SHA-256 certificate fingerprint (32 hex bytes)")
    try:
        bytes(int(p, 16) for p in parts)
    except ValueError as exc:
        raise ValueError("Fingerprint contains non-hex characters") from exc
    return ":".join(parts)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("fingerprint", help="SHA-256 certificate fingerprint from keytool")
    parser.add_argument("--output", default=".well-known/assetlinks.json")
    args = parser.parse_args()
    fingerprint = normalize_fingerprint(args.fingerprint)
    payload = [{
        "relation": ["delegate_permission/common.handle_all_urls"],
        "target": {
            "namespace": "android_app",
            "package_name": PACKAGE_ID,
            "sha256_cert_fingerprints": [fingerprint],
        },
    }]
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {output}")
    print(f"Package: {PACKAGE_ID}")
    print(f"Fingerprint: {fingerprint}")


if __name__ == "__main__":
    main()
