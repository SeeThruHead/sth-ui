import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { people } from "./data.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html => ui.DataList(h, { w: "100%", maw: 480, items: people })
