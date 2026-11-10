# sth-ui

Mantine, ported to Foldkit and Effect: the same components with the same configurability (a theme object, the
Styles API on every named part, per-component defaults, slot ordering), so apps share components and differ only
by theme. Built on `@foldkit/ui`'s accessible primitives where one exists. Mantine's MIT notice is in
`NOTICE`. Read `docs/architecture.md` for how theming and the Styles API work and why.

| Path | What |
| --- | --- |
| `packages/core` | `@sth-ui/core`: the theme, the Styles API and every Mantine core component |
| `packages/lint`, `packages/testing` | the house lint rules (and the AI attribution hook) and shared vitest suites |
| `LLMS.md` | the guide a model reads to use sth-ui in an app, shipped in every published package; keep it in step when a usage pattern changes |
| `apps/docs` | the Docusaurus site: a page per component with live examples (the built Storybook in an iframe), props generated from source, and a status page for every component not built yet |

## Commands

- Each command is a package script; moon wraps them. `bun run moon run core:check --concurrency 1` runs a
  project's typecheck, lint, format check and tests (100% coverage), and is CI's job. On a laptop someone is
  using, don't run `core:check` or the whole component suite: run only the story files you changed
  (`nice -n 10 bun run test:components <path> --coverage.enabled=false` in `packages/core`), plus typecheck, lint
  and format, one at a time with `--concurrency 1`. The pre-push hook runs only the logic tests; CI runs the full
  component suite, the coverage gate and the docs build (`docs:check`). A machine with headroom can run
  `core:check` and the full suite.
- Browser tests run in the installed Google Chrome with its sandbox on (`channel: "chrome"`,
  `chromiumSandbox: true`), never Playwright's bundled Chromium; CI installs it with `playwright install chrome` and
  runs them in their own step. Where only a system Chromium is installed, set
  `CHROME_PATH=/usr/bin/chromium` and the tests launch that binary instead, still sandboxed.
- If the component tests stop with "Failed to connect to the browser session", headless Chrome is stuck on
  macOS's pasteboard service, not on a test: `killall pboard` (launchd restarts it) and run again.
- Storybook: `bun run storybook` in `packages/core` (port 6120).
- Docs: `bun run start` in `apps/docs` (port 3220) builds Storybook, props and status pages, then serves the site.
  `bun run build` is what CI checks (broken links fail it). A component's page replaces its generated status
  page: write the MDX without `generated: true`.
- Tickets: `tk ls` reads `.tickets/`, which is kept out of git; the docs build reads it when it is there, to give
  unbuilt components a status page.
- Releases: sth-ui is published as one package, `@seethruhead/sth-ui`, with each workspace package as a folder (`@seethruhead/sth-ui/core/...`, `@seethruhead/sth-ui/tiptap/...`), like `effect`, so an app can only ever have one version of it. The release tool rewrites the `@sth-ui/<part>/` imports between parts to `@seethruhead/sth-ui/<part>/` in the published copy, and refuses a release when parts ask for different versions of an outside dependency. Apps install it from npm (`bun add @seethruhead/sth-ui`). Push a tag like `v0.2.0` and the release workflow (`.github/workflows/release.yml`) checks everything and publishes that version to npm as `latest`, through npm's trusted publishing, with no stored token. `bun run publish:release --tag v0.2.0 --dry-run` in `packages/release` builds and packs a release without publishing it.

## What the linter enforces

The house rules (`packages/lint`): no loops, `let`, mutation, casts, comments, nested ifs, multi-line logic;
deterministic time and randomness; `Effect.run*` only at entry points and `tools/`.

## What reviewers check instead

- Every component follows Mantine's API: same prop names and defaults, same named parts (`classNames`,
  `styles`, `vars`), same CSS variables (`--sth-*` for `--mantine-*`), same data attributes.
- Components find things by role and accessible name in stories; every story has a play function that asserts
  what a person sees.
- Stories the docs embed never click or type: their play function only checks what is on screen. Interaction
  gets its own story (`Clicking`), or the docs page shows the result of the test instead of the component.
- Stories size their stage with a maximum width (`maw`), not a fixed one, so the docs page (about 860px wide) and
  phones never clip them; tests run at 1440 and still measure the full size.
- No component owns global CSS; theme values reach components only through CSS variables.
