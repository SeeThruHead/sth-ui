import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { BiohazardIcon } from "@sth-ui/icons/icons/BiohazardIcon.ts"
import { RadioactiveIcon } from "@sth-ui/icons/icons/RadioactiveIcon.ts"
import type { CheckboxIcon } from "../Checkbox.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ checked: Schema.Record(Schema.String, Schema.Boolean) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Toggled: { key: Schema.String, checked: Schema.Boolean } })
export type Message = typeof Message.Type

export const init = (): Model => ({ checked: { icon: true } })

export const update = (model: Model, message: Message) =>
  Message.match(message, {
    Toggled: ({ key, checked }) => ({ model: { checked: { ...model.checked, [key]: checked } } })
  })

const wire = (model: Model, key: string) => ({
  id: key,
  checked: model.checked[key] === true,
  onChange: (checked: boolean) => Message.Toggled({ key, checked })
})

const hazardIcon: CheckboxIcon = (h, indeterminate) => (indeterminate ? RadioactiveIcon(h, {}) : BiohazardIcon(h, {}))

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    gap: "sm",
    children: [
      ui.Checkbox(h, { ...wire(model, "icon"), icon: hazardIcon, label: "Custom icon" }),
      ui.Checkbox(h, {
        ...wire(model, "icon-indeterminate"),
        icon: hazardIcon,
        indeterminate: true,
        label: "Custom icon: indeterminate"
      })
    ]
  })
