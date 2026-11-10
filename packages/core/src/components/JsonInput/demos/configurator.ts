import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { inputsDemo } from "./inputs.ts"
import type { Message, Model } from "./inputs.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    {
      type: "select",
      prop: "variant",
      options: ["default", "filled", "unstyled"],
      initial: "default",
      library: "default"
    },
    { type: "size", prop: "size", initial: "sm", library: "sm" },
    { type: "size", prop: "radius", initial: "md", library: "md" },
    { type: "string", prop: "label", initial: "Input label", library: "" },
    { type: "boolean", prop: "withAsterisk", initial: false, library: false },
    { type: "string", prop: "description", initial: "Input description", library: "" },
    { type: "string", prop: "error", initial: "", library: "" }
  ],
  code: `ui.JsonInput(h, {
{{props}}  id: "package-json",
  placeholder: "Textarea will autosize to fit the content",
  validationError: "Invalid JSON",
  autosize: true,
  minRows: 4,
  w: "100%",
  maw: 400
})`
})

export { Message, Model } from "./inputs.ts"

const demo = inputsDemo([{ formatOnBlur: true }])

export const { init, update } = demo

export const view = (
  model: Model,
  h: HtmlBuilder<Message>,
  ui: Ui,
  props: Values<typeof configurator.controls>
): Html =>
  ui.JsonInput(h, {
    ...demo.input(model, 0),
    id: "package-json",
    placeholder: "Textarea will autosize to fit the content",
    validationError: "Invalid JSON",
    autosize: true,
    minRows: 4,
    w: "100%",
    maw: 400,
    ...props
  })
