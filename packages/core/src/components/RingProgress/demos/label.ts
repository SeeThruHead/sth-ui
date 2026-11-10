import type { Html, HtmlBuilder } from "foldkit/html"
import { CheckIcon } from "@sth-ui/icons/icons/CheckIcon.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    justify: "center",
    children: [
      ui.RingProgress(h, {
        sections: [{ value: 40, color: "blue" }],
        label: ui.Text(h, { c: "blue", fw: 700, ta: "center", size: "xl", children: ["40%"] })
      }),
      ui.RingProgress(h, {
        sections: [{ value: 100, color: "teal" }],
        label: ui.Center(h, {
          children: [
            ui.ActionIcon(h, {
              color: "teal",
              variant: "light",
              radius: "xl",
              size: "xl",
              label: "Done",
              children: [CheckIcon(h, { size: 22 })]
            })
          ]
        })
      })
    ]
  })
