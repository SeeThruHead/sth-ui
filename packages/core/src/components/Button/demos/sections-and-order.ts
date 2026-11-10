import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

const row = { display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  h.div(
    [h.Style(row)],
    [
      ui.Button(h, { leftSection: "←", rightSection: "→", children: ["Both"] }),
      ui.Button(h, {
        leftSection: "←",
        rightSection: "→",
        order: ["rightSection", "label", "leftSection"],
        children: ["Swapped"]
      }),
      ui.Button(h, { rightSection: "▾", justify: "space-between", fullWidth: true, children: ["Spread"] })
    ]
  )
