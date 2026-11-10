import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { personal } from "./form.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      personal(h, ui, "filled", { variant: "filled", radius: "md", attributes: { root: { "data-testid": "filled" } } }),
      personal(h, ui, "unstyled", { variant: "unstyled", attributes: { root: { "data-testid": "unstyled" } } })
    ]
  })
