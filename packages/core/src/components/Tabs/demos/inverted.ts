import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { tabsList, tabsPanel, tabsTab } from "../Tabs.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ tab: Schema.NullOr(Schema.String) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ ChangedTab: { tab: Schema.NullOr(Schema.String) } })
export type Message = typeof Message.Type

export const init = (): Model => ({ tab: "chat" })

export const update = (model: Model, message: Message) =>
  Message.match(message, { ChangedTab: ({ tab }) => ({ model: { ...model, tab } }) })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Tabs(h, {
    id: "inverted",
    value: model.tab,
    onChange: (tab) => Message.ChangedTab({ tab }),
    inverted: true,
    children: [
      tabsPanel({ value: "chat", pb: "xs", children: ["Chat"] }),
      tabsPanel({ value: "gallery", pb: "xs", children: ["Gallery"] }),
      tabsList({
        children: [tabsTab({ value: "chat", children: ["Chat"] }), tabsTab({ value: "gallery", children: ["Gallery"] })]
      })
    ]
  })
