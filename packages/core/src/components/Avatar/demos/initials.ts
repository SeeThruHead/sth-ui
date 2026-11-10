import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

const names = ["John Doe", "Jane Mol", "Alex Lump", "Sarah Condor", "Mike Johnson", "Kate Kok", "Tom Smith"]

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, { children: names.map((name) => ui.Avatar(h, { name, color: "initials", alt: name })) })
