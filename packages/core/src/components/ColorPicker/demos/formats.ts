import { Option, Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import * as ColorPicker from "../ColorPicker.ts"
import * as SegmentedControl from "../../SegmentedControl/SegmentedControl.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({
  picker: ColorPicker.Model,
  value: Schema.String,
  control: SegmentedControl.Model,
  choice: Schema.Literals(["hex", "hexa", "rgb", "rgba", "hsl", "hsla"])
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotPicker: { message: ColorPicker.Message },
  GotControl: { message: SegmentedControl.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  picker: ColorPicker.init({ id: "formats", value: "#C5D899" }),
  value: "#C5D899",
  control: SegmentedControl.init({ id: "formats-control" }),
  choice: "hex"
})

const apply = (model: Model, out: ColorPicker.OutMessage): Model =>
  ColorPicker.OutMessage.match(out, {
    Changed: ({ value }) => ({ ...model, value }),
    ChangeEnded: () => model,
    SwatchClicked: () => model
  })

const formats: ReadonlyArray<ColorPicker.ColorFormat> = ["hex", "hexa", "rgb", "rgba", "hsl", "hsla"]

const choose = (model: Model, choice: string): Model => {
  const format = formats.filter((item) => item === choice).reduce((_, item) => item, model.choice)

  return { ...model, choice: format, value: ColorPicker.convertHsvaTo(format, model.picker.color) }
}

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotPicker: ({ message: inner }) => {
      const result = ColorPicker.update(model.picker, inner, { format: model.choice })

      return {
        model: result.outMessages.reduce(apply, { ...model, picker: result.model }),
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotPicker({ message: lifted }))
        )
      }
    },
    GotControl: ({ message: inner }) => {
      const result = SegmentedControl.update(model.control, inner)
      const next = { ...model, control: result.model }

      return {
        model: result.outMessage === undefined ? next : choose(next, result.outMessage.value),
        commands: (result.commands ?? []).map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotControl({ message: lifted }))
        )
      }
    }
  })

export const subscriptions = Subscription.lift(ColorPicker.subscriptions)<Model, Message>({
  read: (model) => Option.some(model.picker),
  toParentMessage: (message) => Message.GotPicker({ message })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.SegmentedControl(h, {
        model: model.control,
        toParentMessage: (message) => Message.GotControl({ message }),
        value: model.choice,
        ariaLabel: "Format",
        data: formats.map((format) => ({ value: format, label: format.toUpperCase() }))
      }),
      ui.ColorPicker(h, {
        model: model.picker,
        toParentMessage: (message) => Message.GotPicker({ message }),
        value: model.value,
        format: model.choice,
        name: "color",
        saturationLabel: "Saturation",
        hueLabel: "Hue",
        alphaLabel: "Alpha"
      }),
      ui.Text(h, { children: [model.value] })
    ]
  })
