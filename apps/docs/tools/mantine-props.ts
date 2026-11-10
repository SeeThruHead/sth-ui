import { BunRuntime, BunServices } from "@effect/platform-bun"
import { Config, Effect, FileSystem, Path, Schema } from "effect"

const prettyJson = Schema.fromJsonString(Schema.Unknown, { space: 2 })

export type MantineProp = { readonly description: string; readonly default?: string }

const interfaceBlocks = (source: string): ReadonlyArray<readonly [string, string]> =>
  [...source.matchAll(/^export interface (\w+)Props\b[^{]*\{\n([\s\S]*?)^\}/gm)].map(
    (match) => [match[1] ?? "", match[2] ?? ""] as const
  )

const cleaned = (comment: string): string =>
  comment
    .split("\n")
    .map((line) => line.replace(/^\s*\*\s?/, "").trim())
    .filter((line) => line !== "")
    .join(" ")

export const propsOf = (body: string): Readonly<Record<string, MantineProp>> =>
  Object.fromEntries(
    [...body.matchAll(/\/\*\*([\s\S]*?)\*\/\s*\n\s*'?([\w-]+)'?\??:/g)].map((match) => {
      const text = cleaned(match[1] ?? "")
      const fallback = /@default\s+(.+)$/.exec(text)
      const description = text.replace(/\s*@default\s+.+$/, "")

      return [
        match[2] ?? "",
        fallback === null ? { description } : { description, default: (fallback[1] ?? "").trim() }
      ] as const
    })
  )

export const mantinePropsOf = (source: string): Readonly<Record<string, Readonly<Record<string, MantineProp>>>> =>
  Object.fromEntries(interfaceBlocks(source).map(([name, body]) => [name, propsOf(body)] as const))

const isComponentFile = (file: string): boolean => file.endsWith(".tsx") && !/\.(story|test|demo)\.tsx$/.test(file)

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const source = yield* Config.String("MANTINE_SOURCE")
  const folders = [
    path.join(source, "packages/@mantine/core/src/components"),
    path.join(source, "packages/@mantine/dates/src/components")
  ]
  const files = yield* Effect.forEach(folders, (folder) =>
    fs
      .readDirectory(folder, { recursive: true })
      .pipe(Effect.map((names) => names.filter(isComponentFile).map((name) => path.join(folder, name))))
  )
  const parsed = yield* Effect.forEach(files.flat(), (file) => Effect.map(fs.readFileString(file), mantinePropsOf))
  const merged = Object.assign({}, ...parsed)
  const out = path.join(import.meta.dirname, "../data/mantine-props.json")
  const json = yield* Schema.encodeEffect(prettyJson)(merged)
  yield* fs.writeFileString(out, `${json}\n`)
  yield* Effect.logInfo(`${Object.keys(merged).length} prop interfaces from Mantine to ${out}`)
})

program.pipe(Effect.provide(BunServices.layer), BunRuntime.runMain)
