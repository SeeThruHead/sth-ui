import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Textarea(h, {
    id: "resize",
    w: "100%",
    maw: 340,
    resize: "vertical",
    label: "Disabled",
    placeholder: "Your comment"
  })
