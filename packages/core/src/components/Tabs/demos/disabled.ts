import { Option, Record, Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { tabsList, tabsTab } from "../Tabs.ts"
import type { TabsChild, TabsOptions } from "../Tabs.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ selected: Schema.Record(Schema.String, Schema.NullOr(Schema.String)) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ ChangedTab: { tabs: Schema.String, tab: Schema.NullOr(Schema.String) } })
export type Message = typeof Message.Type

export const init = (): Model => ({ selected: { "disabled-only": "chat" } })

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

const chat = (
  model: Model,
  h: HtmlBuilder<Message>,
  ui: Ui,
  id: string,
  settings: { readonly disabled?: boolean },
  account: { readonly ml?: string }
) =>
  tabs(model, h, ui, id, {}, [
    tabsList({
      children: [
        tabsTab({ value: "chat", children: ["Chat"] }),
        tabsTab({ value: "gallery", children: ["Gallery"] }),
        tabsTab({ value: "settings", ...settings, children: ["Settings"] }),
        tabsTab({ value: "account", ...account, children: ["Account"] })
      ]
    })
  ])

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  chat(model, h, ui, "disabled-only", { disabled: true }, {})
