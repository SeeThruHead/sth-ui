import type { Html, HtmlBuilder } from "foldkit/html"
import * as stylex from "@stylexjs/stylex"
import type { LoaderView } from "../Loader.ts"
import { loaderVars } from "../Loader.stylex.ts"
import type { Ui } from "../../../Ui.ts"

const custom = stylex.create({
  ring: {
    display: "inline-block",
    width: loaderVars.size,
    height: "4px",
    backgroundColor: loaderVars.color
  }
})

const lineLoader: LoaderView = (h, root) => h.span(root(custom.ring), [])

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  h.div(
    [h.Style({ display: "flex", gap: "24px", alignItems: "center" })],
    [
      ui.Loader(h, { type: "line", label: "Custom line" }),
      ui.Loader(h, { type: "oval", label: "Replaced oval", loaders: { oval: lineLoader } }),
      ui.Loader(h, { type: "unknown", label: "Unknown type" })
    ]
  )
