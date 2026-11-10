import { Option, Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as PillsInput from "../PillsInput.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({
  filled: PillsInput.Model,
  hidden: PillsInput.Model,
  auto: PillsInput.Model,
  locked: PillsInput.Model,
  keys: Schema.Array(Schema.String)
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotFilled: { message: PillsInput.Message },
  GotHidden: { message: PillsInput.Message },
  GotAuto: { message: PillsInput.Message },
  GotLocked: { message: PillsInput.Message },
  Pressed: { key: Schema.String },
  Focused: {},
  Left: {}
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  filled: PillsInput.init({ id: "filled" }),
  hidden: PillsInput.init({ id: "hidden" }),
  auto: PillsInput.init({ id: "auto" }),
  locked: PillsInput.init({ id: "locked" }),
  keys: []
})

type Slot = "filled" | "hidden" | "auto" | "locked"

const lift = (slot: Slot) => (message: PillsInput.Message) =>
  ({
    filled: Message.GotFilled({ message }),
    hidden: Message.GotHidden({ message }),
    auto: Message.GotAuto({ message }),
    locked: Message.GotLocked({ message })
  })[slot]

const step = (model: Model, slot: Slot, inner: PillsInput.Message) => {
  const result = PillsInput.update(model[slot], inner)

  return {
    model: { ...model, [slot]: result.model },
    commands: result.commands.map((command) => Command.mapMessage(command, lift(slot)))
  }
}

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotFilled: ({ message: inner }) => step(model, "filled", inner),
    GotHidden: ({ message: inner }) => step(model, "hidden", inner),
    GotAuto: ({ message: inner }) => step(model, "auto", inner),
    GotLocked: ({ message: inner }) => step(model, "locked", inner),
    Pressed: ({ key }) => ({ model: { ...model, keys: [...model.keys, key] }, commands: [] }),
    Focused: () => ({ model: { ...model, keys: [...model.keys, "focus"] }, commands: [] }),
    Left: () => ({ model: { ...model, keys: [...model.keys, "blur"] }, commands: [] })
  })

const pills = (h: HtmlBuilder<Message>, ui: Ui, variant: "default" | "contrast") =>
  ["React", "Vue"].map((name) => ui.Pill(h, { variant, children: [name] }))

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      ui.PillsInput(h, {
        model: model.filled,
        toParentMessage: lift("filled"),
        label: "Filled",
        description: "Pills use the contrast variant here",
        error: "Pick at least three",
        variant: "filled",
        size: "lg",
        pills: pills(h, ui, "contrast"),
        field: {
          placeholder: "Type",
          pointer: true,
          onKeyDown: (key) => (key === "Enter" ? Option.some(Message.Pressed({ key })) : Option.none()),
          onFocus: Message.Focused(),
          onBlur: Message.Left()
        }
      }),
      ui.PillsInput(h, {
        model: model.hidden,
        toParentMessage: lift("hidden"),
        label: "Hidden field",
        pills: pills(h, ui, "default"),
        field: { type: "hidden" }
      }),
      ui.PillsInput(h, {
        model: model.auto,
        toParentMessage: lift("auto"),
        label: "Auto field",
        pills: pills(h, ui, "default"),
        field: { type: "auto", placeholder: "Shown on focus" }
      }),
      ui.PillsInput(h, {
        model: model.locked,
        toParentMessage: lift("locked"),
        label: "Disabled",
        disabled: true,
        pills: pills(h, ui, "default"),
        field: { pointer: true }
      }),
      ui.PillsInput(h, {
        model: PillsInput.init({ id: "empty" }),
        toParentMessage: lift("locked"),
        label: "No field",
        pills: []
      }),
      h.div([h.DataAttribute("keys", "")], [model.keys.join(",")])
    ]
  })
