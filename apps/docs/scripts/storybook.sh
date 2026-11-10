#!/bin/sh
cd "$(dirname "$0")/.." || exit 1
mkdir -p build-logs
(cd ../../packages/core && bun run storybook:build:all > ../../apps/docs/build-logs/storybook.log 2>&1) || {
  cat build-logs/storybook.log
  exit 1
}
rm -rf static/storybook
cp -R ../../packages/core/dist/storybook static/storybook
