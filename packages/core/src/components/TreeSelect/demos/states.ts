import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { data } from "./data.ts"
import { selectsDemo } from "./selects.ts"
import type { Message, Model } from "./selects.ts"

export { Message, Model } from "./selects.ts"

const demo = selectsDemo(data, [
  { id: "read-only-select", value: ["iphone"] },
  { id: "disabled-select", value: ["iphone"] },
  { id: "error-select" },
  { id: "overflow-select", mode: "multiple", value: ["iphone", "pixel", "macbook"], defaultExpandAll: true },
  { id: "labels-select", mode: "multiple", searchable: true, value: ["apples"] },
  { id: "custom-overflow-select", mode: "checkbox", value: ["iphone", "pixel", "macbook"] }
])

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    w: "100%",
    maw: 340,
    children: [
      ui.TreeSelect(h, { ...demo.select(model, 0), value: "iphone", label: "Read only", readOnly: true }),
      ui.TreeSelect(h, { ...demo.select(model, 1), label: "Disabled", disabled: true }),
      ui.TreeSelect(h, {
        ...demo.select(model, 2),
        label: "With error",
        placeholder: "Pick value",
        error: "Invalid value"
      }),
      ui.TreeSelect(h, {
        ...demo.select(model, 3),
        label: "Two pills at most",
        variant: "filled",
        maxDisplayedValues: 2,
        clearable: true,
        withLines: false
      }),
      ui.TreeSelect(h, {
        ...demo.select(model, 4),
        label: "Chevron labels",
        chevronAriaLabels: { expand: "Open", collapse: "Close" },
        maxDropdownHeight: 120
      }),
      ui.TreeSelect(h, {
        ...demo.select(model, 5),
        label: "Custom overflow",
        maxDisplayedValues: 1,
        maxDisplayedValuesContent: (overflow) => `and ${overflow} others`
      })
    ]
  })
