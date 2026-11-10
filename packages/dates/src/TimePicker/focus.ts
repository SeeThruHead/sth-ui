import { Effect, Schema } from "effect"
import * as Command from "foldkit/command"
import * as Dom from "foldkit/dom"
import { defineMessageUnion } from "foldkit/message"

export const FocusMessage = defineMessageUnion({ CompletedFocus: {} })

export const FocusField = Command.define("TimePickerFocusField", {
  args: { selector: Schema.String },
  messages: [FocusMessage.CompletedFocus],
  execute: ({ selector }) => Dom.focus(selector).pipe(Effect.ignore, Effect.as(FocusMessage.CompletedFocus()))
})
