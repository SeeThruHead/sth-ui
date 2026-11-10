import { Clock, Console, Effect, FileSystem, Path, Schema } from "effect"
import { QuarantineList } from "../Quarantine.ts"
import { TestReport } from "../TestReport.ts"
import { CiMetrics, CiMetricsError } from "./CiMetrics.ts"
import { eventsOf, needsHistory, type Event } from "./Events.ts"
import { RunReport, tasksOf } from "./Moon.ts"
import { logsRequest, type Context } from "./Otlp.ts"
import { PlaywrightReport, playwrightTests } from "./Playwright.ts"

const unreadable = (detail: string) => new CiMetricsError({ step: "read the reports", detail })

const decodeFile = <S extends Schema.Top & { readonly DecodingServices: never }>(schema: S) => {
  const decode = Schema.decodeUnknownEffect(Schema.fromJsonString(schema))
  return Effect.fn("Report.decodeFile")(function* (path: string) {
    const fs = yield* FileSystem.FileSystem
    const text = yield* fs.readFileString(path).pipe(Effect.mapError((error) => unreadable(error.message)))
    return yield* decode(text).pipe(Effect.mapError((error) => unreadable(`${path}: ${error.message}`)))
  })
}

const readRun = decodeFile(RunReport)
const readTests = decodeFile(TestReport)
const readPlaywright = decodeFile(PlaywrightReport)
const readQuarantine = decodeFile(QuarantineList)

const filesIn = Effect.fn("Report.filesIn")(function* (folder: string) {
  const fs = yield* FileSystem.FileSystem
  const files = yield* fs
    .readDirectory(folder, { recursive: true })
    .pipe(Effect.orElseSucceed((): ReadonlyArray<string> => []))
  return files.filter((file) => file.endsWith(".json")).toSorted()
})

const summary = (events: ReadonlyArray<Event>): string => {
  const count = (kind: Event["kind"]) => events.filter((event) => event.kind === kind).length
  return `${count("task")} tasks, ${count("test_failure")} failed tests, ${count("flake")} flakes, ${count("quarantined")} quarantined`
}

export const report = Effect.fn("Report.report")(function* (folder: string, quarantineFile: string, context: Context) {
  const path = yield* Path.Path
  const metrics = yield* CiMetrics
  const files = yield* filesIn(folder)
  const inFolder = (kind: string) =>
    files.filter((file) => file.split(path.sep).at(-2) === kind).map((file) => path.join(folder, file))
  const runs = yield* Effect.forEach(inFolder("moon"), readRun)
  const vitest = yield* Effect.forEach(inFolder("vitest"), readTests)
  const playwright = yield* Effect.forEach(inFolder("playwright"), (file) =>
    readPlaywright(file).pipe(Effect.map((parsed) => playwrightTests(path.basename(file, ".json"), parsed)))
  )
  const quarantine = yield* readQuarantine(quarantineFile)
  const tasks = runs.flatMap(tasksOf)
  const prior = needsHistory(tasks) ? yield* metrics.history(context.sha) : []
  const events = eventsOf({ tasks, tests: [...vitest, ...playwright], quarantine }, prior)
  if (events.length === 0) return yield* Console.log("No CI events to report")
  const now = yield* Clock.currentTimeNanos
  yield* metrics.send(logsRequest(events, context, now))
  yield* Console.log(`Reported ${summary(events)}`)
})
