import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Progress(h, { color: "blue", radius: "md", size: "md", value: 50, w: "100%", maw: 520, label: "Upload" })
