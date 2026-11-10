import { readFileSync } from "node:fs"
import { Schema } from "effect"
import { describe, expect, it } from "vitest"
import { PlaywrightReport, playwrightTests } from "./Playwright.ts"

const report = Schema.decodeSync(Schema.fromJsonString(PlaywrightReport))(
  readFileSync(new URL("../../fixtures/reports/e2e/playwright/wish-farm.json", import.meta.url), "utf8")
)

describe("playwrightTests", () => {
  it("reads each scenario as a test of the app's e2e task", () => {
    expect(playwrightTests("wish-farm", report)).toEqual({
      app: "wish-farm",
      task: "e2e",
      suite: "e2e",
      tests: [
        {
          file: "plan.feature.spec.js",
          test: "Plan > Shows paydays",
          project: "desktop",
          state: "passed",
          flaky: false
        },
        { file: "plan.feature.spec.js", test: "Plan > Adds a wish", project: "desktop", state: "passed", flaky: true },
        ...["desktop", "iphone"].map((project) => ({
          file: "plan.feature.spec.js",
          test: "Plan > Deletes a wish",
          project,
          state: "failed",
          flaky: false,
          error: "locator not found"
        })),
        { file: "plan.feature.spec.js", test: "Plan > Later", project: "desktop", state: "skipped", flaky: false }
      ]
    })
  })

  it("reports a failure without a message", () => {
    const bare = {
      suites: [
        {
          title: "f",
          suites: [
            {
              title: "s",
              specs: [
                {
                  title: "t",
                  file: "f",
                  tests: [{ status: "unexpected", projectName: "iphone", results: [{}, { error: {} }] }]
                }
              ]
            }
          ]
        }
      ]
    }
    expect(playwrightTests("habits", bare).tests).toEqual([
      { file: "f", test: "s > t", project: "iphone", state: "failed", flaky: false }
    ])
  })
})
