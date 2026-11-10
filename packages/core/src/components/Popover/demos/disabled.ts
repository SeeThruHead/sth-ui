import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Popover from "../Popover.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ popover: Popover.Model, disabled: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotPopover: { message: Popover.Message }, ToggledDisabled: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ popover: Popover.init({ id: "disabled" }), disabled: true })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotPopover: ({ message: inner }) => {
      const result = Popover.update(model.popover, inner)

      return {
        model: { ...model, popover: result.model },
        commands: (result.commands ?? []).map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotPopover({ message: lifted }))
        )
      }
    },
    ToggledDisabled: () => ({ model: { ...model, disabled: !model.disabled }, commands: [] })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.Popover(h, {
        model: model.popover,
        toParentMessage: (message) => Message.GotPopover({ message }),
        width: 200,
        disabled: model.disabled,
        target: (bind) => ui.Button(h, { bind, children: ["Toggle popover"] }),
        children: [ui.Text(h, { size: "xs", children: ["Disabled popover dropdown is always hidden"] })]
      }),
      ui.Button(h, {
        variant: "default",
        size: "xs",
        onClick: Message.ToggledDisabled(),
        children: [model.disabled ? "Enable popover" : "Disable popover"]
      })
    ]
  })
