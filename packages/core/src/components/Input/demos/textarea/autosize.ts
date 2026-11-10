import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    w: "100%",
    maw: 340,
    children: [
      ui.Textarea(h, {
        id: "autosize-unlimited",
        label: "Autosize with no rows limit",
        placeholder: "Autosize with no rows limit",
        autosize: true,
        minRows: 4
      }),
      ui.Textarea(h, {
        id: "autosize-limited",
        label: "Autosize with 4 rows max",
        placeholder: "Autosize with 4 rows max",
        autosize: true,
        minRows: 2,
        maxRows: 4
      })
    ]
  })
