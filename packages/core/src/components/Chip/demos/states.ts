import type { Html, HtmlBuilder } from "foldkit/html"
import { Schema } from "effect"
import { defineMessageUnion } from "foldkit/message"
import type { ChipVariant } from "../Chip.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Ignored: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({})

export const update = (model: Model, _message: Message) => ({ model })

const names: { readonly [Variant in ChipVariant]: string } = { outline: "Outline", light: "Light", filled: "Filled" }

const row = (h: HtmlBuilder<Message>, ui: Ui, variant: ChipVariant) =>
  ui.ChipGroup(h, {
    multiple: true,
    value: ["checked", "checked-disabled"],
    onChange: () => Message.Ignored(),
    children: (chip) => [
      ui.Group(h, {
        justify: "center",
        mt: variant === "outline" ? 0 : "md",
        children: [
          chip("default", { variant, children: [`${names[variant]} default`] }),
          chip("checked", { variant, children: [`${names[variant]} checked`] }),
          chip("checked-disabled", { variant, disabled: true, children: [`${names[variant]} checked disabled`] })
        ]
      })
    ]
  })

export const view = (_model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, { children: [row(h, ui, "outline"), row(h, ui, "light"), row(h, ui, "filled")] })
