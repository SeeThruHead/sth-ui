import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { cascadersDemo } from "./cascaders.ts"
import type { Message, Model } from "./cascaders.ts"
import { data } from "./data.ts"
import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export { Message, Model } from "./cascaders.ts"

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
  code: `ui.Cascader(h, {
  model,
  value,
  toParentMessage,
{{props}}  placeholder: "Pick location",
  data
})`
})

const demo = cascadersDemo({ usage: { placeholder: "Pick location", data } })

export const { init, update } = demo

export const view = (
  model: Model,
  h: HtmlBuilder<Message>,
  ui: Ui,
  props: Values<typeof configurator.controls>
): Html => ui.Box(h, { w: "100%", maw: 340, mx: "auto", children: [demo.cascader(h, ui, model, "usage", props)] })
