import { Array as Arr, Result, Schema } from "effect"

export const Manifest = Schema.Struct({
  name: Schema.String,
  description: Schema.optional(Schema.String),
  license: Schema.optional(Schema.String),
  dependencies: Schema.optional(Schema.Record(Schema.String, Schema.String))
})
export type Manifest = typeof Manifest.Type

export type Release = {
  readonly version: string
  readonly registry: string
  readonly repository: string
}

export type Part = { readonly folder: string; readonly manifest: Manifest }

export class UnpublishedDependency extends Schema.TaggedError<
  UnpublishedDependency,
  { readonly brand: unique symbol }
>()("UnpublishedDependency", {
  from: Schema.String,
  dependency: Schema.String
}) {
  override get message(): string {
    return `${this.from} depends on ${this.dependency} from the workspace, which is not published`
  }
}

export class ConflictingDependency extends Schema.TaggedError<
  ConflictingDependency,
  { readonly brand: unique symbol }
>()("ConflictingDependency", {
  dependency: Schema.String,
  ranges: Schema.Array(Schema.String)
}) {
  override get message(): string {
    return `the packages ask for different versions of ${this.dependency} (${this.ranges.join(", ")}); sth-ui ships them as one package, so they must agree`
  }
}

export const packageName = "@seethruhead/sth-ui"

const entryIn = (folder: string) => ({ types: `./${folder}/lib/*.d.ts`, default: `./${folder}/lib/*.js` })

export const combinedExports = (folders: ReadonlyArray<string>): Readonly<Record<string, unknown>> =>
  Object.fromEntries([
    ["./package.json", "./package.json"],
    ...folders.flatMap((folder) => [
      [`./${folder}/*.ts`, entryIn(folder)],
      [`./${folder}/*.js`, entryIn(folder)],
      [`./${folder}/*`, entryIn(folder)]
    ])
  ])

export class NotAReleaseTag extends Schema.TaggedError<NotAReleaseTag, { readonly brand: unique symbol }>()(
  "NotAReleaseTag",
  { tag: Schema.String }
) {
  override get message(): string {
    return `${this.tag} is not a release tag; a release is tagged like v0.1.0`
  }
}

export const releaseVersion = (tag: string): Result.Result<string, NotAReleaseTag> => {
  const found = /^v(\d+\.\d+\.\d+)$/u.exec(tag)

  return found?.[1] === undefined ? Result.fail(new NotAReleaseTag({ tag })) : Result.succeed(found[1])
}

export const distTag = (version: string): "canary" | "latest" => (version.includes("-canary.") ? "canary" : "latest")

const identifier = (sha: string) => (/^0\d*$/u.test(sha) ? `g${sha}` : sha)

export const canaryVersion = (date: string, sha: string): string =>
  `0.0.0-canary.${date}.${identifier(sha.slice(0, 8))}`

const workspaceName = (folder: string) => `@sth-ui/${folder}`

type Wanted = { readonly from: string; readonly dependency: string; readonly range: string }

const wantedBy = (part: Part): ReadonlyArray<Wanted> =>
  Object.entries(part.manifest.dependencies ?? {}).map(([dependency, range]) => ({
    from: part.manifest.name,
    dependency,
    range
  }))

const external = (
  wanted: ReadonlyArray<Wanted>
): Result.Result<ReadonlyArray<readonly [string, string]>, ConflictingDependency> =>
  Result.all(
    Object.entries(Arr.groupBy(wanted, (entry) => entry.dependency)).map(([dependency, entries]) => {
      const ranges = Arr.dedupe(entries.map((entry) => entry.range))

      return ranges.length === 1
        ? Result.succeed([dependency, entries[0].range] as const)
        : Result.fail(new ConflictingDependency({ dependency, ranges }))
    })
  )

export const combinedManifest = (
  parts: ReadonlyArray<Part>,
  release: Release
): Result.Result<object, UnpublishedDependency | ConflictingDependency> => {
  const folders = parts.map((part) => part.folder)
  const internal = new Set(folders.map(workspaceName))
  const wanted = parts.flatMap(wantedBy)
  const unpublished = wanted.find((entry) => entry.range.startsWith("workspace:") && !internal.has(entry.dependency))
  if (unpublished !== undefined)
    return Result.fail(new UnpublishedDependency({ from: unpublished.from, dependency: unpublished.dependency }))

  return Result.map(external(wanted.filter((entry) => !internal.has(entry.dependency))), (dependencies) => ({
    name: packageName,
    version: release.version,
    description: "Mantine ported to Foldkit and Effect, in one package",
    license: "MIT",
    type: "module",
    repository: { type: "git", url: release.repository },
    exports: combinedExports(folders),
    files: [
      ...folders.flatMap((folder) => [`${folder}/lib`, `${folder}/src`]),
      "!**/*.test.ts",
      "!**/*.stories.ts",
      "LICENSE",
      "NOTICE",
      "LLMS.md"
    ],
    ...(dependencies.length > 0
      ? { dependencies: Object.fromEntries(dependencies.toSorted(([a], [b]) => a.localeCompare(b))) }
      : {}),
    publishConfig: { registry: release.registry, access: "public" }
  }))
}

export const publishedImports = (text: string, folders: ReadonlyArray<string>): string =>
  folders.length === 0
    ? text
    : text.replace(new RegExp(`@sth-ui/(${folders.join("|")})(?=[/"'\`])`, "gu"), `${packageName}/$1`)

export const npmrc = (registry: string): string => `registry=${registry}\n`
