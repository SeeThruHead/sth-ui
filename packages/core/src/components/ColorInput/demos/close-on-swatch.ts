import { Array as Arr, Option, Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import * as ColorInput from "../ColorInput.ts"
import type { ColorInputProps } from "../ColorInput.ts"
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

type Entry = Omit<ColorInputProps<Message>, "model" | "toParentMessage" | "value"> & { readonly id: string }

const entries: ReadonlyArray<Entry> = [
  {
    id: "close-on-swatch",
    closeOnColorSwatchClick: true,
    label: "Dropdown is closed when color swatch is clicked",
    placeholder: "Click color swatch",
    swatches
  }
]

const extras = (_h: HtmlBuilder<Message>): ReadonlyArray<Partial<Entry>> => []

export const Model = Schema.Struct({
  inputs: Schema.Array(ColorInput.Model),
  values: Schema.Array(Schema.String),
  ended: Schema.String
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotInput: { index: Schema.Int, message: ColorInput.Message },
  GotOpened: { message: ColorInput.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  inputs: entries.map((entry) => ColorInput.init({ id: entry.id, value: "" })),
  values: entries.map(() => ""),
  ended: ""
})

type Step = {
  readonly input: ColorInput.Model
  readonly value: string
  readonly ended: Option.Option<string>
  readonly commands: ReadonlyArray<Command.Command<ColorInput.Message>>
}

const step = (entry: Entry, input: ColorInput.Model, value: string, message: ColorInput.Message): Step => {
  const result = ColorInput.update(input, message, ColorInput.colorInputContext({ ...entry, value }))

  return result.outMessages.reduce<Step>(
    (state, out) =>
      ColorInput.OutMessage.match(out, {
        Changed: (changed) => ({ ...state, value: changed.value }),
        ChangeEnded: (ended) => ({ ...state, ended: Option.some(ended.value) })
      }),
    { input: result.model, value, ended: Option.none(), commands: result.commands }
  )
}

const stepAt = (
  model: Model,
  index: number,
  message: ColorInput.Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
  const steps = Arr.zip(entries, Arr.zip(model.inputs, model.values)).map(([entry, [input, value]], at) =>
    at === index ? step(entry, input, value, message) : { input, value, ended: Option.none(), commands: [] }
  )

  return {
    model: {
      inputs: steps.map((done) => done.input),
      values: steps.map((done) => done.value),
      ended: steps.reduce((ended, done) => Option.getOrElse(done.ended, () => ended), model.ended)
    },
    commands: steps.flatMap((done) =>
      done.commands.map((command) =>
        Command.mapMessage(command, (lifted) => Message.GotInput({ index, message: lifted }))
      )
    )
  }
}

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotInput: ({ index, message: inner }) => stepAt(model, index, inner),
    GotOpened: ({ message: inner }) =>
      stepAt(
        model,
        model.inputs.findIndex((input) => input.opened),
        inner
      )
  })

export const subscriptions = Subscription.lift(ColorInput.subscriptions)<Model, Message>({
  read: (model) => Option.fromNullishOr(model.inputs.find((input) => input.opened)),
  toParentMessage: (message) => Message.GotOpened({ message })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    w: "100%",
    maw: 320,
    mx: "auto",
    children: Arr.zip(entries, Arr.zip(model.inputs, model.values)).map(([entry, [input, value]], index) =>
      ui.ColorInput(h, {
        ...entry,
        ...extras(h)[index],
        model: input,
        value,
        toParentMessage: (message) => Message.GotInput({ index, message })
      })
    )
  })
