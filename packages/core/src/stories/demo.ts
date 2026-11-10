import { palette } from "../theme/palette.stylex.ts"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../Ui.ts"

export const blueLight = `light-dark(color-mix(in srgb, ${palette.blue6}, transparent 90%), color-mix(in srgb, ${palette.blue8}, transparent 85%))`

export const grayLight = `light-dark(color-mix(in srgb, ${palette.gray6}, transparent 90%), color-mix(in srgb, ${palette.dark4}, transparent 85%))`

export const demoTile = <M>(h: HtmlBuilder<M>, ui: Ui, label: string): Html =>
  ui.Box(h, {
    bg: `light-dark(${palette.blue0}, ${palette.dark4})`,
    c: `light-dark(${palette.blue6}, ${palette.dark2})`,
    p: "md",
    h: "100%",
    fz: "xl",
    fw: 700,
    ta: "center",
    children: [label]
  })
