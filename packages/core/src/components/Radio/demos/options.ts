import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as RadioGroup from "../RadioGroup.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({
  group: RadioGroup.Model,
  value: Schema.NullOr(Schema.String),
  checked: Schema.Record(Schema.String, Schema.Boolean)
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotGroup: { message: RadioGroup.Message },
  Checked: { key: Schema.String }
})
export type Message = typeof Message.Type

export const init = (): Model => ({ group: RadioGroup.init({ id: "sizes" }), value: null, checked: { left: true } })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotGroup: ({ message: inner }) => {
      const result = RadioGroup.update(model.group, inner)

      return {
        model: {
          ...model,
          group: result.model,
          value: result.outMessage === undefined ? model.value : result.outMessage.value
        },
        commands: (result.commands ?? []).map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotGroup({ message: lifted }))
        )
      }
    },
    Checked: ({ key }) => ({ model: { ...model, checked: { ...model.checked, [key]: true } }, commands: [] })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      ui.Radio(h, {
        id: "left",
        checked: model.checked["left"] === true,
        onChange: () => Message.Checked({ key: "left" }),
        labelPosition: "left",
        size: "lg",
        radius: "xs",
        label: "Label on the left",
        description: "Large, small radius",
        error: "Pick this one"
      }),
      ui.Radio(h, {
        id: "contrast",
        checked: true,
        onChange: () => Message.Checked({ key: "contrast" }),
        color: "yellow",
        autoContrast: true,
        label: "Auto contrast",
        error: true,
        withErrorStyles: false
      }),
      ui.Radio(h, {
        id: "bare",
        name: "bare",
        checked: model.checked["bare"] === true,
        onChange: () => Message.Checked({ key: "bare" }),
        attributes: { radio: { "aria-label": "Unlabelled radio" } }
      }),
      ui.RadioGroup(h, {
        model: model.group,
        toParentMessage: (message) => Message.GotGroup({ message }),
        ...(model.value === null ? {} : { value: model.value }),
        ariaLabel: "Size",
        size: "xs",
        options: [
          { value: "small", label: "Small" },
          { value: "large", label: "Large", description: "Costs more" }
        ]
      })
    ]
  })
