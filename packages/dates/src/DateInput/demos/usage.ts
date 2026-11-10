import * as stylex from "@stylexjs/stylex"
import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { dates } from "../../Dates.ts"
import * as DateInput from "../model.ts"
import type { DateInputContext } from "../model.ts"

const bold = stylex.create({ input: { fontWeight: 700 } })

const today = "2024-05-09"

const contexts: Readonly<Record<"plain" | "clearable" | "formatted" | "locked", DateInputContext>> = {
  plain: { minDate: "2024-01-01", maxDate: "2024-12-31" },
  clearable: { clearable: true },
  formatted: { valueFormat: "DD/MM/YYYY", fixOnBlur: false },
  locked: {}
}

export const Model = Schema.Struct({
  plain: DateInput.Model,
  clearable: DateInput.Model,
  formatted: DateInput.Model,
  locked: DateInput.Model
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Got: { name: Schema.Literals(["plain", "clearable", "formatted", "locked"]), message: DateInput.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  plain: DateInput.init({ id: "plain", today }, contexts.plain),
  clearable: DateInput.init({ id: "clearable", today, value: "2024-05-14" }, contexts.clearable),
  formatted: DateInput.init({ id: "formatted", today }, contexts.formatted),
  locked: DateInput.init({ id: "locked", today, value: "2024-05-03" })
})

export const update = (model: Model, message: Message): { readonly model: Model } => ({
  model: {
    ...model,
    [message.name]: DateInput.update(model[message.name], message.message, contexts[message.name]).model
  }
})

const value = (model: DateInput.Model) => `Value: ${model.value ?? "none"}`

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 340,
    mx: "auto",
    children: [
      dates.DateInput(h, {
        model: model.plain,
        toParentMessage: (message) => Message.Got({ name: "plain", message }),
        today,
        label: "Date input",
        description: "Within 2024",
        placeholder: "Date input",
        minDate: "2024-01-01",
        maxDate: "2024-12-31"
      }),
      ui.Text(h, { size: "sm", children: [value(model.plain)] }),
      dates.DateInput(h, {
        model: model.clearable,
        toParentMessage: (message) => Message.Got({ name: "clearable", message }),
        today,
        label: "Clearable",
        clearable: true,
        name: "clearable",
        presets: [
          { value: "2024-05-01", label: "May Day" },
          { value: null, label: "None" }
        ]
      }),
      ui.Text(h, { size: "sm", children: [value(model.clearable)] }),
      dates.DateInput(h, {
        model: model.formatted,
        toParentMessage: (message) => Message.Got({ name: "formatted", message }),
        today,
        label: "Day first",
        placeholder: "DD/MM/YYYY",
        withinPortal: false,
        size: "md",
        styles: { input: bold.input }
      }),
      ui.Text(h, { size: "sm", children: [value(model.formatted)] }),
      dates.DateInput(h, {
        model: model.locked,
        toParentMessage: (message) => Message.Got({ name: "locked", message }),
        today,
        label: "Read only",
        readOnly: true,
        clearable: true
      })
    ]
  })
