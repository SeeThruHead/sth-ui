import type { Html, HtmlBuilder } from "foldkit/html"
import { CheckIcon } from "@sth-ui/icons/icons/CheckIcon.ts"
import { XIcon } from "@sth-ui/icons/icons/XIcon.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    maw: 400,
    mx: "auto",
    w: "100%",
    children: [
      ui.Notification(h, {
        icon: XIcon(h, { size: 20 }),
        color: "red",
        title: "Bummer!",
        children: ["Something went wrong"]
      }),
      ui.Notification(h, {
        icon: CheckIcon(h, { size: 20 }),
        color: "teal",
        title: "All good!",
        mt: "md",
        children: ["Everything is fine"]
      })
    ]
  })
