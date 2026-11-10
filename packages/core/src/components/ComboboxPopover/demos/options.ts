import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { popoversDemo, shown } from "./popovers.ts"
import type { Message, Model } from "./popovers.ts"

export { Message, Model } from "./popovers.ts"

const frameworks = ["React", "Angular", "Vue", "Svelte"]

const demo = popoversDemo({
  locked: { data: frameworks, value: "React", allowDeselect: false },
  deselect: { data: frameworks, value: "React" },
  right: { data: frameworks, value: "Vue" },
  empty: { data: [] }
})

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      demo.popover(
        h,
        ui,
        model,
        "locked",
        (bind, value) =>
          ui.Button(h, { bind, variant: "default", miw: 200, children: [shown(value, "Cannot deselect")] }),
        { name: "locked" }
      ),
      demo.popover(h, ui, model, "deselect", (bind, value) =>
        ui.Button(h, { bind, variant: "default", miw: 200, children: [shown(value, "Can deselect (default)")] })
      ),
      demo.popover(
        h,
        ui,
        model,
        "right",
        (bind, value) =>
          ui.Button(h, { bind, variant: "default", miw: 200, children: [shown(value, "Check on the right")] }),
        { checkIconPosition: "right", name: "framework", form: "framework-form" }
      ),
      demo.popover(
        h,
        ui,
        model,
        "empty",
        (bind) => ui.Button(h, { bind, variant: "default", miw: 200, children: ["Open dropdown"] }),
        { nothingFoundMessage: "No options available", withCheckIcon: false }
      )
    ]
  })
