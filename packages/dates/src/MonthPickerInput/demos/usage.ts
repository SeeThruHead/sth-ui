import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { dates } from "../../Dates.ts"
import { inputsDemo } from "../../picker/demos/inputs.ts"
import type { Message, Model } from "../../picker/demos/inputs.ts"

export { Message, Model } from "../../picker/demos/inputs.ts"

const demo = inputsDemo("month", "2024-05-09", { single: {}, range: { type: "range" }, disabled: {} })

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 340,
    mx: "auto",
    children: [
      demo.input(model, "single", (props) =>
        dates.MonthPickerInput(h, { ...props, label: "Pick month", placeholder: "Pick month", clearable: true })
      ),
      demo.input(model, "range", (props) =>
        dates.MonthPickerInput(h, {
          ...props,
          label: "Pick a range",
          placeholder: "Pick months range",
          readOnly: false
        })
      ),
      demo.input(model, "disabled", (props) =>
        dates.MonthPickerInput(h, { ...props, label: "Disabled", placeholder: "Pick month", disabled: true })
      )
    ]
  })
