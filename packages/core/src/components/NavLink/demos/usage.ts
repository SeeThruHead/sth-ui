import type { Html, HtmlBuilder } from "foldkit/html"
import { CaretRightIcon } from "@sth-ui/icons/icons/CaretRightIcon.ts"
import { GaugeIcon } from "@sth-ui/icons/icons/GaugeIcon.ts"
import { HeartbeatIcon } from "@sth-ui/icons/icons/HeartbeatIcon.ts"
import { HouseIcon } from "@sth-ui/icons/icons/HouseIcon.ts"
import { ProhibitIcon } from "@sth-ui/icons/icons/ProhibitIcon.ts"
import type { NavLinkVariant } from "../NavLink.ts"
import type { Ui } from "../../../Ui.ts"

const caret = <M>(h: HtmlBuilder<M>) => CaretRightIcon(h, { size: 12 })

const actives: ReadonlyArray<readonly [string, NavLinkVariant]> = [
  ["Active subtle", "subtle"],
  ["Active light", "light"],
  ["Active filled", "filled"]
]

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    w: "100%",
    maw: 300,
    children: [
      ui.NavLink(h, { href: "#home", label: "With icon", leftSection: HouseIcon(h, { size: 16 }) }),
      ui.NavLink(h, {
        href: "#gauge",
        label: "With right section",
        leftSection: GaugeIcon(h, { size: 16 }),
        rightSection: caret(h)
      }),
      ui.NavLink(h, {
        href: "#disabled",
        label: "Disabled",
        leftSection: ProhibitIcon(h, { size: 16 }),
        disabled: true
      }),
      ui.NavLink(h, {
        href: "#described",
        label: "With description",
        description: "Additional information",
        leftSection: ui.Badge(h, { size: "xs", color: "red", circle: true, children: ["3"] })
      }),
      ...actives.map(([label, variant]) =>
        ui.NavLink(h, {
          href: "#active",
          label,
          variant,
          active: true,
          leftSection: HeartbeatIcon(h, { size: 16 }),
          rightSection: caret(h)
        })
      )
    ]
  })
