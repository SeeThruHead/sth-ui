import { Effect, Option, Schema } from "effect"
import * as Command from "foldkit/command"
import * as File from "foldkit/file"
import { defineMessageUnion } from "foldkit/message"

export const DialogMessage = defineMessageUnion({ Chose: { files: Schema.Array(File.File) } })

export const OpenDialog = Command.define("DropzoneOpenDialog", {
  args: { accept: Schema.Array(Schema.String), multiple: Schema.Boolean },
  messages: [DialogMessage.Chose],
  execute: ({ accept, multiple }) =>
    (multiple ? File.selectMultiple(accept) : Effect.map(File.select(accept), Option.toArray)).pipe(
      Effect.map((files) => DialogMessage.Chose({ files }))
    )
})
