import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { isAllSelected, isSomeSelected, setSelection, toggle } from "../selection.ts"

const elements = ["Carbon", "Nitrogen", "Yttrium", "Barium", "Cerium"]

export const Model = Schema.Struct({ selection: Schema.Array(Schema.String) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Toggled: { name: Schema.String }, ToggledAll: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ selection: ["Nitrogen"] })

export const update = (model: Model, message: Message) =>
  Message.match(message, {
    Toggled: ({ name }) => ({ model: { selection: toggle(model.selection, name) } }),
    ToggledAll: () => ({
      model: { selection: isAllSelected(elements, model.selection) ? [] : setSelection(elements) }
    })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 320,
    mx: "auto",
    gap: "xs",
    children: [
      ui.Checkbox(h, {
        id: "selection-all",
        label: "Select all",
        checked: isAllSelected(elements, model.selection),
        indeterminate: isSomeSelected(elements, model.selection) && !isAllSelected(elements, model.selection),
        onChange: () => Message.ToggledAll()
      }),
      ...elements.map((name) =>
        ui.Checkbox(h, {
          id: `selection-${name}`,
          label: name,
          checked: model.selection.includes(name),
          onChange: () => Message.Toggled({ name })
        })
      ),
      ui.Text(h, { size: "sm", c: "dimmed", children: [`Selected: ${model.selection.join(", ") || "none"}`] })
    ]
  })
