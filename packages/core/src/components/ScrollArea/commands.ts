import { Duration, Effect, Option, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"

export const ScrollAreaCommandMessage = defineMessageUnion({ Scrolled: {}, Waited: {} })

export const ScrollViewport = Command.define("ScrollAreaScrollViewport", {
  args: { id: Schema.String, axis: Schema.Literals(["x", "y"]), position: Schema.Finite },
  messages: [ScrollAreaCommandMessage.Scrolled],
  execute: ({ id, axis, position }) =>
    Effect.sync(() => {
      Option.map(Option.fromNullishOr(document.getElementById(id)), (viewport) =>
        viewport.scrollTo(axis === "y" ? { top: position } : { left: position })
      )

      return ScrollAreaCommandMessage.Scrolled()
    })
})

export const HideAfterDelay = Command.define("ScrollAreaHideAfterDelay", {
  args: { delay: Schema.Finite },
  messages: [ScrollAreaCommandMessage.Waited],
  execute: ({ delay }) => Effect.sleep(Duration.millis(delay)).pipe(Effect.as(ScrollAreaCommandMessage.Waited()))
})
