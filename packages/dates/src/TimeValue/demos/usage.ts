import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { dates } from "../../Dates.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    gap: "xs",
    children: [
      ui.Text(h, { children: ["24h: ", dates.TimeValue(h, { value: "18:45:34" })] }),
      ui.Text(h, { children: ["12h: ", dates.TimeValue(h, { value: "18:45:34", format: "12h" })] }),
      ui.Text(h, { children: ["With seconds: ", dates.TimeValue(h, { value: "18:45:34", withSeconds: true })] }),
      ui.Text(h, {
        children: [
          "Custom labels: ",
          dates.TimeValue(h, { value: "06:05", format: "12h", amPmLabels: { am: "a.m.", pm: "p.m." } })
        ]
      }),
      ui.Text(h, { children: ["Invalid: [", dates.TimeValue(h, { value: "soon" }), "]"] })
    ]
  })
