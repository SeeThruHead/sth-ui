import { Schema } from "effect"

export const QuarantineEntry = Schema.Struct({
  app: Schema.String,
  file: Schema.String,
  test: Schema.String,
  since: Schema.String,
  reason: Schema.String
})
export type QuarantineEntry = typeof QuarantineEntry.Type

export const QuarantineList = Schema.Array(QuarantineEntry)
export type QuarantineList = typeof QuarantineList.Type

export const decodeQuarantine = Schema.decodeUnknownSync(Schema.fromJsonString(QuarantineList))

export const quarantinedIn = (list: QuarantineList, app: string): QuarantineList =>
  list.filter((entry) => entry.app === app)

const escaped = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

export const skipPattern = (entries: QuarantineList): RegExp | undefined =>
  entries.length === 0 ? undefined : new RegExp(`^(?!(?:${entries.map((entry) => escaped(entry.test)).join("|")})$)`)

export const isQuarantined = (entries: QuarantineList, file: string, test: string): boolean =>
  entries.some((entry) => entry.file === file && entry.test === test)
