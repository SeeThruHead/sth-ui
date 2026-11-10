import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    w: "100%",
    maw: 340,
    children: [
      ui.TextInput(h, { id: "boolean-error", label: "Boolean error", placeholder: "Boolean error", error: true }),
      ui.TextInput(h, {
        id: "message-error",
        mt: "md",
        label: "With error message",
        placeholder: "With error message",
        error: "Invalid name"
      })
    ]
  })
