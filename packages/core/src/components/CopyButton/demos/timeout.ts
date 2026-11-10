import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { CheckIcon } from "@sth-ui/icons/icons/CheckIcon.ts"
import { CopyIcon } from "@sth-ui/icons/icons/CopyIcon.ts"
import type { Ui } from "../../../Ui.ts"
import * as Tooltip from "../../Tooltip/Tooltip.ts"
import * as CopyButton from "../CopyButton.ts"

export const Model = Schema.Struct({ copy: CopyButton.Model, tooltip: Tooltip.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotCopy: { message: CopyButton.Message },
  GotTooltip: { message: Tooltip.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({ copy: CopyButton.init(), tooltip: Tooltip.init({ id: "copy-tooltip" }) })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotCopy: ({ message: inner }) => {
      const result = CopyButton.update(model.copy, inner, { timeout: 2000 })

      return {
        model: { ...model, copy: result.model },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotCopy({ message: lifted }))
        )
      }
    },
    GotTooltip: ({ message: inner }) => {
      const result = Tooltip.update(model.tooltip, inner)

      return {
        model: { ...model, tooltip: result.model },
        commands: (result.commands ?? []).map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotTooltip({ message: lifted }))
        )
      }
    }
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.CopyButton(h, {
    model: model.copy,
    toParentMessage: (message) => Message.GotCopy({ message }),
    value: "https://mantine.dev",
    children: ({ copied, copy }) =>
      ui.Tooltip(h, {
        model: model.tooltip,
        toParentMessage: (message) => Message.GotTooltip({ message }),
        label: copied ? "Copied" : "Copy",
        withArrow: true,
        position: "right",
        target: (bind) =>
          ui.ActionIcon(h, {
            bind,
            label: copied ? "Copied" : "Copy",
            color: copied ? "teal" : "gray",
            variant: "subtle",
            onClick: copy,
            children: [copied ? CheckIcon(h, { size: 16 }) : CopyIcon(h, { size: 16 })]
          })
      })
  })
