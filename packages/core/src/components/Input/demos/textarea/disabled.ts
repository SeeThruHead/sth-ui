import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Textarea(h, {
    id: "disabled",
    w: "100%",
    maw: 340,
    disabled: true,
    label: "Disabled",
    placeholder: "Your comment"
  })
