import type { Html, HtmlBuilder } from "foldkit/html"
import { AtIcon } from "@sth-ui/icons/icons/AtIcon.ts"
import type { Ui } from "../../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    w: "100%",
    maw: 340,
    children: [
      ui.TextInput(h, {
        id: "email-left",
        leftSectionPointerEvents: "none",
        leftSection: AtIcon(h, { size: 16 }),
        label: "Your email",
        placeholder: "Your email"
      }),
      ui.TextInput(h, {
        id: "email-right",
        mt: "md",
        rightSectionPointerEvents: "none",
        rightSection: AtIcon(h, { size: 16 }),
        label: "Your email",
        placeholder: "Your email"
      })
    ]
  })
