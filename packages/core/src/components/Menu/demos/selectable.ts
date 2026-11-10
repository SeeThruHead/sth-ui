import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Menu from "../Menu.ts"
import type { MenuItem } from "../Menu.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({
  view: Menu.Model,
  sort: Menu.Model,
  compact: Menu.Model,
  shown: Schema.Array(Schema.String),
  order: Schema.String,
  density: Schema.String
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotView: { message: Menu.Message },
  GotSort: { message: Menu.Message },
  GotCompact: { message: Menu.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  view: Menu.init({ id: "view-menu" }),
  sort: Menu.init({ id: "sort-menu" }),
  compact: Menu.init({ id: "compact-menu" }),
  shown: ["bookmarks"],
  order: "newest",
  density: "comfortable"
})

const viewItems = (model: Model): ReadonlyArray<MenuItem> => [
  { value: "bookmarks", label: "Show bookmarks", kind: "checkbox", checked: model.shown.includes("bookmarks") },
  { value: "urls", label: "Show full URLs", kind: "checkbox", checked: model.shown.includes("urls") },
  { value: "reset", label: "Reset view" }
]

const sortItems = (model: Model): ReadonlyArray<MenuItem> => [
  { value: "newest", label: "Newest first", kind: "radio", checked: model.order === "newest" },
  { value: "oldest", label: "Oldest first", kind: "radio", checked: model.order === "oldest", closeMenuOnClick: true },
  { value: "refresh", label: "Refresh" }
]

const compactItems = (model: Model): ReadonlyArray<MenuItem> => [
  { value: "comfortable", label: "Comfortable", kind: "radio", checked: model.density === "comfortable" },
  { value: "compact", label: "Compact", kind: "radio", checked: model.density === "compact" }
]

const toggled = (shown: ReadonlyArray<string>, value: string): ReadonlyArray<string> =>
  shown.includes(value) ? shown.filter((entry) => entry !== value) : [...shown, value]

const chosen = (result: Menu.UpdateResult): string => (result.outMessage === undefined ? "" : result.outMessage.value)

const lift = (result: Menu.UpdateResult, wrap: (message: Menu.Message) => Message) =>
  (result.commands ?? []).map((command) => Command.mapMessage(command, wrap))

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotView: ({ message: inner }) => {
      const result = Menu.update(model.view, inner, { items: viewItems(model) })
      const value = chosen(result)
      const shown = value === "reset" ? [] : value === "" ? model.shown : toggled(model.shown, value)

      return {
        model: { ...model, view: result.model, shown },
        commands: lift(result, (m) => Message.GotView({ message: m }))
      }
    },
    GotSort: ({ message: inner }) => {
      const result = Menu.update(model.sort, inner, { items: sortItems(model), closeOnItemClick: false })
      const value = chosen(result)
      const order = value === "newest" || value === "oldest" ? value : model.order

      return {
        model: { ...model, sort: result.model, order },
        commands: lift(result, (m) => Message.GotSort({ message: m }))
      }
    },
    GotCompact: ({ message: inner }) => {
      const result = Menu.update(model.compact, inner, { items: compactItems(model) })
      const density = chosen(result) === "" ? model.density : chosen(result)

      return {
        model: { ...model, compact: result.model, density },
        commands: lift(result, (m) => Message.GotCompact({ message: m }))
      }
    }
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ui.Menu(h, {
        model: model.view,
        toParentMessage: (message) => Message.GotView({ message }),
        target: (renderRoot) => ui.Button(h, { renderRoot, variant: "default", children: ["View"] }),
        items: viewItems(model)
      }),
      ui.Menu(h, {
        model: model.sort,
        toParentMessage: (message) => Message.GotSort({ message }),
        alignItemsLabels: "all",
        closeOnItemClick: false,
        checkIcon: "✓",
        target: (renderRoot) => ui.Button(h, { renderRoot, variant: "default", children: ["Sort"] }),
        items: sortItems(model)
      }),
      ui.Menu(h, {
        model: model.compact,
        toParentMessage: (message) => Message.GotCompact({ message }),
        alignItemsLabels: "none",
        target: (renderRoot) => ui.Button(h, { renderRoot, variant: "default", children: ["Density"] }),
        items: compactItems(model)
      }),
      ui.Text(h, {
        size: "sm",
        c: "dimmed",
        children: [`Showing ${model.shown.join(", ") || "nothing"}, ${model.order}, ${model.density}`]
      })
    ]
  })
