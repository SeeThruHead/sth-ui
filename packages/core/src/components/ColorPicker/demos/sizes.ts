import { Option, Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import * as ColorPicker from "../ColorPicker.ts"
import * as SegmentedControl from "../../SegmentedControl/SegmentedControl.ts"
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

export const Model = Schema.Struct({
  picker: ColorPicker.Model,
  value: Schema.String,
  control: SegmentedControl.Model,
  choice: Schema.Literals(["xs", "sm", "md", "lg", "xl"])
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotPicker: { message: ColorPicker.Message },
  GotControl: { message: SegmentedControl.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  picker: ColorPicker.init({ id: "sizes", value: "rgba(50, 151, 194, 1)" }),
  value: "rgba(50, 151, 194, 1)",
  control: SegmentedControl.init({ id: "sizes-control" }),
  choice: "sm"
})

const apply = (model: Model, out: ColorPicker.OutMessage): Model =>
  ColorPicker.OutMessage.match(out, {
    Changed: ({ value }) => ({ ...model, value }),
    ChangeEnded: () => model,
    SwatchClicked: () => model
  })

const sizes: ReadonlyArray<"xs" | "sm" | "md" | "lg" | "xl"> = ["xs", "sm", "md", "lg", "xl"]

const choose = (model: Model, choice: string): Model => ({
  ...model,
  choice: sizes.filter((item) => item === choice).reduce((_, item) => item, model.choice)
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotPicker: ({ message: inner }) => {
      const result = ColorPicker.update(model.picker, inner, { format: "rgba" })

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
        ariaLabel: "Size",
        data: sizes.map((size) => ({ value: size, label: size }))
      }),
      ui.ColorPicker(h, {
        model: model.picker,
        toParentMessage: (message) => Message.GotPicker({ message }),
        value: model.value,
        format: "rgba",
        size: model.choice,
        swatches,
        saturationLabel: "Saturation",
        hueLabel: "Hue",
        alphaLabel: "Alpha"
      })
    ]
  })
