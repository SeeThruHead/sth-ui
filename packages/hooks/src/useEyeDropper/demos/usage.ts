import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { eyeDropperSupported } from "../../browser.ts"
import { BrowserMessage, openEyeDropper } from "../../commands.ts"

export const Model = Schema.Struct({ color: Schema.String, error: Schema.String, supported: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Opened: {}, Got: { message: BrowserMessage } })
export type Message = typeof Message.Type

export const init = (): Model => ({ color: "", error: "", supported: eyeDropperSupported() })

const picked = (model: Model, result: BrowserMessage): Model => {
  if (result._tag === "Picked") return { ...model, color: result.color, error: "" }
  if (result._tag === "Failed") return { ...model, error: result.error }

  return model
}

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands?: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Opened: () => ({
      model,
      commands: [Command.mapMessage(openEyeDropper({}), (result) => Message.Got({ message: result }))]
    }),
    Got: ({ message: result }) => ({ model: picked(model, result) })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.Button(h, { disabled: !model.supported, onClick: Message.Opened(), children: ["Pick a color"] }),
      ui.Text(h, { children: [model.color === "" ? "No color picked yet" : `Picked color: ${model.color}`] }),
      ...(model.error === ""
        ? []
        : [ui.Text(h, { c: "red", size: "sm", children: [`Could not pick: ${model.error}`] })])
    ]
  })
