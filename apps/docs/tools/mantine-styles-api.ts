import { BunRuntime, BunServices } from "@effect/platform-bun"
import { Config, Effect, FileSystem, Path, Schema } from "effect"

const prettyJson = Schema.fromJsonString(Schema.Unknown, { space: 2 })

const Modifier = Schema.Struct({
  modifier: Schema.String,
  selector: Schema.Union([Schema.String, Schema.Array(Schema.String)]),
  condition: Schema.optional(Schema.String),
  value: Schema.optional(Schema.String)
})

const StylesApiData = Schema.Struct({
  selectors: Schema.Record(Schema.String, Schema.String),
  modifiers: Schema.optional(Schema.Array(Modifier))
})

const DataModule = Schema.Record(Schema.String, Schema.Unknown)

class ImportFailed extends Schema.TaggedError<ImportFailed, { readonly brand: unique symbol }>()("ImportFailed", {
  file: Schema.String
}) {}

const componentOf = (exportName: string): string => exportName.replace(/StylesApi$/, "")

const dataIn = Effect.fn("mantineStylesApi.dataIn")(function* (file: string) {
  const loaded = yield* Effect.tryPromise({ try: () => import(file), catch: () => new ImportFailed({ file }) })
  const exports = yield* Schema.decodeUnknownEffect(DataModule)(loaded)
  const entries = Object.entries(exports).filter(([name]) => name.endsWith("StylesApi"))

  return yield* Effect.forEach(entries, ([name, data]) =>
    Effect.map(Schema.decodeUnknownEffect(StylesApiData)(data), (decoded) => [componentOf(name), decoded] as const)
  )
})

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const source = yield* Config.String("MANTINE_SOURCE")
  const folder = path.join(source, "packages/@docs/styles-api/src/data")
  const files = (yield* fs.readDirectory(folder)).filter((name) => name.endsWith(".styles-api.ts"))
  const pairs = yield* Effect.forEach(files, (file) => dataIn(path.join(folder, file)))
  const out = path.join(import.meta.dirname, "../data/mantine-styles-api.json")
  const json = yield* Schema.encodeEffect(prettyJson)(Object.fromEntries(pairs.flat()))
  yield* fs.writeFileString(out, `${json}\n`)
  yield* Effect.logInfo(`${pairs.flat().length} components from Mantine to ${out}`)
})

program.pipe(Effect.provide(BunServices.layer), BunRuntime.runMain)
