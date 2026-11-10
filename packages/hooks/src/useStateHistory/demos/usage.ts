import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { backHistory, currentOf, forwardHistory, setHistory, stateHistory } from "../history.ts"

export const Model = Schema.Struct({ history: Schema.Array(Schema.Int), current: Schema.Int })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Set: {}, Back: {}, Forward: {}, Reset: {} })
export type Message = typeof Message.Type

export const init = (): Model => stateHistory(1)

export const update = (model: Model, message: Message) =>
  Message.match(message, {
    Set: () => ({ model: setHistory(model, (currentOf(model) ?? 0) + 1) }),
    Back: () => ({ model: backHistory(model) }),
    Forward: () => ({ model: forwardHistory(model) }),
    Reset: () => ({ model: stateHistory(1) })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.Text(h, { children: [`Current value: ${currentOf(model) ?? ""}`] }),
      ui.Text(h, { size: "sm", c: "dimmed", children: [`History: ${model.history.join(", ")}`] }),
      ui.Group(h, {
        children: [
          ui.Button(h, { onClick: Message.Set(), children: ["Set value"] }),
          ui.Button(h, { variant: "default", onClick: Message.Back(), children: ["Back"] }),
          ui.Button(h, { variant: "default", onClick: Message.Forward(), children: ["Forward"] }),
          ui.Button(h, { variant: "default", color: "red", onClick: Message.Reset(), children: ["Reset"] })
        ]
      })
    ]
  })
