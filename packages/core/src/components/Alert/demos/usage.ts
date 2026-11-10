import type { Html, HtmlBuilder } from "foldkit/html"
import { InfoIcon } from "@sth-ui/icons/icons/InfoIcon.ts"
import type { Ui } from "../../../Ui.ts"

const text =
  "Lorem ipsum dolor sit, amet consectetur adipisicing elit. At officiis, quae tempore necessitatibus placeat saepe."

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Alert(h, {
    id: "usage-alert",
    variant: "light",
    color: "blue",
    title: "Alert title",
    icon: InfoIcon(h),
    w: "100%",
    maw: 560,
    children: [text]
  })
