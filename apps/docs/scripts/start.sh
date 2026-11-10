#!/bin/sh
cd "$(dirname "$0")/.." || exit 1
bun run storybook || exit 1
bun run props >/dev/null
bun run examples >/dev/null || exit 1
bun run pages >/dev/null
docusaurus start --host 127.0.0.1 --port 3220 --no-open
