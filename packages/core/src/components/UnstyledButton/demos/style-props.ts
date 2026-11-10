import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.UnstyledButton(h, {
    mod: { kind: "card" },
    p: "md",
    bd: "1px solid gray",
    bdrs: "md",
    children: ["Button without styles"]
  })
