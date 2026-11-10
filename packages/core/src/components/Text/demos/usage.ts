import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    w: "100%",
    children: [
      ui.Text(h, { size: "xs", children: ["Extra small text"] }),
      ui.Text(h, { size: "sm", children: ["Small text"] }),
      ui.Text(h, { size: "md", children: ["Default text"] }),
      ui.Text(h, { size: "lg", children: ["Large text"] }),
      ui.Text(h, { size: "xl", children: ["Extra large text"] }),
      ui.Text(h, { fw: 500, children: ["Semibold"] }),
      ui.Text(h, { fw: 700, children: ["Bold"] }),
      ui.Text(h, { fs: "italic", children: ["Italic"] }),
      ui.Text(h, { td: "underline", children: ["Underlined"] }),
      ui.Text(h, { td: "line-through", children: ["Strikethrough"] }),
      ui.Text(h, { c: "dimmed", children: ["Dimmed text"] }),
      ui.Text(h, { c: "blue", children: ["Blue text"] }),
      ui.Text(h, { c: "teal.4", children: ["Teal 4 text"] }),
      ui.Text(h, { tt: "uppercase", children: ["Uppercase"] }),
      ui.Text(h, { tt: "capitalize", children: ["capitalized text"] }),
      ui.Text(h, { ta: "center", children: ["Aligned to center"] }),
      ui.Text(h, { ta: "right", children: ["Aligned to right"] })
    ]
  })
