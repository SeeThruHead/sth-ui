import { readFileSync } from "node:fs"
import { Schema } from "effect"
import { describe, expect, it } from "vitest"
import { RunReport, tasksOf } from "./Moon.ts"

const report = Schema.decodeSync(Schema.fromJsonString(RunReport))(
  readFileSync(new URL("../../fixtures/reports/check/moon/check.json", import.meta.url), "utf8")
)

const run = (status: string) => ({ status, node: { params: { target: "a:b" } } })

describe("tasksOf", () => {
  it("reads each task's status, whether it came from the cache, and how long it took", () => {
    expect(tasksOf(report)).toEqual([
      { app: "kernel", task: "test", status: "passed", cached: true, durationMs: 23 },
      { app: "wish-farm", task: "check", status: "passed", cached: false, durationMs: 61500 },
      { app: "habits", task: "check", status: "failed", cached: false, durationMs: 12000 },
      { app: "suite", task: "check", status: "skipped", cached: false, durationMs: 0 }
    ])
  })

  it("counts a local cache hit, and anything aborted counts as failed", () => {
    expect(tasksOf({ actions: [run("cached"), run("aborted")] }).map((task) => [task.status, task.cached])).toEqual([
      ["passed", true],
      ["failed", false]
    ])
  })

  it("ignores a task action without a target", () => {
    expect(tasksOf({ actions: [{ status: "passed", node: { params: {} } }] })).toEqual([])
  })
})
