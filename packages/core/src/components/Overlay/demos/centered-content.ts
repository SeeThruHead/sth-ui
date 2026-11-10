import type { Html, HtmlBuilder } from "foldkit/html"
import type { OverlayProps } from "../Overlay.ts"
import type { Ui } from "../../../Ui.ts"

const card = <M>(h: HtmlBuilder<M>, ui: Ui, label: string, overlay: OverlayProps<M>) =>
  ui.Box(h, {
    pos: "relative",
    h: 120,
    maw: 260,
    children: [
      ui.Paper(h, {
        withBorder: true,
        h: "100%",
        p: "md",
        children: [ui.Text(h, { children: [`${label}: text under the overlay`] })]
      }),
      ui.Overlay(h, { attributes: { root: { "aria-label": label, role: "presentation" } }, ...overlay })
    ]
  })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  card(h, ui, "Centered", {
    center: true,
    color: "blue.9",
    children: [ui.Button(h, { variant: "white", children: ["Upgrade"] })]
  })
