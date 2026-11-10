import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Textarea(h, {
    id: "success",
    w: "100%",
    maw: 340,
    label: "Textarea",
    placeholder: "Textarea",
    success: "Looks good!"
  })
