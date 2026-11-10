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
  ui.SimpleGrid(h, {
    cols: 2,
    children: [
      card(h, ui, "Default", {}),
      card(h, ui, "Color", { color: "#fff", backgroundOpacity: 0.85 }),
      card(h, ui, "Gradient", { gradient: "linear-gradient(145deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0) 100%)" }),
      card(h, ui, "Blur", { blur: 3, backgroundOpacity: 0.2, radius: "md", zIndex: 5 })
    ]
  })
