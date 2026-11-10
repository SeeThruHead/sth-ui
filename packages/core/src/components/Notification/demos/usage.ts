import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    maw: 400,
    mx: "auto",
    w: "100%",
    children: [
      ui.Notification(h, {
        title: "We notify you that",
        children: ["You are now obligated to give a star to Mantine project on GitHub"]
      })
    ]
  })
