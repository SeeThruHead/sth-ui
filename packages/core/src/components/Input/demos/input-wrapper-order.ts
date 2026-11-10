import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    w: "100%",
    maw: 340,
    children: [
      ui.InputWrapper(h, {
        id: "order-first",
        label: "Custom layout",
        description: "Description below the input",
        inputWrapperOrder: ["label", "error", "input", "description"],
        input: (wiring) => ui.Input(h, { ...wiring, placeholder: "Custom layout" })
      }),
      ui.InputWrapper(h, {
        id: "order-second",
        mt: "xl",
        label: "Custom layout",
        description: "Error and description are",
        error: "both below the input",
        inputWrapperOrder: ["label", "input", "description", "error"],
        input: (wiring) => ui.Input(h, { ...wiring, error: true, placeholder: "Custom layout" })
      })
    ]
  })
