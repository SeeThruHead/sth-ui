import { mkdirSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
import { Option } from "effect"
import type { Reporter, TestCase, TestModule } from "vitest/node"
import { firstLine, type TestRecord, type TestReport } from "./TestReport.ts"
import { toJson } from "./json.ts"

type Errors = ReadonlyArray<{ readonly message: string }>

const errorOf = (errors: Errors) => ({ error: firstLine(errors.map((error) => error.message).join("\n")) })

const states = { passed: "passed", failed: "failed", skipped: "skipped", pending: "skipped" } as const

const recordOf = (file: string, test: TestCase): TestRecord => {
  const result = test.result()
  return {
    file,
    test: test.fullName,
    state: states[result.state],
    flaky: Option.fromUndefinedOr(test.diagnostic()).pipe(Option.exists((diagnostic) => diagnostic.flaky)),
    ...(result.state === "failed" ? errorOf(result.errors) : {})
  }
}

const moduleFailure = (module: TestModule): ReadonlyArray<TestRecord> =>
  module.state() === "failed" && module.errors().length > 0
    ? [{ file: module.relativeModuleId, test: "(file)", state: "failed", flaky: false, ...errorOf(module.errors()) }]
    : []

export const recordsOf = (modules: ReadonlyArray<TestModule>): ReadonlyArray<TestRecord> =>
  modules.flatMap((module) => [
    ...moduleFailure(module),
    ...[...module.children.allTests()].map((test) => recordOf(module.relativeModuleId, test))
  ])

export const ciReporter = (path: string, about: Omit<TestReport, "tests">): Reporter => ({
  onTestRunEnd: (modules) => {
    const report: TestReport = { ...about, tests: recordsOf(modules) }
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, toJson(report))
  }
})
