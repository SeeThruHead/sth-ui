import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as RadioGroup from "../RadioGroup.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ group: RadioGroup.Model, value: Schema.NullOr(Schema.String) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotGroup: { message: RadioGroup.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({ group: RadioGroup.init({ id: "favorite-framework" }), value: null })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotGroup: ({ message: inner }) => {
      const result = RadioGroup.update(model.group, inner)

      return {
        model: { group: result.model, value: result.outMessage === undefined ? model.value : result.outMessage.value },
        commands: (result.commands ?? []).map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotGroup({ message: lifted }))
        )
      }
    }
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.RadioGroup(h, {
    model: model.group,
    toParentMessage: (message) => Message.GotGroup({ message }),
    ...(model.value === null ? {} : { value: model.value }),
    name: "favoriteFramework",
    orientation: "horizontal",
    label: "Select your favorite framework/library",
    description: "This is anonymous",
    withAsterisk: true,
    options: [
      { value: "react", label: "React" },
      { value: "svelte", label: "Svelte" },
      { value: "ng", label: "Angular" },
      { value: "vue", label: "Vue" }
    ],
    children: (radios) => [ui.Group(h, { mt: "xs", children: radios })]
  })
