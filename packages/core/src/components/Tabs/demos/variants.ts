import { Option, Record, Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { ChatCircleIcon } from "@sth-ui/icons/icons/ChatCircleIcon.ts"
import { GearSixIcon } from "@sth-ui/icons/icons/GearSixIcon.ts"
import { ImageIcon } from "@sth-ui/icons/icons/ImageIcon.ts"
import { tabsList, tabsPanel, tabsTab } from "../Tabs.ts"
import type { TabsChild, TabsOptions } from "../Tabs.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ selected: Schema.Record(Schema.String, Schema.NullOr(Schema.String)) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ ChangedTab: { tabs: Schema.String, tab: Schema.NullOr(Schema.String) } })
export type Message = typeof Message.Type

export const init = (): Model => ({ selected: { outline: "gallery", pills: "gallery" } })

export const update = (model: Model, message: Message) =>
  Message.match(message, {
    ChangedTab: ({ tabs, tab }) => ({ model: { selected: { ...model.selected, [tabs]: tab } } })
  })

const tabs = (
  model: Model,
  h: HtmlBuilder<Message>,
  ui: Ui,
  id: string,
  options: TabsOptions,
  children: ReadonlyArray<TabsChild>
) =>
  ui.Tabs(h, {
    id,
    value: Option.getOrNull(Record.get(model.selected, id)),
    onChange: (tab) => Message.ChangedTab({ tabs: id, tab }),
    ...options,
    children
  })

const gallery = (model: Model, h: HtmlBuilder<Message>, ui: Ui, id: string, options: TabsOptions) =>
  tabs(model, h, ui, id, options, [
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
  ])

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    w: "100%",
    maw: 540,
    gap: "xl",
    children: [
      gallery(model, h, ui, "outline", { variant: "outline" }),
      gallery(model, h, ui, "pills", { variant: "pills" })
    ]
  })
