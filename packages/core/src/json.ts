import { Schema } from "effect"

const Json = Schema.fromJsonString(Schema.Unknown)

export const toJson = Schema.encodeSync(Json)

export const toPrettyJson = Schema.encodeSync(Schema.fromJsonString(Schema.Unknown, { space: 2 }))

export const fromJson = Schema.decodeSync(Json)

export const fromJsonOption = Schema.decodeUnknownOption(Json)
