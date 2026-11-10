import { Effect } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import { Os, osOf } from "./os.ts"

export const OsMessage = defineMessageUnion({
  DetectedOs: { os: Os }
})
export type OsMessage = typeof OsMessage.Type

export const detectOs = Command.define("DetectOs", {
  args: {},
  messages: [OsMessage.DetectedOs],
  execute: () =>
    Effect.sync(() => OsMessage.DetectedOs({ os: osOf(window.navigator.userAgent, "ontouchend" in document) }))
})
