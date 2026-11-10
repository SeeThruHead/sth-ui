import { Option, Schema } from "effect"

export const Connection = Schema.Struct({
  downlink: Schema.optional(Schema.Finite),
  downlinkMax: Schema.optional(Schema.Finite),
  effectiveType: Schema.optional(Schema.Literals(["slow-2g", "2g", "3g", "4g"])),
  rtt: Schema.optional(Schema.Finite),
  saveData: Schema.optional(Schema.Boolean),
  type: Schema.optional(
    Schema.Literals(["bluetooth", "cellular", "ethernet", "wifi", "wimax", "none", "other", "unknown"])
  )
})
export type Connection = typeof Connection.Type

export const Network = Schema.Struct({ online: Schema.Boolean, ...Connection.fields })
export type Network = typeof Network.Type

const decode = Schema.decodeUnknownOption(Connection)

const fields = Object.keys(Connection.fields)

const picked = (connection: unknown) =>
  Object.fromEntries(
    fields.map((field) => [field, Reflect.get(Object(connection), field)]).filter(([, value]) => value !== undefined)
  )

export const connectionOf = (connection: unknown): Connection =>
  Option.getOrElse(decode(picked(connection)), () => ({}))

export const networkOf = (online: boolean, connection: unknown): Network => ({ online, ...connectionOf(connection) })
