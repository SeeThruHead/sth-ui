import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"
import * as Spotlight from "../model.ts"
import type { SpotlightContext } from "../model.ts"

export const Model = Schema.Struct({
  spotlight: Spotlight.Model,
  disabled: Schema.Boolean,
  shortcut: Schema.Boolean,
  triggered: Schema.Array(Schema.String)
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotSpotlight: { message: Spotlight.Message },
  ToggledDisabled: {},
  ToggledShortcut: {}
})
export type Message = typeof Message.Type

export const context: SpotlightContext = {
  actions: [
    { id: "new", label: "New file" },
    { id: "newer", label: "New folder" },
    { id: "open", label: "Open recent" },
    { id: "untitled", description: "An action with only a description" }
  ],
  filter: (query, actions) =>
    actions.filter(
      (action) => !("actions" in action) && (action.label ?? "").toLowerCase().startsWith(query.toLowerCase())
    ),
  closeOnActionTrigger: false
}

export const init = (): Model => ({
  spotlight: Spotlight.init({ id: "options" }),
  disabled: false,
  shortcut: true,
  triggered: []
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotSpotlight: ({ message: inner }) => {
      const result = Spotlight.update(model.spotlight, inner, context)

      return {
        model: {
          ...model,
          spotlight: result.model,
          triggered: [
            ...model.triggered,
            ...result.outMessages.flatMap((out) => (out._tag === "ActionTriggered" ? [out.id] : []))
          ]
        },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (next) => Message.GotSpotlight({ message: next }))
        )
      }
    },
    ToggledDisabled: () => ({ model: { ...model, disabled: !model.disabled }, commands: [] }),
    ToggledShortcut: () => ({ model: { ...model, shortcut: !model.shortcut }, commands: [] })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "flex-start",
    children: [
      ui.Group(h, {
        children: [
          ui.Switch(h, {
            id: "options-disabled",
            label: "Disabled",
            checked: model.disabled,
            onChange: () => Message.ToggledDisabled()
          }),
          ui.Switch(h, {
            id: "options-shortcut",
            label: "Shift + Ctrl + P opens it",
            checked: model.shortcut,
            onChange: () => Message.ToggledShortcut()
          }),
          ui.Button(h, { onClick: Message.GotSpotlight({ message: Spotlight.open() }), children: ["Open"] })
        ]
      }),
      ui.Text(h, { size: "sm", children: [`Triggered: ${model.triggered.join(", ") || "none"}`] }),
      ui.Spotlight(h, {
        ...context,
        model: model.spotlight,
        toParentMessage: (message) => Message.GotSpotlight({ message }),
        disabled: model.disabled,
        shortcut: model.shortcut ? "mod + shift + P" : null,
        scrollable: true
      })
    ]
  })
