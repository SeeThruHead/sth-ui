import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { dates } from "../../Dates.ts"
import { inputsDemo } from "../../picker/demos/inputs.ts"
import type { Message, Model } from "../../picker/demos/inputs.ts"

export { Message, Model } from "../../picker/demos/inputs.ts"

const bold = stylex.create({ input: { fontWeight: 700 } })

const today = "2024-05-09"

const demo = inputsDemo("day", today, {
  single: { value: ["2024-05-14"] },
  multiple: { type: "multiple" },
  range: { type: "range" },
  open: { type: "range", options: { closeOnChange: false } },
  locked: { value: ["2024-05-03"] }
})

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 340,
    mx: "auto",
    children: [
      demo.input(model, "single", (props) =>
        dates.DatePickerInput(h, {
          ...props,
          today,
          label: "Pick date",
          placeholder: "Pick date",
          clearable: true,
          name: "date"
        })
      ),
      demo.input(model, "multiple", (props) =>
        dates.DatePickerInput(h, {
          ...props,
          today,
          label: "Pick dates",
          placeholder: "Pick dates",
          valueFormat: "D MMM"
        })
      ),
      demo.input(model, "range", (props) =>
        dates.DatePickerInput(h, {
          ...props,
          today,
          label: "Pick a range",
          placeholder: "Pick dates range",
          labelSeparator: "to",
          name: "range"
        })
      ),
      demo.input(model, "locked", (props) =>
        dates.DatePickerInput(h, {
          ...props,
          today,
          label: "Read only",
          clearable: true,
          readOnly: true,
          size: "md",
          locale: "en",
          styles: { input: bold.input }
        })
      ),
      demo.input(model, "open", (props) =>
        dates.DatePickerInput(h, {
          ...props,
          today,
          label: "Stays open",
          description: "closeOnChange is off",
          placeholder: "Pick dates range",
          valueFormatter: ({ value }) => value.join(" / "),
          presets: [{ value: ["2024-05-01", "2024-05-09"], label: "This month" }],
          popoverProps: { position: "bottom-end" }
        })
      )
    ]
  })
