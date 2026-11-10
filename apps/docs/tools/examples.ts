import { BunRuntime, BunServices } from "@effect/platform-bun"
import { Effect, FileSystem, Path, Schema } from "effect"
import { demosOf, embeddedIn, withPackagePaths } from "./stories.ts"

const prettyJson = Schema.fromJsonString(Schema.Unknown, { space: 2 })

const named = { prop: Schema.String }

const Control = Schema.Union([
  Schema.Struct({
    type: Schema.Literal("select"),
    ...named,
    options: Schema.Array(Schema.String),
    initial: Schema.String,
    library: Schema.optional(Schema.String)
  }),
  Schema.Struct({
    type: Schema.Literals(["color", "string"]),
    ...named,
    initial: Schema.String,
    library: Schema.optional(Schema.String)
  }),
  Schema.Struct({
    type: Schema.Literal("size"),
    ...named,
    initial: Schema.String,
    library: Schema.optional(Schema.String)
  }),
  Schema.Struct({
    type: Schema.Literal("boolean"),
    ...named,
    initial: Schema.Boolean,
    library: Schema.optional(Schema.Boolean)
  }),
  Schema.Struct({
    type: Schema.Literal("number"),
    ...named,
    initial: Schema.Finite,
    library: Schema.optional(Schema.Finite),
    min: Schema.Finite,
    max: Schema.Finite,
    step: Schema.optional(Schema.Finite)
  })
])

const ConfiguratorModule = Schema.Struct({
  configurator: Schema.Struct({ controls: Schema.Array(Control), code: Schema.String })
})

const configuratorOf = Effect.fn("examples.configuratorOf")(function* (file: string, id: string) {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const lines = (yield* fs.readFileString(file)).split("\n")
  const start = lines.findIndex((line) => line.startsWith("export const configurator = defineConfigurator("))
  const specifier = /import \{ defineConfigurator \} from "([^"]+)"/.exec(lines.join("\n"))?.[1] ?? ""
  const helper = specifier.startsWith(".")
    ? path.resolve(path.dirname(file), specifier)
    : path.join(import.meta.dirname, "../../../packages/core/src", specifier.replace("@sth-ui/core/", ""))
  const cache = path.join(import.meta.dirname, "../node_modules/.cache/configurators")
  const module = path.join(cache, `${id}.ts`)
  yield* fs.makeDirectory(cache, { recursive: true })
  yield* fs.writeFileString(
    module,
    [
      `import { defineConfigurator } from "${helper}"`,
      ...lines.slice(start, start + lines.slice(start).indexOf("})") + 1)
    ].join("\n")
  )
  const loaded = yield* Effect.promise(() => import(module))

  return (yield* Schema.decodeUnknownEffect(ConfiguratorModule)(loaded)).configurator
})

class MissingExamples extends Schema.TaggedError<MissingExamples, { readonly brand: unique symbol }>()(
  "MissingExamples",
  {
    stories: Schema.Array(Schema.String)
  }
) {
  override get message(): string {
    return `These embedded examples render no demo module: ${this.stories.join(", ")}`
  }
}

const filesUnder = Effect.fn("examples.filesUnder")(function* (folder: string, suffix: string) {
  const fs = yield* FileSystem.FileSystem
  const names = yield* fs.readDirectory(folder, { recursive: true })

  return names.filter((name) => name.endsWith(suffix)).map((name) => `${folder}/${name}`)
})

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const here = import.meta.dirname
  const homes = ["core", "charts", "hooks", "dates", "code-highlight", "form", "schedule", "data-table", "tiptap"].map(
    (name) => ({
      name,
      src: path.join(here, "../../../packages", name, "src")
    })
  )
  const stories = yield* Effect.forEach(homes, (home) =>
    Effect.map(filesUnder(home.src, ".stories.ts"), (files) => files.map((file) => ({ home, file })))
  )
  const demos = yield* Effect.forEach(stories.flat(), ({ home, file }) =>
    Effect.map(fs.readFileString(file), (source) =>
      demosOf(source).map((demo) => ({
        id: demo.id,
        home,
        configurator: demo.configurator,
        file: path.resolve(path.dirname(file), demo.specifier)
      }))
    )
  )
  const entries = yield* Effect.forEach(demos.flat(), (demo) =>
    Effect.map(fs.readFileString(demo.file), (code) => {
      const packagePath = (specifier: string) =>
        `@sth-ui/${demo.home.name}/${path.relative(demo.home.src, path.resolve(path.dirname(demo.file), specifier))}`

      return [demo.id, withPackagePaths(code, packagePath).trimEnd()] as const
    })
  )
  const examples = Object.fromEntries(entries)
  const configurators = yield* Effect.forEach(
    demos.flat().filter((demo) => demo.configurator),
    (demo) => Effect.map(configuratorOf(demo.file, demo.id), (configurator) => [demo.id, configurator] as const)
  )
  const pages = yield* filesUnder(path.join(here, "../docs"), ".mdx")
  const mdx = yield* Effect.forEach(pages, (file) => fs.readFileString(file))
  const missing = mdx.flatMap(embeddedIn).filter((id) => !Object.hasOwn(examples, id))
  if (missing.length > 0) return yield* new MissingExamples({ stories: missing })
  const out = path.join(here, "../src/examples.json")
  const json = yield* Schema.encodeEffect(prettyJson)(examples)
  yield* fs.writeFileString(out, `${json}\n`)
  const configuratorJson = yield* Schema.encodeEffect(prettyJson)(Object.fromEntries(configurators))
  yield* fs.writeFileString(path.join(here, "../src/configurators.json"), `${configuratorJson}\n`)
  yield* Effect.logInfo(`${Object.keys(examples).length} examples to ${out}`)
})

program.pipe(Effect.provide(BunServices.layer), BunRuntime.runMain)
