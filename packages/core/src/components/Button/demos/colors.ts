import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

const row = { display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  h.div(
    [h.Style(row)],
    [
      ui.Button(h, { color: "red", children: ["Red"] }),
      ui.Button(h, { color: "teal.3", children: ["Teal 3"] }),
      ui.Button(h, { color: "#7048e8", variant: "light", children: ["Hex light"] }),
      ui.Button(h, { color: "yellow", autoContrast: true, children: ["Auto contrast"] }),
      ui.Button(h, { color: "#fab005", children: ["Custom"] }),
      ui.Button(h, { color: "#fab005", autoContrast: true, children: ["Custom contrast"] })
    ]
  )
