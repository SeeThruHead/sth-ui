import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.PasswordInput(h, { id: "loading", w: "100%", maw: 340, placeholder: "Your password", loading: true })
