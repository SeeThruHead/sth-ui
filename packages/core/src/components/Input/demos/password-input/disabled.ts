import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.PasswordInput(h, {
    id: "disabled",
    w: "100%",
    maw: 340,
    disabled: true,
    label: "Disabled password input",
    placeholder: "Disabled password input"
  })
