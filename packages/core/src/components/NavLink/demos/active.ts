import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { CaretRightIcon } from "@sth-ui/icons/icons/CaretRightIcon.ts"
import { FingerprintIcon } from "@sth-ui/icons/icons/FingerprintIcon.ts"
import { GaugeIcon } from "@sth-ui/icons/icons/GaugeIcon.ts"
import { HeartbeatIcon } from "@sth-ui/icons/icons/HeartbeatIcon.ts"
import type { Icon } from "@sth-ui/icons/Icon.ts"
import type { NavLinkVariant } from "../NavLink.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ active: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ ChoseLink: { label: Schema.String } })
export type Message = typeof Message.Type

export const init = (): Model => ({ active: "Dashboard" })

export const update = (model: Model, message: Message) =>
  Message.match(message, { ChoseLink: ({ label }) => ({ model: { ...model, active: label } }) })

const links: ReadonlyArray<{
  readonly icon: Icon
  readonly label: string
  readonly description?: string
  readonly right?: boolean
}> = [
  { icon: GaugeIcon, label: "Dashboard", description: "Item with description" },
  { icon: FingerprintIcon, label: "Security", right: true },
  { icon: HeartbeatIcon, label: "Activity" }
]

const menu = (model: Model, h: HtmlBuilder<Message>, ui: Ui, variant: NavLinkVariant) =>
  ui.Box(h, {
    w: 220,
    children: links.map((link) =>
      ui.NavLink(h, {
        component: "button",
        label: link.label,
        variant,
        active: model.active === link.label,
        onClick: Message.ChoseLink({ label: link.label }),
        leftSection: link.icon(h, { size: 16 }),
        ...(link.description === undefined ? {} : { description: link.description }),
        ...(link.right === true ? { rightSection: CaretRightIcon(h, { size: 16 }) } : {})
      })
    )
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Group(h, { children: [menu(model, h, ui, "light"), menu(model, h, ui, "filled")] })
