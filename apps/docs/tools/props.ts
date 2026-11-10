import { BunRuntime, BunServices } from "@effect/platform-bun"
import { Effect, FileSystem, Path, Schema } from "effect"
import { continues } from "./source.ts"
import { declarationsOf, tablesOf } from "./propsTable.ts"
import type { MantineProps } from "./propsTable.ts"
import { partTypesOf, stylesApiOf } from "./stylesApi.ts"

const prettyJson = Schema.fromJsonString(Schema.Unknown, { space: 2 })

const MantinePropsData = Schema.Record(
  Schema.String,
  Schema.Record(Schema.String, Schema.Struct({ description: Schema.String, default: Schema.optional(Schema.String) }))
)

const typeAt = (lines: ReadonlyArray<string>, start: number): ReadonlyArray<string> => {
  const rest = lines.slice(start + 1)
  const end = rest.findIndex((line) => !continues(line))

  return lines.slice(start, start + 1 + (end === -1 ? rest.length : end))
}

const signatureAt = (lines: ReadonlyArray<string>, start: number): ReadonlyArray<string> => {
  const window = lines.slice(start, start + 8)
  const arrow = window.findIndex((line) => line.includes("=>"))
  if (arrow === -1) return [(lines[start] ?? "").split(" = ")[0] ?? ""]

  return window
    .slice(0, arrow + 1)
    .map((line, index) => (index === arrow ? line.slice(0, line.indexOf("=>") + 2) : line))
}

export const exportsOf = (source: string): string => {
  const lines = source.split("\n")

  return lines
    .flatMap((line, index) => {
      if (line.startsWith("export type ")) return [typeAt(lines, index).join("\n")]
      if (line.startsWith("export const ")) return [signatureAt(lines, index).join("\n")]

      return []
    })
    .join("\n\n")
}

const isSourceFile = (file: string): boolean => file.endsWith(".ts") && !/\.(stories|stylex|test)\.ts$/.test(file)

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const packages = path.join(import.meta.dirname, "../../../packages")
  const homes = [
    { prefix: "components", folder: path.join(packages, "core/src/components") },
    { prefix: "charts", folder: path.join(packages, "charts/src") },
    { prefix: "hooks", folder: path.join(packages, "hooks/src") },
    { prefix: "dates", folder: path.join(packages, "dates/src") },
    { prefix: "code-highlight", folder: path.join(packages, "code-highlight/src") },
    { prefix: "form", folder: path.join(packages, "form/src") },
    { prefix: "schedule", folder: path.join(packages, "schedule/src") },
    { prefix: "data-table", folder: path.join(packages, "data-table/src") },
    { prefix: "tiptap", folder: path.join(packages, "tiptap/src") }
  ]
  const absolute = (file: string) => {
    const home = homes.find((candidate) => file.startsWith(`${candidate.prefix}/`)) ?? homes[0]

    return path.join(home?.folder ?? "", file.slice(`${home?.prefix ?? ""}/`.length))
  }
  const listed = yield* Effect.forEach(homes, (home) =>
    Effect.map(fs.readDirectory(home.folder), (names) =>
      names.filter((name) => !name.includes(".")).map((folder) => ({ home, folder }))
    )
  )
  const allFiles = yield* Effect.forEach(listed.flat(), ({ home, folder }) =>
    fs
      .readDirectory(path.join(home.folder, folder))
      .pipe(Effect.map((names) => names.filter(isSourceFile).map((name) => `${home.prefix}/${folder}/${name}`)))
  )
  const sourcePairs = yield* Effect.forEach(allFiles.flat(), (file) =>
    Effect.map(fs.readFileString(absolute(file)), (source) => [file, source] as const)
  )
  const sources = Object.fromEntries(sourcePairs)
  const stylexPairs = yield* Effect.forEach(Object.keys(sources), (file) =>
    fs.readFileString(absolute(file.replace(/\.ts$/, ".stylex.ts"))).pipe(
      Effect.map((source) => [[file, source] as const]),
      Effect.orElseSucceed(() => [])
    )
  )
  const stylex = Object.fromEntries(stylexPairs.flat())
  const types = Object.entries(sources).flatMap(([file, source]) => partTypesOf(file, source))
  const stylesOut = path.join(import.meta.dirname, "../src/styles-api.json")
  const stylesJson = yield* Schema.encodeEffect(prettyJson)(stylesApiOf(types, sources, stylex))
  yield* fs.writeFileString(stylesOut, `${stylesJson}\n`)
  const mantineJson = yield* fs.readFileString(path.join(import.meta.dirname, "../data/mantine-props.json"))
  const mantine: MantineProps = yield* Schema.decodeEffect(Schema.fromJsonString(MantinePropsData))(mantineJson)
  const commonJson = yield* fs.readFileString(path.join(import.meta.dirname, "../data/props-descriptions.json"))
  const common = yield* Schema.decodeEffect(Schema.fromJsonString(Schema.Record(Schema.String, Schema.String)))(
    commonJson
  )
  const declarations = declarationsOf(Object.values(sources))
  const pairs = Object.entries(sources).map(
    ([file, source]) =>
      [file, { code: exportsOf(source), tables: tablesOf(source, declarations, mantine, common) }] as const
  )
  const out = path.join(import.meta.dirname, "../src/props.json")
  const json = yield* Schema.encodeEffect(prettyJson)(Object.fromEntries(pairs))
  yield* fs.writeFileString(out, `${json}\n`)
  yield* Effect.logInfo(`${pairs.length} components to ${out}`)
})

program.pipe(Effect.provide(BunServices.layer), BunRuntime.runMain)
