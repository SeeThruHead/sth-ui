import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"
import * as Spotlight from "../model.ts"
import type { SpotlightContext } from "../model.ts"

export const Model = Schema.Struct({ spotlight: Spotlight.Model, triggered: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotSpotlight: { message: Spotlight.Message } })
export type Message = typeof Message.Type

const fruits = ["Apple", "Banana", "Cherry", "Grape", "Mango", "Orange", "Peach", "Pear"]

export const context: SpotlightContext = {
  actions: [
    {
      group: "Pages",
      actions: [
        { id: "home", label: "Home", rightSection: "⌘H", dimmedSections: false },
        { id: "settings", label: "Settings", keywords: ["preferences", "options"], closeSpotlightOnTrigger: false }
      ]
    },
    {
      group: "Fruits",
      actions: fruits.map((fruit) => ({
        id: fruit.toLowerCase(),
        label: fruit,
        description: `A ${fruit.toLowerCase()} it's quote's`
      }))
    }
  ],
  limit: 7,
  clearQueryOnClose: false
}

export const init = (): Model => ({ spotlight: Spotlight.init({ id: "groups" }), triggered: "Nothing yet" })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
  const result = Spotlight.update(model.spotlight, message.message, context)
  const triggered = result.outMessages.flatMap((out) => (out._tag === "ActionTriggered" ? [`Triggered ${out.id}`] : []))

  return {
    model: { spotlight: result.model, triggered: triggered[0] ?? model.triggered },
    commands: result.commands.map((command) =>
      Command.mapMessage(command, (inner) => Message.GotSpotlight({ message: inner }))
    )
  }
}

const send = (message: Spotlight.Message) => Message.GotSpotlight({ message })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "flex-start",
    children: [
      ui.Button(h, { onClick: send(Spotlight.toggle()), children: ["Open grouped spotlight"] }),
      ui.Text(h, { size: "sm", children: [model.triggered] }),
      ui.Spotlight(h, {
        ...context,
        model: model.spotlight,
        toParentMessage: send,
        shortcut: ["mod + J", "/"],
        scrollable: true,
        maxHeight: "22rem",
        size: "md",
        searchProps: { placeholder: "Search pages and fruits", rightSection: "Esc", size: "md" },
        footer: ui.Text(h, { size: "xs", c: "dimmed", children: ["Up and down to move, Enter to choose"] })
      })
    ]
  })
