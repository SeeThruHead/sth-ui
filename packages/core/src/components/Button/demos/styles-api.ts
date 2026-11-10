import type { Html, HtmlBuilder } from "foldkit/html"
import * as stylex from "@stylexjs/stylex"
import type { Ui } from "../../../Ui.ts"

const custom = stylex.create({
  spaced: { letterSpacing: "2px" },
  label: { textTransform: "uppercase" },
  section: { color: "rgb(255, 0, 0)" }
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Button(h, {
    radius: "xl",
    size: "lg",
    id: "styled-button",
    styles: { root: custom.spaced, label: custom.label, section: custom.section },
    attributes: { root: { "data-promo": "" }, label: { "data-testing": "label" } },
    rightSection: "★",
    children: ["Styled"]
  })
