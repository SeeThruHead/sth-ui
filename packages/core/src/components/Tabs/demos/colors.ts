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

export const init = (): Model => ({ selected: { teal: "first", blue: "second" } })

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

const colored = (model: Model, h: HtmlBuilder<Message>, ui: Ui, id: string) =>
  tabs(model, h, ui, id, { color: "teal" }, [
    tabsList({
      children: [
        tabsTab({ value: "first", children: ["Teal tab"] }),
        tabsTab({ value: "second", color: "blue", children: ["Blue tab"] })
      ]
    }),
    tabsPanel({ value: "first", pt: "xs", children: ["First tab color is teal, it gets this value from Tabs"] }),
    tabsPanel({ value: "second", pt: "xs", children: ["Second tab color is blue, its own color wins over Tabs'"] })
  ])

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    w: "100%",
    maw: 540,
    gap: "xl",
    children: [colored(model, h, ui, "teal"), colored(model, h, ui, "blue")]
  })
