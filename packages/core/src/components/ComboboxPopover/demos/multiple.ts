import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { popoversDemo, shown } from "./popovers.ts"
import type { Message, Model } from "./popovers.ts"

export { Message, Model } from "./popovers.ts"

const demo = popoversDemo({
  multiple: { data: ["React", "Angular", "Vue", "Svelte"], multiple: true },
  groups: {
    data: [
      { value: "React", label: "React", group: "Frontend" },
      { value: "Angular", label: "Angular", group: "Frontend" },
      { value: "Vue", label: "Vue", group: "Frontend", disabled: true },
      { value: "Node.js", label: "Node.js", group: "Backend" },
      { value: "Django", label: "Django", group: "Backend" },
      { value: "Rails", label: "Rails", group: "Backend" }
    ]
  }
})

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Group(h, {
    justify: "center",
    children: [
      demo.popover(h, ui, model, "multiple", (bind, value) =>
        ui.Button(h, { bind, variant: "default", miw: 200, children: [shown(value, "Select frameworks")] })
      ),
      demo.popover(h, ui, model, "groups", (bind, value) =>
        ui.Button(h, { bind, variant: "default", miw: 200, children: [shown(value, "Select technology")] })
      )
    ]
  })
