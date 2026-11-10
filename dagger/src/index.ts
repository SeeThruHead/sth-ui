import { dag, Container, Directory, object, func } from "@dagger.io/dagger"

const chromeSandboxNeedsNamespacesSeccompBlocks = { insecureRootCapabilities: true }

const browserTasks = [
  "core:test-components",
  "charts:test-components",
  "hooks:test-components",
  "dates:test-components",
  "code-highlight:test-components",
  "form:test-components",
  "schedule:test-components",
  "data-table:test-components",
  "tiptap:test-components"
]

const logicTasks = [
  "core:test-logic",
  "charts:test-logic",
  "hooks:test-logic",
  "dates:test-logic",
  "code-highlight:test-logic",
  "form:test-logic",
  "schedule:test-logic",
  "data-table:test-logic",
  "tiptap:test-logic",
  "icons:test",
  "lint:test",
  "testing:test",
  "release:test"
]

const installed = (source: Directory): Container =>
  dag
    .container()
    .from("oven/bun:1.4.3")
    .withDirectory("/repo", source, {
      exclude: [
        "**/node_modules",
        "**/.data*",
        "**/.env*",
        "**/dist",
        "**/coverage",
        "packages/*/lib",
        ".publish",
        "dagger/sdk",
        ".moon/cache"
      ]
    })
    .withWorkdir("/repo")
    .withEnvVariable("CI", "true")
    .withExec(["sh", "-c", "apt-get update -qq && apt-get install -y -qq --no-install-recommends git ca-certificates"])
    .withExec(["git", "config", "--global", "--add", "safe.directory", "/repo"])
    .withExec(["bun", "install", "--frozen-lockfile", "--ignore-scripts"])
    .withExec(["bun", "run", "patch"])

@object()
export class SthUiCi {
  @func()
  async check(source: Directory): Promise<string> {
    return installed(source)
      .withExec([
        "sh",
        "-c",
        "for app in apps/* packages/*; do if grep -q '\"browsers:install\"' $app/package.json; then (cd $app && bun run browsers:install); fi; done"
      ])
      .withExec(["chown", "-R", "bun:bun", "/repo"])
      .withUser("bun")
      .withExec(["git", "config", "--global", "--add", "safe.directory", "/repo"])
      .withExec(["bun", "run", "moon", "run", ":typecheck", ":lint", ":format", ":build", "--concurrency", "4"])
      .withExec(["bun", "run", "moon", "run", ...logicTasks, "--concurrency", "4"])
      .withExec(
        ["bun", "run", "moon", "run", ...browserTasks, "--concurrency", "1"],
        chromeSandboxNeedsNamespacesSeccompBlocks
      )
      .stdout()
  }
}
