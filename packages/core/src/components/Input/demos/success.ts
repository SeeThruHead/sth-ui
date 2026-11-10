import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    w: "100%",
    maw: 340,
    children: [
      ui.InputWrapper(h, {
        id: "success-boolean",
        label: "Success as boolean",
        success: true,
        input: (wiring) => ui.Input(h, { ...wiring, success: true, placeholder: "Success as boolean" })
      }),
      ui.InputWrapper(h, {
        id: "success-text",
        mt: "md",
        label: "Success as text",
        success: "Username is available",
        input: (wiring) => ui.Input(h, { ...wiring, success: true, placeholder: "Success as text" })
      })
    ]
  })
