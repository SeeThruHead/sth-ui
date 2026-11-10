import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { AtIcon } from "@sth-ui/icons/icons/AtIcon.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ value: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ ChangedValue: { value: Schema.String }, Cleared: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ value: "Clear me" })

export const update = (model: Model, message: Message) =>
  Message.match(message, {
    ChangedValue: ({ value }) => ({ model: { ...model, value } }),
    Cleared: () => ({ model: { ...model, value: "" } })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    w: "100%",
    maw: 340,
    children: [
      ui.Input(h, { placeholder: "Your email", leftSection: AtIcon(h, { size: 16 }) }),
      ui.Input(h, {
        placeholder: "Clearable input",
        value: model.value,
        onInput: (value) => Message.ChangedValue({ value }),
        rightSectionPointerEvents: "all",
        mt: "md",
        ...(model.value === ""
          ? {}
          : { rightSection: ui.InputClearButton(h, { label: "Clear input", onClick: Message.Cleared() }) })
      })
    ]
  })
