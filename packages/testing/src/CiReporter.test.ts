import { mkdtempSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { createVitest } from "vitest/node"
import { ciReporter } from "./CiReporter.ts"
import { Schema } from "effect"
import { TestReport } from "./TestReport.ts"

describe("ciReporter", () => {
  it("writes every test's outcome, flaky passes and files that failed to load", async () => {
    const path = join(mkdtempSync(join(tmpdir(), "ci-reporter-")), "vitest", "app.test.pure.json")
    const vitest = await createVitest("test", {
      root: new URL("../fixtures/run", import.meta.url).pathname,
      config: false,
      watch: false,
      include: ["*.check.ts"],
      retry: 2,
      coverage: { enabled: false },
      reporters: [ciReporter(path, { app: "app", task: "test", suite: "pure" })]
    })
    await vitest.start()
    await vitest.close()
    const report = Schema.decodeSync(Schema.fromJsonString(TestReport))(readFileSync(path, "utf8"))
    expect(report.app).toBe("app")
    expect(report.task).toBe("test")
    expect(report.suite).toBe("pure")
    expect(report.tests).toEqual(
      expect.arrayContaining([
        { file: "broken.check.ts", test: "(file)", state: "failed", flaky: false, error: "cannot load this file" },
        { file: "outcomes.check.ts", test: "outcomes > passes", state: "passed", flaky: false },
        {
          file: "outcomes.check.ts",
          test: "outcomes > fails",
          state: "failed",
          flaky: false,
          error: expect.stringContaining("expected 'first line")
        },
        { file: "outcomes.check.ts", test: "outcomes > passes on a retry", state: "passed", flaky: true },
        { file: "outcomes.check.ts", test: "outcomes > is skipped", state: "skipped", flaky: false }
      ])
    )
    expect(report.tests).toHaveLength(5)
  }, 60_000)
})
