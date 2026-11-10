import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { popoversDemo, shown } from "./popovers.ts"
import type { Message, Model } from "./popovers.ts"

export { Message, Model } from "./popovers.ts"

const largeData = Array.from({ length: 100 }, (_, index) => `Option ${index + 1}`)

const demo = popoversDemo({
  searchable: { data: ["React", "Angular", "Vue", "Svelte"], searchable: true },
  limited: { data: largeData, searchable: true, limit: 5 },
  framed: { data: ["React", "Angular", "Vue", "Svelte"] }
})

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Group(h, {
    justify: "center",
    children: [
      demo.popover(
        h,
        ui,
        model,
        "searchable",
        (bind, value) =>
          ui.Button(h, { bind, variant: "default", miw: 200, children: [shown(value, "Select framework")] }),
        { nothingFoundMessage: "Nothing found..." }
      ),
      demo.popover(
        h,
        ui,
        model,
        "limited",
        (bind, value) =>
          ui.Button(h, { bind, variant: "default", miw: 200, children: [shown(value, "Select option")] }),
        { nothingFoundMessage: "Nothing found..." }
      ),
      demo.popover(
        h,
        ui,
        model,
        "framed",
        (bind, value) =>
          ui.Button(h, { bind, variant: "default", miw: 200, children: [shown(value, "With a header")] }),
        { header: "Frameworks", footer: "4 frameworks" }
      )
    ]
  })
