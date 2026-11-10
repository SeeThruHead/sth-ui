import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Textarea(h, { id: "loading", w: "100%", maw: 340, placeholder: "Your comment", loading: true })
