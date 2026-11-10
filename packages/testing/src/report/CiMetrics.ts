import { Context, Effect, Layer, Redacted, Schema } from "effect"
import { HttpClient, HttpClientRequest, HttpClientResponse } from "effect/http"
import type { Prior } from "./Events.ts"

export class CiMetricsError extends Schema.TaggedError<CiMetricsError, { readonly brand: unique symbol }>()(
  "CiMetricsError",
  { step: Schema.String, detail: Schema.String }
) {
  override get message() {
    return `CI metrics could not ${this.step}: ${this.detail}`
  }
}

export type Endpoints = {
  readonly ingest: string
  readonly loki: string
  readonly ingestToken: Redacted.Redacted
  readonly readToken: Redacted.Redacted
}

const Stream = Schema.Record(Schema.String, Schema.String)
const QueryBody = Schema.Struct({ data: Schema.Struct({ result: Schema.Array(Schema.Struct({ stream: Stream })) }) })

const priorOf = (stream: Readonly<Record<string, string>>): Prior => ({
  kind: stream["kind"] ?? "",
  app: stream["app"] ?? "",
  task: stream["task"] ?? "",
  file: stream["file"] ?? "",
  test: stream["test"] ?? "",
  project: stream["project"] ?? "",
  how: stream["how"] ?? ""
})

export const historyQuery = (sha: string): string =>
  `{service_name="ci"} | kind=~"test_failure|flake" | sha="${sha.replace(/[^0-9a-f]/gi, "")}"`

const failed = (step: string) => (error: { readonly message: string }) =>
  new CiMetricsError({ step, detail: error.message })

export class CiMetrics extends Context.Service<
  CiMetrics,
  {
    history(sha: string): Effect.Effect<ReadonlyArray<Prior>, CiMetricsError>
    send(payload: unknown): Effect.Effect<void, CiMetricsError>
  }
>()("testing/CiMetrics") {
  static readonly layer = (endpoints: Endpoints) =>
    Layer.effect(
      CiMetrics,
      Effect.gen(function* () {
        const client = yield* Effect.map(HttpClient.HttpClient, HttpClient.filterStatusOk)
        const history = Effect.fn("CiMetrics.history")(function* (sha: string) {
          const body = yield* HttpClientRequest.get(endpoints.loki).pipe(
            HttpClientRequest.bearerToken(Redacted.value(endpoints.readToken)),
            HttpClientRequest.setUrlParams({ query: historyQuery(sha), since: "30d", limit: "5000" }),
            client.execute,
            Effect.flatMap(HttpClientResponse.schemaBodyJson(QueryBody)),
            Effect.mapError(failed("read earlier failures from Loki"))
          )
          return body.data.result.map((entry) => priorOf(entry.stream))
        })

        const send = Effect.fn("CiMetrics.send")(function* (payload: unknown) {
          yield* HttpClientRequest.post(endpoints.ingest).pipe(
            HttpClientRequest.bearerToken(Redacted.value(endpoints.ingestToken)),
            HttpClientRequest.bodyJsonUnsafe(payload),
            client.execute,
            Effect.mapError(failed("send the events"))
          )
        })

        return CiMetrics.of({ history, send })
      })
    )
}
