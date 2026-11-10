import type { Html, HtmlBuilder } from "foldkit/html"
import { CaretDownIcon } from "@sth-ui/icons/icons/CaretDownIcon.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    w: "100%",
    maw: 340,
    children: [
      ui.Input(h, { component: "button", pointer: true, children: ["Button input"] }),
      ui.Input(h, {
        component: "select",
        pointer: true,
        mt: "md",
        rightSection: CaretDownIcon(h, { size: 14 }),
        attributes: { input: { "aria-label": "Number" } },
        children: [h.option([h.Value("1")], ["1"]), h.option([h.Value("2")], ["2"])]
      })
    ]
  })
