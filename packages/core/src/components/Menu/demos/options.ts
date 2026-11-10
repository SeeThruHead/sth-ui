import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Menu from "../Menu.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ menu: Menu.Model, chosen: Schema.String, saving: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotMenu: { message: Menu.Message }, ToggledSaving: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ menu: Menu.init({ id: "options" }), chosen: "Nothing chosen yet", saving: true })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotMenu: ({ message: inner }) => {
      const result = Menu.update(model.menu, inner)

      return {
        model: {
          ...model,
          menu: result.model,
          chosen: result.outMessage === undefined ? model.chosen : `Chose ${result.outMessage.value}`
        },
        commands: (result.commands ?? []).map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotMenu({ message: lifted }))
        )
      }
    },
    ToggledSaving: () => ({ model: { ...model, saving: !model.saving }, commands: [] })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ui.Menu(h, {
        model: model.menu,
        toParentMessage: (message) => Message.GotMenu({ message }),
        disabled: model.saving,
        width: "target",
        ariaLabel: "Saving menu",
        target: (renderRoot) => ui.Button(h, { renderRoot, loading: model.saving, children: ["Saving"] }),
        items: [{ value: "cancel", label: "Cancel" }]
      }),
      ui.Button(h, {
        variant: "default",
        onClick: Message.ToggledSaving(),
        children: [model.saving ? "Finish saving" : "Start saving"]
      }),
      ui.Text(h, { size: "sm", children: [model.chosen] })
    ]
  })
