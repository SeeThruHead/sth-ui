import { describe, expect, it } from "vitest"
import { logsRequest } from "./Otlp.ts"

const context = {
  repo: "sth/sth-ui",
  workflow: "suite",
  job: "check",
  run_id: "41",
  run_attempt: "1",
  sha: "abc123",
  ref: "refs/heads/main",
  box: "ci"
}

describe("logsRequest", () => {
  it("puts only service.name on the resource and everything else on each record", () => {
    const request = logsRequest(
      [
        { kind: "task", body: "a:b passed", attributes: { app: "a", duration_ms: 12 } },
        { kind: "flake", body: "a:b flaked", attributes: { app: "a" } }
      ],
      context,
      1_700_000_000_000_000_000n
    )
    const [resource] = request.resourceLogs
    expect(resource?.resource.attributes).toEqual([{ key: "service.name", value: { stringValue: "ci" } }])
    const [task, flake] = resource?.scopeLogs[0]?.logRecords ?? []
    expect(task).toMatchObject({
      timeUnixNano: "1700000000000000000",
      severityText: "INFO",
      body: { stringValue: "a:b passed" }
    })
    expect(task?.attributes).toContainEqual({ key: "kind", value: { stringValue: "task" } })
    expect(task?.attributes).toContainEqual({ key: "sha", value: { stringValue: "abc123" } })
    expect(task?.attributes).toContainEqual({ key: "duration_ms", value: { doubleValue: 12 } })
    expect(flake?.severityText).toBe("WARN")
    expect(flake?.timeUnixNano).toBe("1700000000000000001")
  })
})
