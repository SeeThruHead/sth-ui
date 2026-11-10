import { Duration, Effect, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"

export const WaitMessage = defineMessageUnion({ Waited: {} })

export const Wait = Command.define("NotificationsWait", {
  args: { millis: Schema.Finite },
  messages: [WaitMessage.Waited],
  execute: ({ millis }) => Effect.sleep(Duration.millis(millis)).pipe(Effect.as(WaitMessage.Waited()))
})
