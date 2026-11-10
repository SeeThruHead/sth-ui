import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ hovered: Schema.Int, clicked: Schema.Int })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Hovered: { index: Schema.Int }, Clicked: { index: Schema.Int } })
export type Message = typeof Message.Type

export const init = (): Model => ({ hovered: -1, clicked: -1 })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Hovered: ({ index }) => ({ model: { ...model, hovered: index }, commands: [] }),
    Clicked: ({ index }) => ({ model: { ...model, clicked: index }, commands: [] })
  })

const section = (value: number, color: string, index: number) => ({
  value,
  color,
  onMouseEnter: Message.Hovered({ index }),
  onMouseLeave: Message.Hovered({ index: -1 }),
  onClick: Message.Clicked({ index })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.RingProgress(h, {
        size: 140,
        sections: [section(40, "cyan", 0), section(20, "blue", 1), section(15, "indigo", 2)]
      }),
      ui.Text(h, { children: [`Hovered section: ${model.hovered === -1 ? "none" : model.hovered}`] }),
      ui.Text(h, { children: [`Clicked section: ${model.clicked === -1 ? "none" : model.clicked}`] })
    ]
  })
