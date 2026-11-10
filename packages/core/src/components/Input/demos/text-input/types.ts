import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    w: "100%",
    maw: 340,
    children: [
      ui.TextInput(h, { id: "password", type: "password", label: "Password input", placeholder: "Password input" }),
      ui.TextInput(h, { id: "date", mt: "md", type: "date", label: "Date input", placeholder: "Date input" }),
      ui.TextInput(h, {
        id: "date-time",
        mt: "md",
        type: "datetime-local",
        label: "Date time input",
        placeholder: "Date time input"
      })
    ]
  })
