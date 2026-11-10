import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { personal } from "./form.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  personal(h, ui, "disabled", { disabled: true, name: "personal" }, true)
