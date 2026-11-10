import { describe, expect, it } from "vitest"
import { eventsOf, needsHistory, type Prior } from "./Events.ts"
import type { TaskRun } from "./Moon.ts"

const task = (app: string, status: TaskRun["status"], cached: boolean): TaskRun => ({
  app,
  task: "check",
  status,
  cached,
  durationMs: 1000
})

const failure = (app: string, test: string): Prior => ({
  kind: "test_failure",
  app,
  task: "check",
  project: "server",
  file: "a.test.ts",
  test,
  how: ""
})

const quarantine = [{ app: "habits", file: "a.test.ts", test: "q", since: "2026-10-30", reason: "flaky" }]

const tests = [
  {
    app: "habits",
    task: "check",
    suite: "server",
    tests: [
      { file: "a.test.ts", test: "ok", state: "passed" as const, flaky: false },
      { file: "a.test.ts", test: "bad", state: "failed" as const, flaky: false, error: "boom" },
      { file: "a.test.ts", test: "bad, no message", state: "failed" as const, flaky: false },
      { file: "a.test.ts", test: "wobbly", state: "passed" as const, flaky: true },
      { file: "a.test.ts", test: "q", state: "skipped" as const, flaky: false },
      { file: "a.test.ts", test: "just skipped", state: "skipped" as const, flaky: false }
    ]
  }
]

describe("eventsOf", () => {
  it("sends each task with its status, cache hit and duration", () => {
    expect(eventsOf({ tasks: [task("habits", "passed", true)], tests: [], quarantine: [] }, [])).toEqual([
      {
        kind: "task",
        body: "habits:check passed (cached)",
        attributes: { app: "habits", task: "check", status: "passed", cached: "true", duration_ms: 1000 }
      }
    ])
  })

  it("sends failed tests, retried passes as flakes, and skipped quarantined tests", () => {
    const events = eventsOf({ tasks: [], tests, quarantine }, [])
    expect(
      events.map((event) => [
        event.kind,
        event.attributes["test"],
        event.attributes["error"] ?? event.attributes["how"]
      ])
    ).toEqual([
      ["test_failure", "bad", "boom"],
      ["test_failure", "bad, no message", ""],
      ["flake", "wobbly", "retry"],
      ["quarantined", "q", undefined]
    ])
    expect(events.at(-1)?.body).toBe("habits [server] quarantined: q")
  })

  it("calls a failure on this commit a flake once the task runs again uncached and passes", () => {
    const prior = [failure("habits", "bad"), failure("habits", "bad"), failure("wish-farm", "other")]
    const events = eventsOf(
      { tasks: [task("habits", "passed", false), task("wish-farm", "passed", true)], tests: [], quarantine: [] },
      prior
    )
    expect(events.filter((event) => event.kind === "flake")).toEqual([
      {
        kind: "flake",
        body: "habits:check [server] flaked (rerun): bad",
        attributes: { app: "habits", task: "check", project: "server", file: "a.test.ts", test: "bad", how: "rerun" }
      }
    ])
  })

  it("doesn't report the same rerun flake twice, or clear a failure from a failed run", () => {
    const prior = [failure("habits", "bad"), { ...failure("habits", "bad"), kind: "flake", how: "rerun" }]
    expect(
      eventsOf({ tasks: [task("habits", "passed", false)], tests: [], quarantine: [] }, prior).map((e) => e.kind)
    ).toEqual(["task"])
    expect(
      eventsOf({ tasks: [task("habits", "failed", false)], tests: [], quarantine: [] }, [failure("habits", "bad")]).map(
        (e) => e.kind
      )
    ).toEqual(["task"])
  })
})

describe("needsHistory", () => {
  it("asks for earlier failures only when a task ran and passed", () => {
    expect(needsHistory([task("a", "passed", false)])).toBe(true)
    expect(needsHistory([task("a", "passed", true), task("b", "failed", false)])).toBe(false)
  })
})
