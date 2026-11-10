import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.InputWrapper(h, {
    id: "wrapper-demo",
    w: "100%",
    maw: 440,
    label: "Input label",
    description: "Input description",
    error: "Input error",
    input: (wiring) => ui.Input(h, { ...wiring, placeholder: "Input inside Input.Wrapper" })
  })
