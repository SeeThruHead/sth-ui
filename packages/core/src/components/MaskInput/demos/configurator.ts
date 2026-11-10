import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { entryOf, field, fieldsDemo } from "./fields.ts"
import type { Message, Model } from "./fields.ts"

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
  code: `ui.MaskInput(h, {
{{props}}  mask: "(999) 999-9999",
  placeholder: "(___) ___-____"
})`
})

export { Message, Model } from "./fields.ts"

export const { init, update } = fieldsDemo(["usage"])

export const view = (
  model: Model,
  h: HtmlBuilder<Message>,
  ui: Ui,
  props: Values<typeof configurator.controls>
): Html =>
  ui.Stack(h, {
    maw: 340,
    mx: "auto",
    gap: "xs",
    children: [
      ui.MaskInput(h, { ...field(model, "usage"), mask: "(999) 999-9999", placeholder: "(___) ___-____", ...props }),
      ui.Text(h, { size: "sm", c: "dimmed", children: [`Raw value: ${entryOf(model, "usage").field.raw}`] }),
      ui.Text(h, {
        size: "sm",
        c: "dimmed",
        children: [entryOf(model, "usage").field.complete ? "Complete" : "Incomplete"]
      })
    ]
  })
