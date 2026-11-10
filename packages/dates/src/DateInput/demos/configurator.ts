import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { dates } from "../../Dates.ts"
import * as DateInput from "../model.ts"
import type { DateInputContext } from "../model.ts"

import { defineConfigurator } from "@sth-ui/core/stories/controls.ts"
import type { Values } from "@sth-ui/core/stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    {
      type: "select",
      prop: "variant",
      options: ["default", "filled", "unstyled"],
      initial: "default",
      library: "default"
    },
    { type: "size", prop: "size", initial: "sm", library: "sm" },
    { type: "size", prop: "radius", initial: "md", library: "md" },
    { type: "string", prop: "label", initial: "Input label", library: "" },
    { type: "boolean", prop: "withAsterisk", initial: false, library: false },
    { type: "string", prop: "description", initial: "Input description", library: "" },
    { type: "string", prop: "error", initial: "", library: "" }
  ],
  code: `dates.DateInput(h, {
{{props}}  model: model.plain,
  toParentMessage: (message) => Message.Got({ name: "plain", message }),
  today,
  placeholder: "Date input",
  minDate: "2024-01-01",
  maxDate: "2024-12-31"
})`
})

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

export const view = (
  model: Model,
  h: HtmlBuilder<Message>,
  ui: Ui,
  props: Values<typeof configurator.controls>
): Html =>
  ui.Box(h, {
    maw: 340,
    mx: "auto",
    children: [
      dates.DateInput(h, {
        model: model.plain,
        toParentMessage: (message) => Message.Got({ name: "plain", message }),
        today,
        placeholder: "Date input",
        minDate: "2024-01-01",
        maxDate: "2024-12-31",
        ...props
      })
    ]
  })
