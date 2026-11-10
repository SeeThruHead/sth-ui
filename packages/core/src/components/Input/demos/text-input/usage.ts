import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.TextInput(h, {
    id: "usage",
    w: "100%",
    maw: 340,
    label: "Input label",
    description: "Input description",
    placeholder: "Input placeholder"
  })
