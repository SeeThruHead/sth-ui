import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ value: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Chose: { value: Schema.String } })
export type Message = typeof Message.Type

export const init = (): Model => ({ value: "React" })

export const update = (
  _model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => ({
  model: { value: message.value },
  commands: []
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 340,
    mx: "auto",
    gap: "xs",
    children: [
      ui.NativeSelect(h, {
        id: "framework",
        label: "Input label",
        description: "Input description",
        value: model.value,
        onChange: (value) => Message.Chose({ value }),
        data: ["React", "Angular", "Vue"]
      }),
      ui.Text(h, { size: "sm", c: "dimmed", children: [`Selected: ${model.value}`] })
    ]
  })
