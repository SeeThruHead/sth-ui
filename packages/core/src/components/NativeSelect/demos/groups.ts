import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.NativeSelect(h, {
    id: "groups",
    maw: 340,
    mx: "auto",
    label: "Grouped options",
    data: [
      {
        group: "Frontend libraries",
        items: [
          { label: "React", value: "react" },
          { label: "Angular", value: "angular" },
          { label: "Vue", value: "vue", disabled: true }
        ]
      },
      {
        group: "Backend libraries",
        items: [
          { label: "Express", value: "express" },
          { label: "Koa", value: "koa" },
          { label: "Django", value: "django" }
        ]
      }
    ]
  })
