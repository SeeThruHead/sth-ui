import { BunRuntime, BunServices } from "@effect/platform-bun"
import { Effect, FileSystem, Path, Schema } from "effect"
import { Command, Flag } from "effect/cli"
import { ChildProcess, ChildProcessSpawner } from "effect/process"
import {
  canaryVersion,
  combinedManifest,
  distTag,
  Manifest,
  npmrc,
  packageName,
  publishedImports,
  releaseVersion
} from "../src/Manifest.ts"

const order = [
  "icons",
  "core",
  "charts",
  "hooks",
  "dates",
  "code-highlight",
  "form",
  "schedule",
  "data-table",
  "tiptap"
] as const

const prettyJson = Schema.fromJsonString(Schema.Unknown, { space: 2 })

const manifestJson = Schema.fromJsonString(Manifest)

class StepFailed extends Schema.TaggedError<StepFailed, { readonly brand: unique symbol }>()("StepFailed", {
  step: Schema.String,
  exitCode: Schema.Finite
}) {
  override get message(): string {
    return `${this.step} exited with ${this.exitCode}`
  }
}

const run = Effect.fn("publish.run")(function* (
  step: string,
  cwd: string,
  command: string,
  args: ReadonlyArray<string>
) {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner
  const exitCode = yield* spawner.exitCode(
    ChildProcess.make(command, args, { cwd, stdout: "inherit", stderr: "inherit" })
  )
  if (exitCode !== 0) return yield* new StepFailed({ step, exitCode })
})

const rewritable = /(?:\.(?:js|ts|map|md)|NOTICE)$/u

const stagePart = Effect.fn("publish.stage")(function* (root: string, stage: string, folder: string) {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const home = path.join(root, "packages", folder)
  const manifest = yield* Effect.flatMap(
    fs.readFileString(path.join(home, "package.json")),
    Schema.decodeEffect(manifestJson)
  )
  yield* run(`build ${folder}`, home, "bun", ["run", "build"])
  yield* fs.copy(path.join(home, "lib"), path.join(stage, folder, "lib"))
  yield* fs.copy(path.join(home, "src"), path.join(stage, folder, "src"))

  return { folder, manifest }
})

const rewriteImports = Effect.fn("publish.rewrite")(function* (stage: string) {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const files = yield* fs.readDirectory(stage, { recursive: true })
  yield* Effect.forEach(
    files.filter((file) => rewritable.test(file)),
    (file) =>
      Effect.flatMap(fs.readFileString(path.join(stage, file)), (text) =>
        fs.writeFileString(path.join(stage, file), publishedImports(text, order))
      ),
    { concurrency: 16, discard: true }
  )
})

const publishAll = Effect.fn("publish.all")(function* (version: string, registry: string, dryRun: boolean) {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const root = path.join(import.meta.dirname, "../../..")
  const stage = path.join(root, ".publish", packageName)
  const release = { version, registry, repository: "https://github.com/SeeThruHead/sth-ui" }
  yield* fs.remove(stage, { recursive: true, force: true })
  yield* fs.makeDirectory(stage, { recursive: true })
  const parts = yield* Effect.forEach(order, (folder) => stagePart(root, stage, folder))
  const published = yield* Effect.fromResult(combinedManifest(parts, release))
  yield* fs.copyFile(path.join(root, "LICENSE"), path.join(stage, "LICENSE"))
  yield* fs.copyFile(path.join(root, "NOTICE"), path.join(stage, "NOTICE"))
  yield* fs.copyFile(path.join(root, "LLMS.md"), path.join(stage, "LLMS.md"))
  yield* rewriteImports(stage)
  yield* fs.writeFileString(path.join(stage, "package.json"), `${yield* Schema.encodeEffect(prettyJson)(published)}\n`)
  yield* fs.writeFileString(path.join(stage, ".npmrc"), npmrc(release.registry))
  yield* run("publish", stage, "npm", [
    "publish",
    "--access",
    "public",
    "--tag",
    distTag(release.version),
    ...(dryRun ? ["--dry-run"] : [])
  ])
  yield* Effect.logInfo(`${dryRun ? "Packed" : "Published"} ${packageName}@${release.version}`)
})

const registryFlag = Flag.String("registry").pipe(Flag.withDefault("https://registry.npmjs.org/"))

const dryRunFlag = Flag.Boolean("dry-run").pipe(Flag.withDefault(false))

const canary = Command.make(
  "canary",
  {
    date: Flag.String("date").pipe(Flag.withDescription("Commit time in UTC as YYYYMMDDHHmmss")),
    sha: Flag.String("sha").pipe(Flag.withDescription("Commit sha")),
    registry: registryFlag,
    dryRun: dryRunFlag
  },
  ({ date, sha, registry, dryRun }) => publishAll(canaryVersion(date, sha), registry, dryRun)
).pipe(Command.withDescription("Build every part and publish them as a canary of the one sth-ui package"))

const release = Command.make(
  "release",
  {
    tag: Flag.String("tag").pipe(Flag.withDescription("The release tag, like v0.1.0")),
    registry: registryFlag,
    dryRun: dryRunFlag
  },
  Effect.fn("publish.release")(function* ({ tag, registry, dryRun }) {
    const version = yield* Effect.fromResult(releaseVersion(tag))
    yield* publishAll(version, registry, dryRun)
  })
).pipe(
  Command.withDescription(
    "Build every part and publish them as a numbered release of the one sth-ui package, as latest"
  )
)

const publish = Command.make("publish").pipe(Command.withSubcommands([canary, release]))

Command.run(publish, { version: "0.0.0" }).pipe(Effect.provide(BunServices.layer), BunRuntime.runMain)
