import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { data } from "./data.ts"
import { selectsDemo } from "./selects.ts"
import type { Message, Model } from "./selects.ts"

export { Message, Model } from "./selects.ts"

const demo = selectsDemo(data, [
  { id: "events-select", searchable: true, defaultExpandedValues: ["groceries"] },
  { id: "events-multiple", mode: "multiple", searchable: true, clearSearchOnChange: false },
  { id: "events-disabled", mode: "multiple", defaultExpandAll: true },
  { id: "events-plain", defaultExpandedValues: ["electronics"] },
  { id: "events-unknown", mode: "multiple", value: ["iphone", "retired"] }
])

export const { init, update } = demo

const withDisabled = data.map((node) => (node.value === "toys" ? { ...node, nodeProps: { disabled: true } } : node))

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    w: "100%",
    maw: 340,
    children: [
      ui.TreeSelect(h, { ...demo.select(model, 0), label: "Single", placeholder: "Pick value", clearable: true }),
      ui.Text(h, { size: "sm", children: [demo.events(model, 0).join(" | ")] }),
      ui.TreeSelect(h, { ...demo.select(model, 1), label: "Multiple", placeholder: "Pick values" }),
      ui.Text(h, { size: "sm", children: [demo.events(model, 1).join(" | ")] }),
      ui.TreeSelect(h, {
        ...demo.select(model, 2),
        data: withDisabled,
        label: "Toys disabled",
        placeholder: "Pick values"
      }),
      ui.TreeSelect(h, {
        ...demo.select(model, 3),
        value: demo.select(model, 3).value[0] ?? null,
        label: "Plain",
        placeholder: "Pick value"
      }),
      ui.Text(h, { size: "sm", children: [demo.events(model, 3).join(" | ")] }),
      ui.TreeSelect(h, {
        ...demo.select(model, 4),
        label: "Unknown value",
        renderPill: ({ node, onRemove }) => ui.Pill(h, { withRemoveButton: true, onRemove, children: [node.label] })
      })
    ]
  })
