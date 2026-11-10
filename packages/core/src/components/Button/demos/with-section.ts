import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { groupButton, groupSection } from "../ButtonGroup.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ count: Schema.Finite })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Decreased: {}, Increased: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ count: 135 })

export const update = (model: Model, message: Message) =>
  Message.match(message, {
    Decreased: () => ({ model: { count: model.count - 1 } }),
    Increased: () => ({ model: { count: model.count + 1 } })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.ButtonGroup(h, {
    children: [
      groupButton({ variant: "default", onClick: Message.Decreased(), children: ["Decrease"] }),
      groupSection({ variant: "default", miw: 80, children: [String(model.count)] }),
      groupButton({ variant: "default", onClick: Message.Increased(), children: ["Increase"] })
    ]
  })
