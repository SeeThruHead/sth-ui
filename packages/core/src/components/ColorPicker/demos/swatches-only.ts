import { Option, Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import * as ColorPicker from "../ColorPicker.ts"
import type { Ui } from "../../../Ui.ts"

const swatches = [
  "#fff5f5",
  "#ffe3e3",
  "#ffc9c9",
  "#ffa8a8",
  "#ff8787",
  "#ff6b6b",
  "#fa5252",
  "#ebfbee",
  "#d3f9d8",
  "#b2f2bb",
  "#8ce99a",
  "#69db7c",
  "#51cf66",
  "#40c057",
  "#e7f5ff",
  "#d0ebff",
  "#a5d8ff",
  "#74c0fc",
  "#4dabf7",
  "#339af0",
  "#228be6"
]

export const Model = Schema.Struct({ picker: ColorPicker.Model, value: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotPicker: { message: ColorPicker.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({ picker: ColorPicker.init({ id: "swatches-only", value: "#fff" }), value: "#fff" })

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
  const result = ColorPicker.update(model.picker, message.message, { format: "hex" })

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
    w: "100%",
    maw: 400,
    children: [
      ui.ColorPicker(h, {
        model: model.picker,
        toParentMessage: (message) => Message.GotPicker({ message }),
        value: model.value,
        format: "hex",
        withPicker: false,
        fullWidth: true,
        swatches,
        saturationLabel: "Saturation",
        hueLabel: "Hue",
        alphaLabel: "Alpha"
      }),
      ui.Text(h, { children: [model.value] })
    ]
  })
