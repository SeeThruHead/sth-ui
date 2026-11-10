import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { dates } from "../../Dates.ts"
import { inputsDemo } from "../../picker/demos/inputs.ts"
import type { Message, Model } from "../../picker/demos/inputs.ts"

export { Message, Model } from "../../picker/demos/inputs.ts"

const demo = inputsDemo("year", "2024-05-09", { single: {}, range: { type: "range" }, disabled: {} })

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 340,
    mx: "auto",
    children: [
      demo.input(model, "single", (props) =>
        dates.YearPickerInput(h, { ...props, label: "Pick year", placeholder: "Pick year", clearable: true })
      ),
      demo.input(model, "range", (props) =>
        dates.YearPickerInput(h, { ...props, label: "Pick a range", placeholder: "Pick years range" })
      ),
      demo.input(model, "disabled", (props) =>
        dates.YearPickerInput(h, { ...props, label: "Disabled", disabled: true })
      )
    ]
  })
