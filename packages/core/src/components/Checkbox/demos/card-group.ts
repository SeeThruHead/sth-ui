import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"
import { cardContent, cardStyles } from "./cards.ts"

const packages = [
  { name: "mantine/core", description: "Core components library: inputs, buttons, overlays, etc." },
  { name: "mantine/hooks", description: "Collection of reusable hooks for React applications." },
  { name: "mantine/notifications", description: "Notifications system" }
]

export const Model = Schema.Struct({ value: Schema.Array(Schema.String) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Toggled: { name: Schema.String, checked: Schema.Boolean } })
export type Message = typeof Message.Type

export const init = (): Model => ({ value: [] })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => ({
  model: {
    value: message.checked ? [...model.value, message.name] : model.value.filter((name) => name !== message.name)
  },
  commands: []
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    maw: 400,
    mx: "auto",
    children: [
      ui.Text(h, { fw: 500, size: "sm", children: ["Pick packages to install"] }),
      ui.Text(h, { size: "xs", c: "dimmed", children: ["Choose all packages that you will need in your application"] }),
      ui.Stack(h, {
        pt: "md",
        gap: "xs",
        children: packages.map((item) => {
          const checked = model.value.includes(item.name)

          return ui.CheckboxCard(h, {
            checked,
            value: item.name,
            onChange: (next) => Message.Toggled({ name: item.name, checked: next }),
            styles: cardStyles(checked),
            children: cardContent(h, ui, item.name, item.description)
          })
        })
      }),
      ui.Text(h, { fz: "xs", mt: "md", children: [`CurrentValue: ${model.value.join(", ") || "–"}`] })
    ]
  })
