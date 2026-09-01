#!/usr/bin/env python3
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REVISION_PATTERN = re.compile(r"const WWZ_PWA_UPDATE_REVISION = '([^']+)';")


def git(*args: str) -> str:
    return subprocess.check_output(['git', *args], cwd=ROOT, text=True, stderr=subprocess.DEVNULL).strip()


def deployable(path: str) -> bool:
    if path == 'sw.js':
        return False
    if path.startswith(('android-app/', '.github/', 'scripts/', 'docs/')):
        return False
    if path.startswith(('assets/', 'downloads/')):
        return True
    return path.endswith(('.html', '.css', '.js', '.json', '.webmanifest', '.xml', '.txt'))


def revision_from(text: str) -> str:
    match = REVISION_PATTERN.search(text)
    return match.group(1) if match else ''


def main() -> int:
    try:
        parent = git('rev-parse', 'HEAD^')
    except Exception:
        print('PWA revision guard: no parent commit available; skipping comparison.')
        return 0

    changed = [line for line in git('diff', '--name-only', parent, 'HEAD').splitlines() if line]
    website_changes = [path for path in changed if deployable(path)]
    if not website_changes:
        print('PWA revision guard: no deployable website content changed.')
        return 0

    if 'sw.js' not in changed:
        print('PWA revision guard failed: website content changed without sw.js.', file=sys.stderr)
        print('Changed website files:', file=sys.stderr)
        for path in website_changes:
            print(f'  - {path}', file=sys.stderr)
        print('Bump WWZ_PWA_UPDATE_REVISION in sw.js in the same commit.', file=sys.stderr)
        return 1

    current = revision_from((ROOT / 'sw.js').read_text(encoding='utf-8'))
    try:
        previous_text = git('show', f'{parent}:sw.js')
    except Exception:
        previous_text = ''
    previous = revision_from(previous_text)

    if not current:
        print('PWA revision guard failed: sw.js has no WWZ_PWA_UPDATE_REVISION.', file=sys.stderr)
        return 1
    if previous and current == previous:
        print(
            f'PWA revision guard failed: WWZ_PWA_UPDATE_REVISION is still {current!r}.',
            file=sys.stderr,
        )
        print('Every deployable website update must use a new revision token.', file=sys.stderr)
        return 1

    print(f'PWA revision guard: {previous or "<none>"} -> {current}')
    print(f'PWA revision guard: {len(website_changes)} deployable website file(s) covered.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
