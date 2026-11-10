import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { cascadersDemo } from "./cascaders.ts"
import type { Message, Model } from "./cascaders.ts"
import { data } from "./data.ts"

export { Message, Model } from "./cascaders.ts"

const demo = cascadersDemo({
  formatted: {
    label: "Last level only",
    data,
    initial: ["europe", "fr", "paris"],
    formatValue: ({ options }) => options.at(-1)?.label ?? ""
  },
  separator: {
    label: "Custom separator",
    data,
    separator: "→",
    initial: ["asia", "kr", "seoul"],
    clearable: true,
    name: "city"
  },
  columns: {
    label: "Wide columns, check on the left",
    placeholder: "Pick location",
    data,
    columnWidth: 240,
    checkIconPosition: "left",
    renderOption: (option, level) => `${"·".repeat(level)} ${option.label ?? option.value}`
  }
})

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 340,
    mx: "auto",
    children: ["formatted", "separator", "columns"].map((name) => demo.cascader(h, ui, model, name))
  })
