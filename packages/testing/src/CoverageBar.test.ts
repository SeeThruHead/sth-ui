import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it, vi } from "vitest"
import { coverageWarnings, shortfalls, toStderr, warningLines } from "./CoverageBar.ts"

const full = { pct: 100 }

const summary = {
  total: { lines: { pct: 90 }, branches: full, functions: full, statements: full },
  "/repo/packages/core/src/a.ts": { lines: { pct: 90 }, branches: { pct: 75.5 }, functions: full, statements: full },
  "/repo/packages/core/src/b.ts": { lines: full, branches: full, functions: full, statements: full },
  "/repo/packages/core/src/empty.ts": { lines: { pct: "Unknown" }, branches: full, functions: full, statements: full }
}

const folder = join(import.meta.dirname, "../coverage/bar-test")

describe("coverage below the bar", () => {
  it("finds each file and metric under the bar, ignoring the total and unknown figures", () => {
    expect(shortfalls(summary, "/repo")).toEqual([
      { file: "packages/core/src/a.ts", metric: "lines", pct: 90 },
      { file: "packages/core/src/a.ts", metric: "branches", pct: 75.5 }
    ])
  })

  it("warns in plain text, and adds an annotation per file in CI", () => {
    const found = shortfalls(summary, "/repo")
    expect(warningLines("core", found, false)).toEqual([
      "Warning: coverage in core is below the bar in 1 file(s). Tests passed; the run does not fail on coverage.",
      "  packages/core/src/a.ts: lines 90% (bar 100%), branches 75.5% (bar 100%)"
    ])
    expect(warningLines("core", found, true).at(-1)).toBe(
      "::warning file=packages/core/src/a.ts::Coverage below the bar in core: lines 90% (bar 100%), branches 75.5% (bar 100%)"
    )
    expect(warningLines("core", [], true)).toEqual([])
  })

  it("reads the summary once coverage is reported, and stays quiet without one", () => {
    mkdirSync(folder, { recursive: true })
    writeFileSync(join(folder, "coverage-summary.json"), JSON.stringify(summary))
    const written = vi.fn<(text: string) => void>()
    coverageWarnings("core", folder, { CI: "true" }, written).onFinishedReportCoverage()
    expect(written).toHaveBeenCalledWith(expect.stringContaining("::warning file="))
    const quiet = vi.fn<(text: string) => void>()
    coverageWarnings("core", join(folder, "missing"), {}, quiet).onFinishedReportCoverage()
    expect(quiet).not.toHaveBeenCalled()
    expect(coverageWarnings("core", join(folder, "missing")).onFinishedReportCoverage()).toBeUndefined()
    expect(toStderr("")).toBeUndefined()
  })
})
