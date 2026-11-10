import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Autocomplete from "../Autocomplete.ts"
import type { Ui } from "../../../Ui.ts"

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
  code: `ui.Autocomplete(h, {
{{props}}  placeholder: "Pick value or enter anything",
  w: "100%",
  maw: 340,
  data: ["React", "Angular", "Vue", "Svelte"]
})`
})

export const Model = Schema.Struct({ first: Autocomplete.Model, firstValue: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotFirst: { message: Autocomplete.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({
  first: Autocomplete.init({ id: "library" }),
  firstValue: ""
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotFirst: ({ message: inner }) => {
      const result = Autocomplete.update(model.first, inner)

      return {
        model: {
          ...model,
          first: result.model,
          firstValue: result.outMessage === undefined ? model.firstValue : result.outMessage.value
        },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotFirst({ message: lifted }))
        )
      }
    }
  })

const first = (model: Model) => ({
  model: model.first,
  value: model.firstValue,
  toParentMessage: (message: Autocomplete.Message) => Message.GotFirst({ message })
})

export const view = (
  model: Model,
  h: HtmlBuilder<Message>,
  ui: Ui,
  props: Values<typeof configurator.controls>
): Html =>
  ui.Autocomplete(h, {
    ...first(model),
    placeholder: "Pick value or enter anything",
    w: "100%",
    maw: 340,
    data: ["React", "Angular", "Vue", "Svelte"],
    ...props
  })
