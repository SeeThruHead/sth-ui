import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as TableOfContents from "../TableOfContents.ts"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "select", prop: "variant", options: ["filled", "light", "none"], initial: "filled" },
    { type: "color", prop: "color", initial: "blue" },
    { type: "size", prop: "size", initial: "md" },
    { type: "size", prop: "radius", initial: "md" }
  ],
  code: `ui.TableOfContents(h, {
{{props}}  model: model.toc,
  toParentMessage: (message) => Message.GotToc({ message }),
  scrollSpyOptions: spy,
  getControlProps: ({ data, index }) => ({
              onClick: Message.GotToc({ message: TableOfContents.Message.ScrolledTo({ index }) }),
              children: data.value
            })
})`
})

const id = "usage"

const spy = { selector: `#${id}-article :is(h1, h2, h3, h4, h5, h6)`, scrollHost: `#${id}-article` }

export const Model = Schema.Struct({ toc: TableOfContents.Model, extra: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotToc: { message: TableOfContents.Message }, AddedSection: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ toc: TableOfContents.init({ id }), extra: false })

const step = (
  model: Model,
  message: TableOfContents.Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
  const result = TableOfContents.update(model.toc, message, spy)

  return {
    model: { ...model, toc: result.model },
    commands: result.commands.map((command) =>
      Command.mapMessage(command, (lifted) => Message.GotToc({ message: lifted }))
    )
  }
}

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotToc: ({ message: inner }) => step(model, inner),
    AddedSection: () => step({ ...model, extra: true }, TableOfContents.Message.Reinitialized())
  })

const sections = [
  ["h1", "Getting started"],
  ["h2", "Installation"],
  ["h3", "With a package manager"],
  ["h3", "From a script tag"],
  ["h2", "Usage"],
  ["h1", "Components"],
  ["h2", "Buttons"]
] as const

const filler =
  "Every section has enough text to scroll, so the active control follows the heading at the top of the article."

const article = (h: HtmlBuilder<Message>, ui: Ui, model: Model): Html =>
  h.div(
    [h.Id(`${id}-article`), h.Style({ flex: "1", overflowY: "auto", height: "260px" })],
    [
      ...sections.flatMap(([tag, title]) => [h[tag]([], [title]), ui.Text(h, { mb: 160, children: [filler] })]),
      ...(model.extra ? [h.h2([], ["Added later"]), ui.Text(h, { mb: 160, children: [filler] })] : [])
    ]
  )

export const view = (
  model: Model,
  h: HtmlBuilder<Message>,
  ui: Ui,
  props: Values<typeof configurator.controls>
): Html =>
  ui.Group(h, {
    align: "flex-start",
    wrap: "nowrap",
    children: [
      article(h, ui, model),
      ui.Stack(h, {
        w: 220,
        gap: "xs",
        children: [
          ui.TableOfContents(h, {
            model: model.toc,
            toParentMessage: (message) => Message.GotToc({ message }),
            scrollSpyOptions: spy,
            getControlProps: ({ data, index }) => ({
              onClick: Message.GotToc({ message: TableOfContents.Message.ScrolledTo({ index }) }),
              children: data.value
            }),
            ...props
          })
        ]
      })
    ]
  })
