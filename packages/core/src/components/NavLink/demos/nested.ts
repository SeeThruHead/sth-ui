import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { FingerprintIcon } from "@sth-ui/icons/icons/FingerprintIcon.ts"
import { GaugeIcon } from "@sth-ui/icons/icons/GaugeIcon.ts"
import type { Ui } from "../../../Ui.ts"

const Section = Schema.Literals(["first", "inner", "second"])
type Section = typeof Section.Type

export const Model = Schema.Struct({ opened: Schema.Array(Section) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Toggled: { section: Section, opened: Schema.Boolean } })
export type Message = typeof Message.Type

export const init = (): Model => ({ opened: ["second"] })

export const update = (model: Model, message: Message) =>
  Message.match(message, {
    Toggled: ({ section, opened }) => ({
      model: { opened: opened ? [...model.opened, section] : model.opened.filter((open) => open !== section) }
    })
  })

const toggles = (model: Model, section: Section) => ({
  opened: model.opened.includes(section),
  onChange: (opened: boolean) => Message.Toggled({ section, opened })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    w: "100%",
    maw: 300,
    children: [
      ui.NavLink(h, {
        id: "first-parent",
        label: "First parent link",
        leftSection: GaugeIcon(h, { size: 16 }),
        childrenOffset: 28,
        ...toggles(model, "first"),
        children: [
          ui.NavLink(h, { href: "#first", label: "First child link" }),
          ui.NavLink(h, { href: "#second", label: "Second child link" }),
          ui.NavLink(h, {
            label: "Nested parent link",
            childrenOffset: 28,
            ...toggles(model, "inner"),
            children: [
              ui.NavLink(h, { href: "#inner-first", label: "First child link" }),
              ui.NavLink(h, { href: "#inner-second", label: "Second child link" }),
              ui.NavLink(h, { href: "#inner-third", label: "Third child link" })
            ]
          })
        ]
      }),
      ui.NavLink(h, {
        label: "Second parent link",
        leftSection: FingerprintIcon(h, { size: 16 }),
        childrenOffset: 28,
        ...toggles(model, "second"),
        children: [
          ui.NavLink(h, { href: "#a", label: "First child link" }),
          ui.NavLink(h, { href: "#b", label: "Second child link" }),
          ui.NavLink(h, { href: "#c", label: "Third child link" })
        ]
      })
    ]
  })
