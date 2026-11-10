import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.AspectRatio(h, {
    ratio: 16 / 9,
    maw: 400,
    children: [
      h.iframe(
        [
          h.Title("Embedded page"),
          h.Src(
            "data:text/html,<body style='margin:0;display:grid;place-items:center;font:16px sans-serif'>An embedded page</body>"
          ),
          h.Style({ border: "0" })
        ],
        []
      )
    ]
  })
