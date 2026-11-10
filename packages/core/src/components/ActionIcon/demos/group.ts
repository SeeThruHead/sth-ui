import type { Html, HtmlBuilder } from "foldkit/html"
import { groupActionIcon, groupActionIconSection } from "../ActionIconGroup.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "flex-start",
    children: [
      ui.ActionIconGroup(h, {
        attributes: { group: { "aria-label": "Counter" } },
        children: [
          groupActionIcon({ variant: "default", label: "Decrease", children: ["−"] }),
          groupActionIconSection({ variant: "default", size: "md", children: ["12"] }),
          groupActionIcon({ variant: "default", label: "Increase", children: ["+"] })
        ]
      }),
      ui.ActionIconGroup(h, {
        orientation: "vertical",
        borderWidth: 2,
        attributes: { group: { "aria-label": "Tools" } },
        children: [
          groupActionIcon({ variant: "outline", size: "lg", label: "Up", children: ["↑"] }),
          groupActionIconSection({ variant: "outline", size: "lg", w: 34, children: ["3"] }),
          groupActionIconSection({ variant: "outline", w: 34, children: ["sm"] })
        ]
      })
    ]
  })
