import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { ChatCircleIcon } from "@sth-ui/icons/icons/ChatCircleIcon.ts"
import { GearSixIcon } from "@sth-ui/icons/icons/GearSixIcon.ts"
import { ImageIcon } from "@sth-ui/icons/icons/ImageIcon.ts"
import { tabsList, tabsPanel, tabsTab } from "../Tabs.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ tab: Schema.NullOr(Schema.String) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ ChangedTab: { tab: Schema.NullOr(Schema.String) } })
export type Message = typeof Message.Type

export const init = (): Model => ({ tab: "gallery" })

export const update = (model: Model, message: Message) =>
  Message.match(message, { ChangedTab: ({ tab }) => ({ model: { ...model, tab } }) })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    w: "100%",
    maw: 540,
    children: [
      ui.Tabs(h, {
        id: "usage",
        value: model.tab,
        onChange: (tab) => Message.ChangedTab({ tab }),
        children: [
          tabsList({
            children: [
              tabsTab({ value: "gallery", leftSection: ImageIcon(h, { size: 12 }), children: ["Gallery"] }),
              tabsTab({ value: "messages", leftSection: ChatCircleIcon(h, { size: 12 }), children: ["Messages"] }),
              tabsTab({ value: "settings", leftSection: GearSixIcon(h, { size: 12 }), children: ["Settings"] })
            ]
          }),
          tabsPanel({ value: "gallery", pt: "xs", children: ["Gallery tab content"] }),
          tabsPanel({ value: "messages", pt: "xs", children: ["Messages tab content"] }),
          tabsPanel({ value: "settings", pt: "xs", children: ["Settings tab content"] })
        ]
      })
    ]
  })
