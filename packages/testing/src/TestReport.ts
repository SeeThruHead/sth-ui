import { Schema } from "effect"

export const TestState = Schema.Literals(["passed", "failed", "skipped"])
export type TestState = typeof TestState.Type

export const TestRecord = Schema.Struct({
  file: Schema.String,
  test: Schema.String,
  state: TestState,
  flaky: Schema.Boolean,
  project: Schema.optionalKey(Schema.String),
  error: Schema.optionalKey(Schema.String)
})
export type TestRecord = typeof TestRecord.Type

export const TestReport = Schema.Struct({
  app: Schema.String,
  task: Schema.String,
  suite: Schema.String,
  tests: Schema.Array(TestRecord)
})
export type TestReport = typeof TestReport.Type

const colours = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g")

export const firstLine = (message: string): string => message.replace(colours, "").split("\n", 1).join("").slice(0, 300)
