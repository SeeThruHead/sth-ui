import { existsSync, readFileSync } from "node:fs"
import { join, relative, resolve } from "node:path"
import { env, stderr } from "node:process"
import { fileURLToPath } from "node:url"
import { Array as Arr, Option, Predicate, Schema } from "effect"
import type { Reporter } from "vitest/node"

export const coverageBar = { lines: 100, branches: 100, functions: 100, statements: 100 } as const

export type Metric = keyof typeof coverageBar

const metrics: ReadonlyArray<Metric> = ["lines", "branches", "functions", "statements"]

const Percent = Schema.Struct({ pct: Schema.Union([Schema.Finite, Schema.String]) })

const FileSummary = Schema.Struct({ lines: Percent, branches: Percent, functions: Percent, statements: Percent })

export const CoverageSummary = Schema.Record(Schema.String, FileSummary)

export type CoverageSummary = typeof CoverageSummary.Type

export type Shortfall = { readonly file: string; readonly metric: Metric; readonly pct: number }

const repoRoot = fileURLToPath(new URL("../../..", import.meta.url))

const below = (file: string, summary: typeof FileSummary.Type): ReadonlyArray<Shortfall> =>
  metrics.flatMap((metric) => {
    const pct = summary[metric].pct

    return Predicate.isNumber(pct) && pct < coverageBar[metric] ? [{ file, metric, pct }] : []
  })

export const shortfalls = (summary: CoverageSummary, root: string = repoRoot): ReadonlyArray<Shortfall> =>
  Object.entries(summary)
    .filter(([file]) => file !== "total")
    .flatMap(([file, fileSummary]) => below(relative(root, file), fileSummary))

const described = (found: ReadonlyArray<Shortfall>): string =>
  found.map(({ metric, pct }) => `${metric} ${pct}% (bar ${coverageBar[metric]}%)`).join(", ")

export const warningLines = (suite: string, found: ReadonlyArray<Shortfall>, ci: boolean): ReadonlyArray<string> => {
  if (found.length === 0) return []
  const byFile = Object.entries(Arr.groupBy(found, (shortfall) => shortfall.file))
  const plain = byFile.map(([file, missed]) => `  ${file}: ${described(missed)}`)
  const annotations = byFile.map(
    ([file, missed]) => `::warning file=${file}::Coverage below the bar in ${suite}: ${described(missed)}`
  )

  return [
    `Warning: coverage in ${suite} is below the bar in ${byFile.length} file(s). Tests passed; the run does not fail on coverage.`,
    ...plain,
    ...(ci ? annotations : [])
  ]
}

const readSummary = (reportsDirectory: string): Option.Option<CoverageSummary> => {
  const file = join(resolve(reportsDirectory), "coverage-summary.json")
  if (!existsSync(file)) return Option.none()

  return Schema.decodeOption(Schema.fromJsonString(CoverageSummary))(readFileSync(file, "utf8"))
}

export const toStderr = (text: string): void => {
  stderr.write(text)
}

export type CoverageWarnings = Reporter & { readonly onFinishedReportCoverage: () => void }

export const coverageWarnings = (
  suite: string,
  reportsDirectory: string,
  environment: Readonly<Record<string, string | undefined>> = env,
  write: (text: string) => void = toStderr
): CoverageWarnings => ({
  onFinishedReportCoverage: () => {
    const lines = Option.match(readSummary(reportsDirectory), {
      onNone: () => [],
      onSome: (summary) => warningLines(suite, shortfalls(summary), Predicate.isString(environment["CI"]))
    })
    if (lines.length === 0) return
    write(`\n${lines.join("\n")}\n`)
  }
})
