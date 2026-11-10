import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as SegmentedControl from "../SegmentedControl.ts"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [{ type: "color", prop: "color", initial: "blue" }],
  code: `ui.SegmentedControl(h, {
{{props}}  ariaLabel: "Framework",
  data: ["React", "Angular", "Vue", "Svelte"]
})`
})

export const Model = Schema.Struct({ first: SegmentedControl.Model, firstValue: Schema.NullOr(Schema.String) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotFirst: { message: SegmentedControl.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({
  first: SegmentedControl.init({ id: "frameworks" }),
  firstValue: null
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotFirst: ({ message: inner }) => {
      const result = SegmentedControl.update(model.first, inner)

      return {
        model: {
          ...model,
          first: result.model,
          firstValue: result.outMessage === undefined ? model.firstValue : result.outMessage.value
        },
        commands: (result.commands ?? []).map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotFirst({ message: lifted }))
        )
      }
    }
  })

const first = (model: Model) => ({
  model: model.first,
  ...(model.firstValue === null ? {} : { value: model.firstValue }),
  toParentMessage: (message: SegmentedControl.Message) => Message.GotFirst({ message })
})

export const view = (
  model: Model,
  h: HtmlBuilder<Message>,
  ui: Ui,
  props: Values<typeof configurator.controls>
): Html =>
  ui.SegmentedControl(h, {
    ...first(model),
    ariaLabel: "Framework",
    data: ["React", "Angular", "Vue", "Svelte"],
    ...props
  })
