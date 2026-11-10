import { Duration, Effect, Schema } from "effect"
import * as Command from "foldkit/command"
import * as Dom from "foldkit/dom"
import { defineMessageUnion } from "foldkit/message"

export const CarouselCommandMessage = defineMessageUnion({ Waited: {}, Focused: {} })

export const Wait = Command.define("CarouselWait", {
  args: { millis: Schema.Finite },
  messages: [CarouselCommandMessage.Waited],
  execute: ({ millis }) => Effect.sleep(Duration.millis(millis)).pipe(Effect.as(CarouselCommandMessage.Waited()))
})

export const FocusIndicator = Command.define("CarouselFocusIndicator", {
  args: { selector: Schema.String },
  messages: [CarouselCommandMessage.Focused],
  execute: ({ selector }) => Dom.focus(selector).pipe(Effect.ignore, Effect.as(CarouselCommandMessage.Focused()))
})
