import { FileTextIcon } from "@sth-ui/icons/icons/FileTextIcon.ts"
import { GaugeIcon } from "@sth-ui/icons/icons/GaugeIcon.ts"
import { HouseIcon } from "@sth-ui/icons/icons/HouseIcon.ts"
import { MagnifyingGlassIcon } from "@sth-ui/icons/icons/MagnifyingGlassIcon.ts"
import type { Icon } from "@sth-ui/icons/Icon.ts"
import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"
import * as Spotlight from "../model.ts"
import type { SpotlightContext } from "../model.ts"

export const Model = Schema.Struct({ spotlight: Spotlight.Model, log: Schema.Array(Schema.String) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotSpotlight: { message: Spotlight.Message } })
export type Message = typeof Message.Type

const data = [
  { id: "home", label: "Home", description: "Get to home page", highlightColor: "lime" },
  { id: "dashboard", label: "Dashboard", description: "Get full information about current system status" },
  { id: "documentation", label: "Documentation", description: "Visit documentation to learn more about all features" }
]

const icons: Readonly<Record<string, Icon>> = { home: HouseIcon, dashboard: GaugeIcon, documentation: FileTextIcon }

export const context: SpotlightContext = { actions: data }

export const init = (): Model => ({ spotlight: Spotlight.init({ id: "spotlight" }), log: [] })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
  const result = Spotlight.update(model.spotlight, message.message, context)

  return {
    model: {
      spotlight: result.model,
      log: [
        ...model.log,
        ...result.outMessages.map((out) => (out._tag === "ActionTriggered" ? `Triggered ${out.id}` : out._tag))
      ].slice(-3)
    },
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
      ui.Button(h, { onClick: send(Spotlight.open()), children: ["Open spotlight"] }),
      ui.Text(h, { size: "sm", children: [model.log.join("; ") || "Press Ctrl + K or the button"] }),
      ui.Spotlight(h, {
        ...context,
        actions: data.map((action) => ({ ...action, leftSection: (icons[action.id] ?? HouseIcon)(h, { size: 24 }) })),
        model: model.spotlight,
        toParentMessage: send,
        nothingFound: "Nothing found...",
        highlightQuery: true,
        searchProps: { leftSection: MagnifyingGlassIcon(h, { size: 20 }), placeholder: "Search..." }
      })
    ]
  })
