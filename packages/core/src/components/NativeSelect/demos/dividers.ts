import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.NativeSelect(h, {
    id: "dividers",
    maw: 340,
    mx: "auto",
    label: "With dividers",
    children: [
      h.option([], ["Select library"]),
      h.hr([]),
      h.optgroup(
        [h.Attribute("label", "Frontend libraries")],
        [
          h.option([h.Value("react")], ["React"]),
          h.option([h.Value("angular")], ["Angular"]),
          h.option([h.Value("vue")], ["Vue"])
        ]
      ),
      h.optgroup(
        [h.Attribute("label", "Backend libraries")],
        [
          h.option([h.Value("express")], ["Express"]),
          h.option([h.Value("koa")], ["Koa"]),
          h.option([h.Value("django")], ["Django"])
        ]
      )
    ]
  })
