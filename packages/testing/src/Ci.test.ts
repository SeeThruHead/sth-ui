import { describe, expect, it } from "vitest"
import { playwrightReporters, readQuarantine, withCi } from "./Ci.ts"

const config = { test: { name: "pure", include: ["src/**/*.test.ts"] } }
const listed = () => [{ app: "wish-farm", file: "src/a.test.ts", test: "a > b", since: "2026-10-30", reason: "flaky" }]
const none = () => []

describe("withCi", () => {
  it("leaves a local run alone", () => {
    expect(withCi(config, {}, listed)).toBe(config)
  })

  it("retries twice in CI", () => {
    expect(withCi(config, { CI: "true" }, none).test).toEqual({ ...config.test, retry: 2 })
  })

  it("skips the app's quarantined tests", () => {
    const test = withCi(config, { CI: "true", MOON_PROJECT_ID: "wish-farm" }, listed).test
    expect(test?.testNamePattern).toEqual(/^(?!(?:a > b)$)/)
    expect(withCi(config, { CI: "true", MOON_PROJECT_ID: "habits" }, listed).test?.testNamePattern).toBeUndefined()
  })

  it("writes a report per app, task and suite when the reports folder is set", () => {
    const test = withCi(
      config,
      { CI: "true", CI_REPORTS: "/reports", MOON_PROJECT_ID: "wish-farm", MOON_TASK_ID: "check" },
      none
    ).test
    expect(test?.reporters).toEqual(["default", expect.objectContaining({ onTestRunEnd: expect.any(Function) })])
  })

  it("keeps the reporters a suite already has", () => {
    const reports = { CI: "true", CI_REPORTS: "/r" }
    expect(withCi({ test: { reporters: ["dot", "json"] } }, reports, none).test?.reporters).toHaveLength(3)
    expect(withCi({ test: { reporters: "dot" } }, reports, none).test?.reporters).toEqual([
      "dot",
      expect.objectContaining({ onTestRunEnd: expect.any(Function) })
    ])
  })

  it("names the suite from a labelled project name or falls back to test", () => {
    expect(
      withCi({ test: { name: { label: "server", color: "red" } } }, { CI: "true", CI_REPORTS: "/r" }, none).test
        ?.reporters
    ).toHaveLength(2)
    expect(withCi({}, { CI: "true" }, none).test).toEqual({ retry: 2 })
  })

  it("reads the repo's quarantine list", () => {
    expect(Array.isArray(readQuarantine())).toBe(true)
    expect(readQuarantine(new URL("../fixtures/quarantine.json", import.meta.url))).toHaveLength(1)
  })

  it("reads the environment it runs in", () => {
    expect(withCi(config)).toBeDefined()
  })
})

describe("playwrightReporters", () => {
  it("lists tests, and writes a JSON report per app in CI", () => {
    expect(playwrightReporters({})).toEqual([["list"]])
    expect(playwrightReporters({ CI_REPORTS: "/reports", MOON_PROJECT_ID: "habits" })).toEqual([
      ["list"],
      ["json", { outputFile: "/reports/playwright/habits.json" }]
    ])
    expect(playwrightReporters({ CI_REPORTS: "/reports" })).toContainEqual([
      "json",
      { outputFile: "/reports/playwright/e2e.json" }
    ])
    expect(playwrightReporters()).toBeDefined()
  })
})
