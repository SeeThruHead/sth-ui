import { Schema } from "effect"

const Duration = Schema.Struct({ secs: Schema.Finite, nanos: Schema.Finite })

const Action = Schema.Struct({
  status: Schema.String,
  duration: Schema.optionalKey(Schema.NullOr(Duration)),
  node: Schema.Struct({
    params: Schema.optionalKey(Schema.Struct({ target: Schema.optionalKey(Schema.String) }))
  })
})

export const RunReport = Schema.Struct({ actions: Schema.Array(Action) })
export type RunReport = typeof RunReport.Type
type Action = typeof Action.Type

export type TaskStatus = "passed" | "failed" | "skipped"

export type TaskRun = {
  readonly app: string
  readonly task: string
  readonly status: TaskStatus
  readonly cached: boolean
  readonly durationMs: number
}

const cachedStatuses = new Set(["cached", "cached-from-remote"])

const statusOf = (status: string): TaskStatus => {
  if (status === "passed" || cachedStatuses.has(status)) return "passed"
  if (status === "skipped") return "skipped"
  return "failed"
}

const millis = (duration: Action["duration"]): number =>
  duration ? Math.round(duration.secs * 1000 + duration.nanos / 1_000_000) : 0

const taskOf = (action: Action): ReadonlyArray<TaskRun> => {
  const target = action.node.params?.target
  if (!target) return []
  const colon = target.indexOf(":")
  const app = target.slice(0, colon)
  const task = target.slice(colon + 1)
  return [
    {
      app,
      task,
      status: statusOf(action.status),
      cached: cachedStatuses.has(action.status),
      durationMs: millis(action.duration)
    }
  ]
}

export const tasksOf = (report: RunReport): ReadonlyArray<TaskRun> => report.actions.flatMap(taskOf)
