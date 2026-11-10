import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

const previous = `import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "@sth-ui/core/Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Code(h, { children: ["React.createElement()"] })`

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, { w: "100%", children: [ui.Code(h, { block: true, children: [previous] })] })
