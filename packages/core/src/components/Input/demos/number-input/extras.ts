import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { stepNumber } from "../../NumberInput.ts"
import type { NumberInputValue } from "../../NumberInput.ts"
import type { Ui } from "../../../../Ui.ts"

const Value = Schema.Union([Schema.Finite, Schema.String])

export const Model = Schema.Struct({ values: Schema.Record(Schema.String, Value) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Changed: { key: Schema.String, value: Value } })
export type Message = typeof Message.Type

export const init = (): Model => ({ values: {} })

export const update = (model: Model, message: Message) =>
  Message.match(message, {
    Changed: ({ key, value }) => ({ model: { values: { ...model.values, [key]: value } } })
  })

const wire = (model: Model, key: string) => ({
  id: key,
  value: model.values[key] ?? "",
  onChange: (value: NumberInputValue) => Message.Changed({ key, value })
})

const customStep = (model: Model, direction: 1 | -1) => {
  const current = model.values["custom"] ?? 5

  return Message.Changed({
    key: "custom",
    value: stepNumber(Number(current), direction, { step: 1, min: 0, max: 10 })
  })
}

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 340,
    mx: "auto",
    children: [
      ui.NumberInput(h, {
        ...wire(model, "lakh"),
        label: "Lakh grouping",
        thousandSeparator: true,
        thousandsGroupStyle: "lakh",
        value: model.values["lakh"] ?? 1234567
      }),
      ui.NumberInput(h, {
        ...wire(model, "wan"),
        label: "Wan grouping",
        thousandSeparator: true,
        thousandsGroupStyle: "wan",
        value: model.values["wan"] ?? 1234567
      }),
      ui.NumberInput(h, {
        ...wire(model, "zeros"),
        label: "Leading zeros kept",
        trimLeadingZeroesOnBlur: false
      }),
      ui.NumberInput(h, { ...wire(model, "trimmed"), label: "No leading zeros", allowLeadingZeros: false }),
      ui.NumberInput(h, {
        ...wire(model, "allowed"),
        label: "Up to 100",
        selectAllOnFocus: true,
        isAllowed: ({ floatValue }) => floatValue === undefined || floatValue <= 100
      }),
      ui.NumberInput(h, {
        ...wire(model, "hold"),
        label: "Hold to step",
        stepHoldDelay: 300,
        stepHoldInterval: 50,
        value: model.values["hold"] ?? 0
      }),
      ui.Group(h, {
        gap: "xs",
        wrap: "nowrap",
        children: [
          ui.Button(h, { variant: "default", onClick: customStep(model, -1), children: ["Decrement"] }),
          ui.NumberInput(h, {
            ...wire(model, "custom"),
            label: "Custom controls",
            hideControls: true,
            min: 0,
            max: 10,
            value: model.values["custom"] ?? 5
          }),
          ui.Button(h, { variant: "default", onClick: customStep(model, 1), children: ["Increment"] })
        ]
      })
    ]
  })
