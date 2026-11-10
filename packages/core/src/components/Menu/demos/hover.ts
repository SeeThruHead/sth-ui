import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { ArrowsLeftRightIcon } from "@sth-ui/icons/icons/ArrowsLeftRightIcon.ts"
import { ChatCircleIcon } from "@sth-ui/icons/icons/ChatCircleIcon.ts"
import { GearSixIcon } from "@sth-ui/icons/icons/GearSixIcon.ts"
import { ImageIcon } from "@sth-ui/icons/icons/ImageIcon.ts"
import { MagnifyingGlassIcon } from "@sth-ui/icons/icons/MagnifyingGlassIcon.ts"
import { TrashIcon } from "@sth-ui/icons/icons/TrashIcon.ts"
import * as Menu from "../Menu.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ menu: Menu.Model, second: Menu.Model, chosen: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotMenu: { message: Menu.Message }, GotSecond: { message: Menu.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({
  menu: Menu.init({ id: "hover-menu" }),
  second: Menu.init({ id: "click-hover-menu" }),
  chosen: "Nothing chosen yet"
})

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
    GotSecond: ({ message: inner }) => {
      const result = Menu.update(model.second, inner)

      return {
        model: { ...model, second: result.model },
        commands: (result.commands ?? []).map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotSecond({ message: lifted }))
        )
      }
    }
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.Menu(h, {
        model: model.second,
        toParentMessage: (message) => Message.GotSecond({ message }),
        trigger: "click-hover",
        target: (renderRoot) => ui.Button(h, { renderRoot, variant: "default", children: ["Hover or click"] }),
        items: [
          { value: "copy", label: "Copy" },
          { value: "paste", label: "Paste" }
        ]
      }),
      ui.Menu(h, {
        model: model.menu,
        toParentMessage: (message) => Message.GotMenu({ message }),
        shadow: "md",
        width: 200,
        trigger: "hover",
        openDelay: 100,
        closeDelay: 400,
        target: (renderRoot) => ui.Button(h, { renderRoot, children: ["Hover to open"] }),
        labels: { application: "Application", danger: "Danger zone" },
        items: [
          { value: "settings", group: "application", label: "Settings", leftSection: GearSixIcon(h, { size: 14 }) },
          { value: "messages", group: "application", label: "Messages", leftSection: ChatCircleIcon(h, { size: 14 }) },
          { value: "gallery", group: "application", label: "Gallery", leftSection: ImageIcon(h, { size: 14 }) },
          {
            value: "search",
            group: "application",
            label: "Search",
            leftSection: MagnifyingGlassIcon(h, { size: 14 }),
            rightSection: ui.Text(h, { size: "xs", c: "dimmed", children: ["⌘K"] })
          },
          {
            value: "transfer",
            group: "danger",
            label: "Transfer my data",
            leftSection: ArrowsLeftRightIcon(h, { size: 14 })
          },
          {
            value: "delete",
            group: "danger",
            label: "Delete my account",
            color: "red",
            leftSection: TrashIcon(h, { size: 14 })
          }
        ]
      }),
      ui.Text(h, { size: "sm", c: "dimmed", children: [model.chosen] })
    ]
  })
