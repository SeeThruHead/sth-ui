import { Option, Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import * as ColorPicker from "../ColorPicker.ts"
import type { Ui } from "../../../Ui.ts"

const swatches = [
  "#2e2e2e",
  "#868e96",
  "#fa5252",
  "#e64980",
  "#be4bdb",
  "#7950f2",
  "#4c6ef5",
  "#228be6",
  "#15aabf",
  "#12b886",
  "#40c057",
  "#82c91e",
  "#fab005",
  "#fd7e14"
]

export const Model = Schema.Struct({ picker: ColorPicker.Model, value: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotPicker: { message: ColorPicker.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({ picker: ColorPicker.init({ id: "states", value: "#3297c2" }), value: "#3297c2" })

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
  const result = ColorPicker.update(model.picker, message.message, {})

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
        swatches,
        focusable: false
      }),
      ui.Text(h, { children: [model.value] })
    ]
  })
