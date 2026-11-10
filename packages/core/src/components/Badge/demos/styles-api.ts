import type { Html, HtmlBuilder } from "foldkit/html"
import * as stylex from "@stylexjs/stylex"
import { AtIcon } from "@sth-ui/icons/icons/AtIcon.ts"
import { badgeVars } from "../Badge.stylex.ts"
import type { Ui } from "../../../Ui.ts"

const custom = stylex.create({
  root: { [badgeVars.height]: "28px", [badgeVars.paddingX]: "14px", textTransform: "none", letterSpacing: "0px" },
  label: { fontStyle: "italic" },
  section: { color: "rgb(250, 82, 82)" }
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Badge(h, {
    leftSection: AtIcon(h, { size: 12 }),
    rightSection: AtIcon(h, { size: 12 }),
    styles: { root: custom.root, label: custom.label, section: custom.section },
    attributes: { root: { "aria-label": "Styled badge" } },
    children: ["Badge component"]
  })
