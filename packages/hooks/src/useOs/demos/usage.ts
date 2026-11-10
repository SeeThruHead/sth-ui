import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { Os } from "../os.ts"
import { detectOs } from "../osCommand.ts"

export const Model = Schema.Struct({ os: Os })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Detected: { os: Os } })
export type Message = typeof Message.Type

export const init = (): Model => ({ os: "undetermined" })

export const initCommands = () => [Command.mapMessage(detectOs({}), ({ os }) => Message.Detected({ os }))]

export const update = (model: Model, message: Message) =>
  Message.match(message, { Detected: ({ os }) => ({ model: { ...model, os } }) })

const names: Readonly<Record<Os, string>> = {
  undetermined: "an operating system we could not tell",
  macos: "macOS",
  ios: "iOS",
  windows: "Windows",
  android: "Android",
  linux: "Linux",
  chromeos: "ChromeOS"
}

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Text(h, { ta: "center", children: [`Your os is ${names[model.os]}`] })
