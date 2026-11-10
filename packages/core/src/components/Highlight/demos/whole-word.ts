import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    gap: "md",
    children: [
      h.div(
        [],
        [
          ui.Text(h, { size: "sm", fw: 500, mb: 5, children: ["With whole word matching (wholeWord: true)"] }),
          ui.Highlight(h, { highlight: "the", wholeWord: true, children: "The theme is there" })
        ]
      ),
      h.div(
        [],
        [
          ui.Text(h, { size: "sm", fw: 500, mb: 5, children: ["Without whole word matching (default)"] }),
          ui.Highlight(h, { highlight: "the", children: "The theme is there" })
        ]
      )
    ]
  })
