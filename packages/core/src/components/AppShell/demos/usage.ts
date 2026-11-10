import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { appShellHeader, appShellMain, appShellNavbar, appShellSection } from "../AppShell.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ opened: Schema.Boolean, page: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ ToggledNavbar: {}, ChosePage: { page: Schema.String } })
export type Message = typeof Message.Type

export const init = (): Model => ({ opened: false, page: "Dashboard" })

export const update = (model: Model, message: Message) =>
  Message.match(message, {
    ToggledNavbar: () => ({ model: { ...model, opened: !model.opened } }),
    ChosePage: ({ page }) => ({ model: { ...model, page } })
  })

const pages = ["Dashboard", "Projects", "Messages", "Settings"]

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.AppShell(h, {
    header: { height: 60 },
    navbar: { width: 300, breakpoint: "sm", collapsed: { mobile: !model.opened } },
    padding: "md",
    children: [
      appShellHeader({
        children: [
          ui.Group(h, {
            h: "100%",
            px: "md",
            children: [
              ui.Box(h, {
                hiddenFrom: "sm",
                children: [
                  ui.Burger(h, {
                    size: "sm",
                    opened: model.opened,
                    onClick: Message.ToggledNavbar(),
                    label: "Toggle navigation"
                  })
                ]
              }),
              ui.Text(h, { fw: 700, children: ["Header"] })
            ]
          })
        ]
      }),
      appShellNavbar({
        children: [
          appShellSection({ children: [ui.Text(h, { p: "md", fw: 600, children: ["Navbar header"] })] }),
          appShellSection({
            grow: true,
            component: "div",
            children: pages.map((page) =>
              ui.NavLink(h, {
                component: "button",
                label: page,
                active: model.page === page,
                onClick: Message.ChosePage({ page })
              })
            )
          }),
          appShellSection({
            children: [
              ui.Text(h, { p: "md", c: "dimmed", size: "sm", children: ["Navbar footer, always at the bottom"] })
            ]
          })
        ]
      }),
      appShellMain({
        children: [
          ui.Text(h, { children: ["This is the main section, your app content here."] }),
          ...Array.from({ length: 6 }, (_, row) =>
            ui.Skeleton(h, {
              h: 28,
              mt: "sm",
              animate: false,
              attributes: { root: { "aria-label": `Loading row ${row + 1}` } }
            })
          )
        ]
      })
    ]
  })
