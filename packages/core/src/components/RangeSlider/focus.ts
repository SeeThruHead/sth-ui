import { Effect, Schema } from "effect"
import * as Command from "foldkit/command"
import * as Dom from "foldkit/dom"
import { defineMessageUnion } from "foldkit/message"

export const FocusMessage = defineMessageUnion({ Focused: {} })

export const FocusThumb = Command.define("FocusRangeThumb", {
  args: { id: Schema.String },
  messages: [FocusMessage.Focused],
  execute: ({ id }) => Dom.focus(`#${id}`).pipe(Effect.ignore, Effect.as(FocusMessage.Focused()))
})
