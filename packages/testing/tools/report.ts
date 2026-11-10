import { BunRuntime, BunServices } from "@effect/platform-bun"
import { Config, Effect, Layer } from "effect"
import { Command, Flag } from "effect/cli"
import { FetchHttpClient } from "effect/http"
import { CiMetrics } from "../src/report/CiMetrics.ts"
import { report } from "../src/report/Report.ts"

const context = Config.all({
  repo: Config.String("GITHUB_REPOSITORY"),
  workflow: Config.String("GITHUB_WORKFLOW"),
  job: Config.String("GITHUB_JOB"),
  run_id: Config.String("GITHUB_RUN_ID"),
  run_attempt: Config.String("GITHUB_RUN_ATTEMPT").pipe(Config.withDefault("1")),
  sha: Config.String("GITHUB_SHA"),
  ref: Config.String("GITHUB_REF"),
  box: Config.String("CI_BOX").pipe(Config.withDefault(""))
})

const endpoints = Config.all({
  ingest: Config.String("CI_METRICS_URL"),
  loki: Config.String("CI_LOKI_URL"),
  ingestToken: Config.Redacted("CI_METRICS_TOKEN"),
  readToken: Config.Redacted("CI_GRAFANA_TOKEN")
})

const command = Command.make(
  "report",
  {
    reports: Flag.String("reports").pipe(Flag.withDescription("Folder of the reports the Dagger checks exported")),
    quarantine: Flag.String("quarantine").pipe(Flag.withDescription("The quarantine list, ci/quarantine.json"))
  },
  Effect.fn(function* ({ reports, quarantine }) {
    const where = yield* endpoints
    const ci = yield* context
    const metrics = CiMetrics.layer(where).pipe(Layer.provide(FetchHttpClient.layer))
    yield* report(reports, quarantine, ci).pipe(Effect.provide(metrics))
  })
).pipe(Command.withDescription("Send the CI run's task, test failure, flake and quarantine events to a metrics server"))

command.pipe(Command.run({ version: "1.0.0" }), Effect.provide(BunServices.layer), BunRuntime.runMain)
