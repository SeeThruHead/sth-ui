import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    gap: "md",
    children: [
      h.div(
        [],
        [
          ui.Text(h, { size: "sm", fw: 500, mb: 5, children: ["With accent-insensitive matching (default)"] }),
          ui.Highlight(h, { highlight: "cafe", children: "We visited café and cafe." })
        ]
      ),
      h.div(
        [],
        [
          ui.Text(h, {
            size: "sm",
            fw: 500,
            mb: 5,
            children: ["With accent-sensitive matching (accentInsensitive: false)"]
          }),
          ui.Highlight(h, { highlight: "cafe", accentInsensitive: false, children: "We visited café and cafe." })
        ]
      )
    ]
  })
