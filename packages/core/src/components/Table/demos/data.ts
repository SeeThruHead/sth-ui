import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { elements } from "./elements.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Table(h, {
    data: {
      caption: "Some elements from periodic table",
      head: ["Element position", "Atomic mass", "Symbol", "Element name"],
      body: elements.map((element) => [String(element.position), String(element.mass), element.symbol, element.name]),
      foot: ["Position", "Mass", "Symbol", "Name"]
    }
  })
