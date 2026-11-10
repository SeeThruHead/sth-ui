import { isQuarantined, quarantinedIn, type QuarantineList } from "../Quarantine.ts"
import type { TestRecord, TestReport } from "../TestReport.ts"
import type { TaskRun } from "./Moon.ts"

export type Kind = "task" | "test_failure" | "flake" | "quarantined"

export type Event = {
  readonly kind: Kind
  readonly body: string
  readonly attributes: Readonly<Record<string, string | number>>
}

type Located = {
  readonly app: string
  readonly task: string
  readonly project: string
  readonly file: string
  readonly test: string
}

export type Prior = Located & { readonly kind: string; readonly how: string }

export type Collected = {
  readonly tasks: ReadonlyArray<TaskRun>
  readonly tests: ReadonlyArray<TestReport>
  readonly quarantine: QuarantineList
}

const taskEvent = (task: TaskRun): Event => ({
  kind: "task",
  body: `${task.app}:${task.task} ${task.status}${task.cached ? " (cached)" : ""}`,
  attributes: {
    app: task.app,
    task: task.task,
    status: task.status,
    cached: String(task.cached),
    duration_ms: task.durationMs
  }
})

type Found = { readonly at: Located; readonly record: TestRecord }

const testsWhere = (
  reports: ReadonlyArray<TestReport>,
  keep: (report: TestReport, test: TestRecord) => boolean
): ReadonlyArray<Found> =>
  reports.flatMap((report) =>
    report.tests
      .filter((test) => keep(report, test))
      .map((record) => ({
        at: {
          app: report.app,
          task: report.task,
          project: record.project ?? report.suite,
          file: record.file,
          test: record.test
        },
        record
      }))
  )

const where = (at: Located): string => `${at.app}:${at.task} [${at.project}]`

const failureEvent = ({ at, record }: Found): Event => ({
  kind: "test_failure",
  body: `${where(at)} failed: ${at.test}`,
  attributes: { ...at, error: record.error ?? "" }
})

const flakeEvent = (how: "retry" | "rerun", at: Located): Event => ({
  kind: "flake",
  body: `${where(at)} flaked (${how}): ${at.test}`,
  attributes: { ...at, how }
})

const quarantinedEvent = ({ at }: Found): Event => ({
  kind: "quarantined",
  body: `${at.app} [${at.project}] quarantined: ${at.test}`,
  attributes: { app: at.app, project: at.project, file: at.file, test: at.test }
})

const located = (prior: Prior): Located => ({
  app: prior.app,
  task: prior.task,
  project: prior.project,
  file: prior.file,
  test: prior.test
})

const key = (prior: Prior): string => JSON.stringify(located(prior))

const rerunFlakes = (tasks: ReadonlyArray<TaskRun>, prior: ReadonlyArray<Prior>): ReadonlyArray<Event> => {
  const proven = new Set(
    tasks.filter((task) => !task.cached && task.status === "passed").map((task) => `${task.app}:${task.task}`)
  )
  const reported = new Set(prior.filter((event) => event.kind === "flake" && event.how === "rerun").map(key))
  const failures = prior.filter((event) => event.kind === "test_failure" && proven.has(`${event.app}:${event.task}`))
  const fresh = new Map(failures.filter((event) => !reported.has(key(event))).map((event) => [key(event), event]))
  return [...fresh.values()].map((event) => flakeEvent("rerun", located(event)))
}

export const eventsOf = (collected: Collected, prior: ReadonlyArray<Prior>): ReadonlyArray<Event> => [
  ...collected.tasks.map(taskEvent),
  ...testsWhere(collected.tests, (_, test) => test.state === "failed").map(failureEvent),
  ...testsWhere(collected.tests, (_, test) => test.state === "passed" && test.flaky).map(({ at }) =>
    flakeEvent("retry", at)
  ),
  ...rerunFlakes(collected.tasks, prior),
  ...testsWhere(
    collected.tests,
    (report, test) =>
      test.state === "skipped" && isQuarantined(quarantinedIn(collected.quarantine, report.app), test.file, test.test)
  ).map(quarantinedEvent)
]

export const needsHistory = (tasks: ReadonlyArray<TaskRun>): boolean =>
  tasks.some((task) => !task.cached && task.status === "passed")
