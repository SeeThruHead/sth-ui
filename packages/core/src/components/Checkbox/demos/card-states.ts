import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ toggles: Schema.Int })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Toggled: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ toggles: 0 })

export const update = (
  model: Model,
  _message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => ({
  model: { toggles: model.toggles + 1 },
  commands: []
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 400,
    mx: "auto",
    gap: "xs",
    children: [
      ui.CheckboxCard(h, {
        checked: false,
        indeterminate: true,
        withBorder: false,
        radius: "xl",
        onChange: () => Message.Toggled(),
        children: [ui.Group(h, { children: [ui.CheckboxIndicator(h, { indeterminate: true }), "Some packages"] })]
      }),
      ui.CheckboxCard(h, {
        checked: true,
        disabled: true,
        onChange: () => Message.Toggled(),
        children: [ui.Group(h, { children: [ui.CheckboxIndicator(h, { checked: true, disabled: true }), "Locked"] })]
      }),
      ui.Text(h, { size: "xs", children: [`Toggled ${model.toggles} times`] })
    ]
  })
