import { BunServices } from "@effect/platform-bun"
import { assert, describe, it } from "@effect/vitest"
import { Effect, Layer, Ref, Schema } from "effect"
import { CiMetrics, CiMetricsError } from "./CiMetrics.ts"
import type { Prior } from "./Events.ts"
import { report } from "./Report.ts"
import { toJson } from "../json.ts"

const fixtures = new URL("../../fixtures", import.meta.url).pathname
const quarantine = `${fixtures}/quarantine.json`

const context = {
  repo: "sth/sth-ui",
  workflow: "suite",
  job: "check",
  run_id: "41",
  run_attempt: "2",
  sha: "abc123",
  ref: "refs/heads/main",
  box: "ci"
}

const prior: ReadonlyArray<Prior> = [
  {
    kind: "test_failure",
    app: "wish-farm",
    task: "check",
    file: "src/x.test.ts",
    test: "x > wobbles",
    project: "pure",
    how: ""
  }
]

const metrics = Effect.gen(function* () {
  const asked = yield* Ref.make<ReadonlyArray<string>>([])
  const sent = yield* Ref.make<ReadonlyArray<unknown>>([])
  const layer = Layer.succeed(
    CiMetrics,
    CiMetrics.of({
      history: (sha) => Ref.update(asked, (all) => [...all, sha]).pipe(Effect.as(prior)),
      send: (payload) => Ref.update(sent, (all) => [...all, payload])
    })
  )
  return { asked, sent, layer: Layer.merge(layer, BunServices.layer) }
})

const Attribute = Schema.Struct({
  key: Schema.String,
  value: Schema.Struct({
    stringValue: Schema.optionalKey(Schema.String),
    doubleValue: Schema.optionalKey(Schema.Finite)
  })
})

const Payload = Schema.Struct({
  resourceLogs: Schema.Array(
    Schema.Struct({
      scopeLogs: Schema.Array(
        Schema.Struct({ logRecords: Schema.Array(Schema.Struct({ attributes: Schema.Array(Attribute) })) })
      )
    })
  )
})

const recordsOf = (payload: unknown): ReadonlyArray<Readonly<Record<string, string | number | undefined>>> =>
  (
    Schema.decodeSync(Schema.fromJsonString(Payload))(toJson(payload)).resourceLogs[0]?.scopeLogs[0]?.logRecords ?? []
  ).map((record) =>
    Object.fromEntries(
      record.attributes.map((attribute) => [attribute.key, attribute.value.stringValue ?? attribute.value.doubleValue])
    )
  )

describe("report", () => {
  it.effect("sends the tasks, failures, flakes and quarantined tests from every exported folder", () =>
    Effect.gen(function* () {
      const { asked, sent, layer } = yield* metrics
      yield* report(`${fixtures}/reports`, quarantine, context).pipe(Effect.provide(layer))
      const shas = yield* Ref.get(asked)
      assert.deepStrictEqual(shas, ["abc123"])
      const [payload] = yield* Ref.get(sent)
      const records = recordsOf(payload)
      const kinds = records.map((record) => `${record["kind"]} ${record["app"]} ${record["test"] ?? record["task"]}`)
      assert.deepStrictEqual(kinds, [
        "task kernel test",
        "task wish-farm check",
        "task habits check",
        "task suite check",
        "task wish-farm e2e",
        "test_failure habits log > records a check-in",
        "test_failure wish-farm Plan > Deletes a wish",
        "test_failure wish-farm Plan > Deletes a wish",
        "flake wish-farm Timeline > holds back for the dip",
        "flake wish-farm Plan > Adds a wish",
        "flake wish-farm x > wobbles",
        "quarantined wish-farm Forecast > waits"
      ])
      assert.deepStrictEqual(
        records.filter((record) => record["test"] === "Plan > Deletes a wish").map((record) => record["project"]),
        ["desktop", "iphone"]
      )
      assert.strictEqual(records[0]?.["run_attempt"], "2")
      assert.strictEqual(records[1]?.["duration_ms"], 61500)
    })
  )

  it.effect("sends nothing when no check exported reports", () =>
    Effect.gen(function* () {
      const { asked, sent, layer } = yield* metrics
      yield* report(`${fixtures}/missing`, quarantine, context).pipe(Effect.provide(layer))
      const payloads = yield* Ref.get(sent)
      const shas = yield* Ref.get(asked)
      assert.deepStrictEqual(payloads, [])
      assert.deepStrictEqual(shas, [])
    })
  )

  it.effect("fails on a report it can't read", () =>
    Effect.gen(function* () {
      const { layer } = yield* metrics
      const unreadable = yield* report(`${fixtures}/run`, `${fixtures}/run/broken.check.ts`, context).pipe(
        Effect.provide(layer),
        Effect.flip
      )
      assert.instanceOf(unreadable, CiMetricsError)
      assert.match(unreadable.message, /could not read the reports/)
      const gone = yield* report(`${fixtures}/reports`, `${fixtures}/none.json`, context).pipe(
        Effect.provide(layer),
        Effect.flip
      )
      assert.match(gone.message, /could not read the reports/)
    })
  )
})
