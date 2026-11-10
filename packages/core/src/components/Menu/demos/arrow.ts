import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { ChatCircleIcon } from "@sth-ui/icons/icons/ChatCircleIcon.ts"
import { GearSixIcon } from "@sth-ui/icons/icons/GearSixIcon.ts"
import { ImageIcon } from "@sth-ui/icons/icons/ImageIcon.ts"
import * as Menu from "../Menu.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ menu: Menu.Model, chosen: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotMenu: { message: Menu.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({ menu: Menu.init({ id: "arrow-menu" }), chosen: "Nothing chosen yet" })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotMenu: ({ message: inner }) => {
      const result = Menu.update(model.menu, inner)

      return {
        model: {
          menu: result.model,
          chosen: result.outMessage === undefined ? model.chosen : `Chose ${result.outMessage.value}`
        },
        commands: (result.commands ?? []).map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotMenu({ message: lifted }))
        )
      }
    }
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.Menu(h, {
        model: model.menu,
        toParentMessage: (message) => Message.GotMenu({ message }),
        position: "bottom-start",
        withArrow: true,
        arrowOffset: 12,
        arrowSize: 10,
        arrowRadius: 2,
        target: (renderRoot) => ui.Button(h, { renderRoot, variant: "default", children: ["Menu with an arrow"] }),
        items: [
          {
            value: "settings",
            label: "Settings",
            searchText: "Preferences",
            leftSection: GearSixIcon(h, { size: 14 })
          },
          { value: "messages", label: "Messages", leftSection: ChatCircleIcon(h, { size: 14 }) },
          { value: "gallery", label: "Gallery", leftSection: ImageIcon(h, { size: 14 }) }
        ]
      }),
      ui.Text(h, { size: "sm", c: "dimmed", children: [model.chosen] })
    ]
  })
