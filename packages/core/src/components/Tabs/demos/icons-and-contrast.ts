import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { ChatCircleIcon } from "@sth-ui/icons/icons/ChatCircleIcon.ts"
import { DotsThreeIcon } from "@sth-ui/icons/icons/DotsThreeIcon.ts"
import { GearSixIcon } from "@sth-ui/icons/icons/GearSixIcon.ts"
import { tabsList, tabsTab } from "../Tabs.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ tab: Schema.NullOr(Schema.String) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ ChangedTab: { tab: Schema.NullOr(Schema.String) } })
export type Message = typeof Message.Type

export const init = (): Model => ({ tab: "lime" })

export const update = (model: Model, message: Message) =>
  Message.match(message, { ChangedTab: ({ tab }) => ({ model: { ...model, tab } }) })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Tabs(h, {
    id: "icons",
    value: model.tab,
    onChange: (tab) => Message.ChangedTab({ tab }),
    variant: "pills",
    color: "lime",
    autoContrast: true,
    children: [
      tabsList({
        children: [
          tabsTab({ value: "lime", children: ["Lime"] }),
          tabsTab({ value: "settings", rightSection: GearSixIcon(h, { size: 12 }), children: ["Settings"] }),
          tabsTab({ value: "chat", leftSection: ChatCircleIcon(h, { size: 16, label: "Chat" }) }),
          tabsTab({ value: "more", rightSection: DotsThreeIcon(h, { size: 16, label: "More" }) }),
          tabsTab({ value: "archived", disabled: true, children: ["Archived"] })
        ]
      }),
      h.p([], ["Plain content between the parts stays as it is"])
    ]
  })
