import { Option, Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import * as ColorPicker from "../ColorPicker.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ picker: ColorPicker.Model, value: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotPicker: { message: ColorPicker.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({
  picker: ColorPicker.init({ id: "usage", value: "rgba(47, 119, 150, 0.7)" }),
  value: "rgba(47, 119, 150, 0.7)"
})

const apply = (model: Model, out: ColorPicker.OutMessage): Model =>
  ColorPicker.OutMessage.match(out, {
    Changed: ({ value }) => ({ ...model, value }),
    ChangeEnded: () => model,
    SwatchClicked: () => model
  })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
  const result = ColorPicker.update(model.picker, message.message, { format: "rgba" })

  return {
    model: result.outMessages.reduce(apply, { ...model, picker: result.model }),
    commands: result.commands.map((command) =>
      Command.mapMessage(command, (lifted) => Message.GotPicker({ message: lifted }))
    )
  }
}

export const subscriptions = Subscription.lift(ColorPicker.subscriptions)<Model, Message>({
  read: (model) => Option.some(model.picker),
  toParentMessage: (message) => Message.GotPicker({ message })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.ColorPicker(h, {
        model: model.picker,
        toParentMessage: (message) => Message.GotPicker({ message }),
        value: model.value,
        format: "rgba",
        saturationLabel: "Saturation",
        hueLabel: "Hue",
        alphaLabel: "Alpha"
      }),
      ui.Text(h, { children: [model.value] })
    ]
  })
