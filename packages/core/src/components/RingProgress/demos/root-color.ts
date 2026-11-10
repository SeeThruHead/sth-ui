import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.RingProgress(h, { sections: [{ value: 40, color: "yellow" }], rootColor: "red" })
