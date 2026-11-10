import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html => ui.NumberFormatter(h, { value: 5 / 3, decimalScale: 2 })
