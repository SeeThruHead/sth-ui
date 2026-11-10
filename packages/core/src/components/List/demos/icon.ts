import type { Html, HtmlBuilder } from "foldkit/html"
import { CheckCircleIcon } from "@sth-ui/icons/icons/CheckCircleIcon.ts"
import { CircleDashedIcon } from "@sth-ui/icons/icons/CircleDashedIcon.ts"
import type { Ui } from "../../../Ui.ts"
import { steps } from "./steps.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.List(h, {
    spacing: "xs",
    size: "sm",
    center: true,
    icon: ui.ThemeIcon(h, { color: "teal", size: 24, radius: "xl", children: [CheckCircleIcon(h, { size: 16 })] }),
    items: [
      ...steps.slice(0, 4),
      {
        children: ["Submit a pull request once you are done"],
        icon: ui.ThemeIcon(h, { color: "blue", size: 24, radius: "xl", children: [CircleDashedIcon(h, { size: 16 })] })
      }
    ]
  })
