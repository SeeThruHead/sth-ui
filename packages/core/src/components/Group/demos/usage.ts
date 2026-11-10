import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

const buttons = <M>(h: HtmlBuilder<M>, ui: Ui, labels: ReadonlyArray<string>) =>
  labels.map((label) => ui.Button(h, { variant: "default", children: [label] }))

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, { mod: { demo: "usage" }, children: buttons(h, ui, ["First", "Second", "Third"]) })
