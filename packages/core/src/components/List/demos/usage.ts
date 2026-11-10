import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { steps } from "./steps.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html => ui.List(h, { items: steps })
