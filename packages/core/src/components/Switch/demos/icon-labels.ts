import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { MoonStarsIcon } from "@sth-ui/icons/icons/MoonStarsIcon.ts"
import { SunIcon } from "@sth-ui/icons/icons/SunIcon.ts"
import { palette } from "../../../theme/palette.stylex.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ checked: Schema.Record(Schema.String, Schema.Boolean) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Toggled: { key: Schema.String, checked: Schema.Boolean } })
export type Message = typeof Message.Type

export const init = (): Model => ({ checked: {} })

export const update = (model: Model, message: Message) =>
  Message.match(message, {
    Toggled: ({ key, checked }) => ({ model: { checked: { ...model.checked, [key]: checked } } })
  })

const wire = (model: Model, key: string) => ({
  id: key,
  checked: model.checked[key] === true,
  onChange: (checked: boolean) => Message.Toggled({ key, checked })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Switch(h, {
    ...wire(model, "theme"),
    size: "md",
    color: "dark.4",
    onLabel: SunIcon(h, { size: 16, color: palette.yellow4 }),
    offLabel: MoonStarsIcon(h, { size: 16, color: palette.blue6 }),
    attributes: { track: { "aria-label": "Dark theme" } }
  })
