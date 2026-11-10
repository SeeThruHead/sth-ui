import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    gap: "md",
    children: [
      h.div(
        [],
        [
          ui.Text(h, { size: "sm", fw: 500, mb: 5, children: ["With case-insensitive matching (default)"] }),
          ui.Highlight(h, { highlight: "this", children: "Highlight This, definitely THIS and also this!" })
        ]
      ),
      h.div(
        [],
        [
          ui.Text(h, {
            size: "sm",
            fw: 500,
            mb: 5,
            children: ["With case-sensitive matching (caseInsensitive: false)"]
          }),
          ui.Highlight(h, {
            highlight: "this",
            caseInsensitive: false,
            children: "Highlight This, definitely THIS and also this!"
          })
        ]
      )
    ]
  })
