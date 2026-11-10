import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { highlight } from "../../Highlight.ts"
import { serializePath } from "../jsonValue.ts"
import * as JsonViewer from "../model.ts"

export const data = {
  name: "Mantine",
  version: 9,
  description: "A fully featured React components library with more than a hundred components and hooks",
  private: false,
  license: null,
  keywords: ["react", "components", "hooks"],
  contributors: [{ name: "Vitaly", commits: 1520.5 }],
  empty: {}
}

const big = {
  items: Array.from({ length: 12 }, (_item, index) => index),
  short: [1, 2, 3, 4],
  extra: Object.fromEntries(Array.from({ length: 5 }, (_key, index) => [`k${index}`, index]))
}

const cyclic: Record<string, unknown> = { id: 1 }
Reflect.set(cyclic, "self", cyclic)

export const Model = Schema.Struct({
  plain: JsonViewer.Model,
  rich: JsonViewer.Model,
  grouped: JsonViewer.Model,
  selected: Schema.String,
  paths: Schema.Int
})
export type Model = typeof Model.Type

const names = ["plain", "rich", "grouped"] as const

export const Message = defineMessageUnion({ Got: { name: Schema.Literals(names), message: JsonViewer.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({
  plain: JsonViewer.init({ id: "plain", value: data }),
  rich: JsonViewer.init({ id: "rich", value: data, defaultExpandDepth: 3 }),
  grouped: JsonViewer.init({ id: "grouped", value: big, groupArraysAfterLength: 5 }),
  selected: "nothing",
  paths: 0
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
  const result = JsonViewer.update(model[message.name], message.message, { allExpanded: false })
  const selected = result.outMessages.reduce(
    (last, out) => (out._tag === "ValueSelected" ? out.path.join(".") : last),
    model.selected
  )
  const paths = result.outMessages.reduce(
    (last, out) => (out._tag === "ExpandedPathsChanged" ? out.paths.length : last),
    model.paths
  )

  return {
    model: { ...model, [message.name]: result.model, selected, paths },
    commands: result.commands.map((command) =>
      Command.mapMessage(command, (inner) => Message.Got({ name: message.name, message: inner }))
    )
  }
}

const viewer = (model: Model, name: (typeof names)[number]) => ({
  model: model[name],
  toParentMessage: (message: JsonViewer.Message) => Message.Got({ name, message })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 560,
    mx: "auto",
    children: [
      highlight.JsonViewer(h, { ...viewer(model, "plain"), value: data, rootName: "package" }),
      highlight.JsonViewer(h, {
        ...viewer(model, "rich"),
        value: data,
        withTypes: true,
        withSize: true,
        withCopy: true,
        withCopyButton: true,
        withControls: true,
        withBorder: true,
        withChevrons: true,
        withLineNumbers: true,
        withKeyQuotes: true,
        sortKeys: true,
        selectable: true,
        collapseStringsAfterLength: 20,
        radius: "md",
        fontSize: "sm",
        indentWidth: 24,
        highlightItems: { [serializePath(["version"])]: "added", [serializePath(["license"])]: "removed" }
      }),
      ui.Text(h, { size: "sm", children: [`Selected: ${model.selected}; expanded ${model.paths}`] }),
      highlight.JsonViewer(h, {
        ...viewer(model, "grouped"),
        value: big,
        groupArraysAfterLength: 5,
        maxDisplayLength: 3,
        withSize: true,
        withChevrons: true,
        withQuotes: false,
        fontSize: 12
      }),
      highlight.JsonViewer(h, {
        model: JsonViewer.init({ id: "all", value: cyclic }),
        toParentMessage: (message) => Message.Got({ name: "plain", message }),
        value: { cyclic, list: [1, [2]], when: { toJSON: () => "2024-05-09" }, big: 10n, long: [1, 2, 3, 4] },
        groupArraysAfterLength: 3,
        allExpanded: true,
        withControls: true,
        withTypes: true,
        withCopy: true,
        sortKeys: (a, b) => b.localeCompare(a),
        fontSize: "12px"
      })
    ]
  })
