import { Schema } from "effect"
import { firstLine, type TestRecord, type TestReport } from "../TestReport.ts"

const Result = Schema.Struct({
  error: Schema.optionalKey(Schema.Struct({ message: Schema.optionalKey(Schema.String) }))
})

const Spec = Schema.Struct({
  title: Schema.String,
  file: Schema.String,
  tests: Schema.Array(
    Schema.Struct({ status: Schema.String, projectName: Schema.String, results: Schema.Array(Result) })
  )
})
type Spec = typeof Spec.Type

type Suite = {
  readonly title: string
  readonly specs?: ReadonlyArray<Spec>
  readonly suites?: ReadonlyArray<Suite>
}

const Suite: Schema.Codec<Suite> = Schema.Struct({
  title: Schema.String,
  specs: Schema.optionalKey(Schema.Array(Spec)),
  suites: Schema.optionalKey(Schema.Array(Schema.suspend(() => Suite)))
})

export const PlaywrightReport = Schema.Struct({ suites: Schema.Array(Suite) })
export type PlaywrightReport = typeof PlaywrightReport.Type

type Test = Spec["tests"][number]

const errorOf = (test: Test) => {
  const message = test.results.flatMap((result) => (result.error?.message ? [result.error.message] : [])).at(-1)
  return message ? { error: firstLine(message) } : {}
}

const recordOf = (titles: ReadonlyArray<string>, spec: Spec, test: Test): TestRecord => {
  const name = [...titles, spec.title].join(" > ")
  const at = { file: spec.file, test: name, project: test.projectName }
  if (test.status === "unexpected") return { ...at, state: "failed", flaky: false, ...errorOf(test) }
  if (test.status === "skipped") return { ...at, state: "skipped", flaky: false }
  return { ...at, state: "passed", flaky: test.status === "flaky" }
}

const recordsIn = (suite: Suite, titles: ReadonlyArray<string>): ReadonlyArray<TestRecord> => [
  ...(suite.specs ?? []).flatMap((spec) => spec.tests.map((test) => recordOf(titles, spec, test))),
  ...(suite.suites ?? []).flatMap((inner) => recordsIn(inner, [...titles, inner.title]))
]

export const playwrightTests = (app: string, report: PlaywrightReport): TestReport => ({
  app,
  task: "e2e",
  suite: "e2e",
  tests: report.suites.flatMap((file) => recordsIn(file, []))
})
