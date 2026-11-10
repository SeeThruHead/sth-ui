import type { Event } from "./Events.ts"

export type Context = {
  readonly repo: string
  readonly workflow: string
  readonly job: string
  readonly run_id: string
  readonly run_attempt: string
  readonly sha: string
  readonly ref: string
  readonly box: string
}

const value = (raw: string | number) => (typeof raw === "number" ? { doubleValue: raw } : { stringValue: raw })

const attributes = (values: Readonly<Record<string, string | number>>) =>
  Object.entries(values).map(([key, raw]) => ({ key, value: value(raw) }))

export const logsRequest = (events: ReadonlyArray<Event>, context: Context, nanos: bigint) => ({
  resourceLogs: [
    {
      resource: { attributes: attributes({ "service.name": "ci" }) },
      scopeLogs: [
        {
          scope: { name: "sth-ui-ci" },
          logRecords: events.map((event, index) => ({
            timeUnixNano: String(nanos + BigInt(index)),
            severityText: event.kind === "task" ? "INFO" : "WARN",
            body: { stringValue: event.body },
            attributes: attributes({ kind: event.kind, ...context, ...event.attributes })
          }))
        }
      ]
    }
  ]
})
