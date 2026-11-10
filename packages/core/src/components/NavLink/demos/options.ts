import type { Html, HtmlBuilder } from "foldkit/html"
import { CaretRightIcon } from "@sth-ui/icons/icons/CaretRightIcon.ts"
import { HouseIcon } from "@sth-ui/icons/icons/HouseIcon.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    w: 200,
    children: [
      ui.NavLink(h, {
        href: "#long",
        noWrap: true,
        label: "A label far too long for the sidebar",
        description: "And a description that is longer still"
      }),
      ui.NavLink(h, { component: "button", label: "Sign out" }),
      ui.NavLink(h, {
        href: "#lime",
        label: "Lime",
        color: "lime",
        variant: "filled",
        autoContrast: true,
        active: true
      }),
      ui.NavLink(h, {
        label: "Unmounted when closed",
        keepMounted: false,
        disableRightSectionRotation: true,
        rightSection: CaretRightIcon(h, { size: 12 }),
        children: [ui.NavLink(h, { href: "#hidden", label: "Not in the page" })]
      }),
      ui.NavLink(h, {
        label: "Opened, still",
        opened: true,
        disableRightSectionRotation: true,
        children: [ui.NavLink(h, { href: "#shown", label: "Shown" })]
      }),
      ui.NavLink(h, { component: "button", label: "Disabled button", disabled: true }),
      ui.NavLink(h, {
        href: "#home",
        leftSection: HouseIcon(h, { size: 16 }),
        attributes: { root: { "aria-label": "Home" } }
      })
    ]
  })
