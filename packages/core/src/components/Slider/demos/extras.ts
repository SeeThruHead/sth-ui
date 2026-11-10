import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Slider from "../Slider.ts"
import type { SliderContext } from "../Slider.ts"
import type { Ui } from "../../../Ui.ts"

const Entry = Schema.Struct({ slider: Slider.Model, value: Schema.Finite, ended: Schema.Finite })

export const Model = Schema.Struct({
  scaled: Entry,
  start: Entry,
  marks: Entry,
  domain: Entry,
  vertical: Entry,
  inverted: Entry
})
export type Model = typeof Model.Type

type Name = keyof Model

export const Message = defineMessageUnion({
  Got: {
    name: Schema.Literals(["scaled", "start", "marks", "domain", "vertical", "inverted"]),
    message: Slider.Message
  }
})
export type Message = typeof Message.Type

const entry = (id: string, min: number, max: number, value: number, step = 1) => ({
  slider: Slider.init({ id, min, max, step }),
  value,
  ended: value
})

export const init = (): Model => ({
  scaled: entry("scaled", 10, 30, 10),
  start: entry("start", -50, 50, 40),
  marks: entry("marks", 0, 100, 25),
  domain: entry("domain", 0, 100, 50, 0.5),
  vertical: entry("vertical", -50, 50, -30),
  inverted: entry("inverted", 0, 100, 60)
})

const markValues = [
  { value: 5 },
  { value: 15 },
  { value: 25 },
  { value: 35 },
  { value: 70 },
  { value: 80 },
  { value: 90 }
]

const contexts: Readonly<Record<Name, (value: number) => SliderContext>> = {
  scaled: (value) => ({ value }),
  start: (value) => ({ value }),
  marks: (value) => ({ value, marks: markValues, restrictToMarks: true }),
  domain: (value) => ({ value, domain: [20, 80], precision: 0 }),
  vertical: (value) => ({ value }),
  inverted: (value) => ({ value })
}

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
  const current = model[message.name]
  const result = Slider.updateWith(current.slider, message.message, contexts[message.name](current.value))
  const next = result.outMessages.reduce(
    (state, out) => (out._tag === "ChangedValue" ? { ...state, value: out.value } : { ...state, ended: out.value }),
    { ...current, slider: result.model }
  )

  return {
    model: { ...model, [message.name]: next },
    commands: result.commands.map((command) =>
      Command.mapMessage(command, (lifted) => Message.Got({ name: message.name, message: lifted }))
    )
  }
}

const bytes = (value: number): string => {
  const units = ["B", "KB", "MB", "GB", "TB"]
  const index = Math.min(units.length - 1, Math.floor(Math.log(value) / Math.log(1024)))

  return `${(value / 1024 ** index).toFixed(1)} ${units[index] ?? "B"}`
}

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html => {
  const props = (name: Name) => ({
    model: model[name].slider,
    value: model[name].value,
    toParentMessage: (message: Slider.Message) => Message.Got({ name, message })
  })

  return ui.Stack(h, {
    maw: 400,
    mx: "auto",
    gap: "xl",
    children: [
      ui.Slider(h, {
        ...props("scaled"),
        scale: (value) => 2 ** value,
        label: bytes,
        labelAlwaysOn: true,
        thumbLabel: "Scaled",
        thumbValueText: bytes
      }),
      ui.Slider(h, {
        ...props("start"),
        startPointValue: 0,
        labelAlwaysOn: true,
        thumbLabel: "Start point",
        marks: [{ value: -25 }, { value: 25 }]
      }),
      ui.Slider(h, { ...props("marks"), marks: markValues, thumbLabel: "Restricted" }),
      ui.Slider(h, { ...props("domain"), thumbLabel: "Domain", marks: [{ value: 20 }, { value: 80 }] }),
      ui.Text(h, {
        size: "sm",
        children: [`Value: ${model.domain.value}, change end: ${model.domain.ended}`]
      }),
      ui.Group(h, {
        h: 160,
        children: [
          ui.Slider(h, {
            ...props("vertical"),
            startPointValue: 0,
            orientation: "vertical",
            thumbLabel: "Vertical start"
          }),
          ui.Slider(h, {
            ...props("inverted"),
            inverted: true,
            thumbLabel: "Inverted",
            marks: [{ value: 50 }, { value: 80 }]
          })
        ]
      })
    ]
  })
}
