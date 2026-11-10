import { Option, Record, Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { tabsList, tabsPanel, tabsTab } from "../Tabs.ts"
import type { TabsChild, TabsOptions } from "../Tabs.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ selected: Schema.Record(Schema.String, Schema.NullOr(Schema.String)) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ ChangedTab: { tabs: Schema.String, tab: Schema.NullOr(Schema.String) } })
export type Message = typeof Message.Type

export const init = (): Model => ({
  selected: { left: "gallery", right: "gallery", outlined: "gallery", "outlined-right": "gallery" }
})

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

const vertical = (model: Model, h: HtmlBuilder<Message>, ui: Ui, id: string, options: TabsOptions) =>
  tabs(model, h, ui, id, { orientation: "vertical", ...options }, [
    tabsList({
      children: [
        tabsTab({ value: "gallery", children: ["Gallery"] }),
        tabsTab({ value: "messages", children: ["Messages"] }),
        tabsTab({ value: "settings", children: ["Settings"] })
      ]
    }),
    tabsPanel({ value: "gallery", px: "md", children: ["Gallery tab content"] }),
    tabsPanel({ value: "messages", px: "md", children: ["Messages tab content"] }),
    tabsPanel({ value: "settings", px: "md", children: ["Settings tab content"] })
  ])

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    w: "100%",
    maw: 540,
    gap: "xl",
    children: [
      vertical(model, h, ui, "left", {}),
      vertical(model, h, ui, "right", { placement: "right" }),
      vertical(model, h, ui, "outlined", { variant: "outline" }),
      vertical(model, h, ui, "outlined-right", { variant: "outline", placement: "right" })
    ]
  })
