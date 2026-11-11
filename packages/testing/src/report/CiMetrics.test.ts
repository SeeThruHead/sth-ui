import { assert, describe, it } from "@effect/vitest"
import { Effect, Layer, Redacted, Ref } from "effect"
import { HttpClient, HttpClientError, HttpClientResponse } from "effect/http"
import type { HttpClientRequest } from "effect/http"
import { CiMetrics, historyQuery } from "./CiMetrics.ts"
import { toJson } from "../json.ts"

const endpoints = {
  ingest: "https://otlp.test/v1/logs",
  loki: "https://grafana.test/loki/api/v1/query_range",
  ingestToken: Redacted.make("ingest-token"),
  readToken: Redacted.make("read-token")
}

type Seen = { readonly method: string; readonly url: string; readonly auth: string; readonly body: string }

const answering = Effect.fnUntraced(function* (status: number, payload: unknown) {
  const seen = yield* Ref.make<ReadonlyArray<Seen>>([])
  const client = HttpClient.make((request: HttpClientRequest.HttpClientRequest, url) =>
    Ref.update(seen, (all) => [
      ...all,
      {
        method: request.method,
        url: url.toString(),
        auth: request.headers["authorization"] ?? "",
        body: request.body._tag === "Uint8Array" ? new TextDecoder().decode(request.body.body) : ""
      }
    ]).pipe(Effect.as(HttpClientResponse.fromWeb(request, new Response(toJson(payload), { status }))))
  )
  const layer = CiMetrics.layer(endpoints).pipe(Layer.provide(Layer.succeed(HttpClient.HttpClient, client)))
  return { seen, layer }
})

describe("CiMetrics", () => {
  it.effect("reads this commit's earlier failures and flakes from Loki with the viewer token", () =>
    Effect.gen(function* () {
      const { seen, layer } = yield* answering(200, {
        data: {
          result: [
            { stream: { kind: "test_failure", app: "habits", task: "check", file: "a.test.ts", test: "bad" } },
            { stream: { kind: "flake" } },
            { stream: {} }
          ]
        }
      })
      const prior = yield* CiMetrics.use((metrics) => metrics.history("abc123")).pipe(Effect.provide(layer))
      assert.deepStrictEqual(prior, [
        { kind: "test_failure", app: "habits", task: "check", file: "a.test.ts", test: "bad", project: "", how: "" },
        { kind: "flake", app: "", task: "", file: "", test: "", project: "", how: "" },
        { kind: "", app: "", task: "", file: "", test: "", project: "", how: "" }
      ])
      const [request] = yield* Ref.get(seen)
      assert.strictEqual(request?.auth, "Bearer read-token")
      const url = new URL(request?.url ?? "")
      assert.strictEqual(url.searchParams.get("query"), historyQuery("abc123"))
      assert.strictEqual(url.searchParams.get("since"), "30d")
    })
  )

  it.effect("posts the events to the ingest with the ingest token", () =>
    Effect.gen(function* () {
      const { seen, layer } = yield* answering(200, {})
      yield* CiMetrics.use((metrics) => metrics.send({ resourceLogs: [] })).pipe(Effect.provide(layer))
      const [request] = yield* Ref.get(seen)
      assert.deepStrictEqual(request, {
        method: "POST",
        url: endpoints.ingest,
        auth: "Bearer ingest-token",
        body: '{"resourceLogs":[]}'
      })
    })
  )

  it.effect("says which step failed when a call is refused", () =>
    Effect.gen(function* () {
      const { layer } = yield* answering(401, {})
      const sent = yield* CiMetrics.use((metrics) => metrics.send({})).pipe(Effect.provide(layer), Effect.flip)
      assert.match(sent.message, /^CI metrics could not send the events: /)
      const read = yield* CiMetrics.use((metrics) => metrics.history("abc")).pipe(Effect.provide(layer), Effect.flip)
      assert.match(read.message, /^CI metrics could not read earlier failures from Loki: /)
    })
  )

  it.effect("fails when the network is down", () =>
    Effect.gen(function* () {
      const client = HttpClient.make((request) =>
        Effect.fail(
          new HttpClientError.HttpClientError({
            reason: new HttpClientError.TransportError({ request, description: "offline" })
          })
        )
      )
      const layer = CiMetrics.layer(endpoints).pipe(Layer.provide(Layer.succeed(HttpClient.HttpClient, client)))
      const error = yield* CiMetrics.use((metrics) => metrics.send({})).pipe(Effect.provide(layer), Effect.flip)
      assert.strictEqual(error.step, "send the events")
    })
  )

  it("keeps the commit to hex digits in the query", () => {
    assert.strictEqual(historyQuery('ab"} | x'), '{service_name="ci"} | kind=~"test_failure|flake" | sha="ab"')
  })
})
