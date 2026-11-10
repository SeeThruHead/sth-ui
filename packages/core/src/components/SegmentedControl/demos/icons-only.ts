import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { ArrowSquareOutIcon } from "@sth-ui/icons/icons/ArrowSquareOutIcon.ts"
import { CodeIcon } from "@sth-ui/icons/icons/CodeIcon.ts"
import { EyeIcon } from "@sth-ui/icons/icons/EyeIcon.ts"
import * as SegmentedControl from "../SegmentedControl.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ first: SegmentedControl.Model, firstValue: Schema.NullOr(Schema.String) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotFirst: { message: SegmentedControl.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({
  first: SegmentedControl.init({ id: "icons-only" }),
  firstValue: null
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotFirst: ({ message: inner }) => {
      const result = SegmentedControl.update(model.first, inner)

      return {
        model: {
          ...model,
          first: result.model,
          firstValue: result.outMessage === undefined ? model.firstValue : result.outMessage.value
        },
        commands: (result.commands ?? []).map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotFirst({ message: lifted }))
        )
      }
    }
  })

const first = (model: Model) => ({
  model: model.first,
  ...(model.firstValue === null ? {} : { value: model.firstValue }),
  toParentMessage: (message: SegmentedControl.Message) => Message.GotFirst({ message })
})

const iconOnly = (h: HtmlBuilder<Message>, ui: Ui, icon: Html, label: string) =>
  h.span([], [icon, ui.VisuallyHidden(h, { children: [label] })])

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.SegmentedControl(h, {
    ...first(model),
    ariaLabel: "View",
    data: [
      { value: "preview", label: iconOnly(h, ui, EyeIcon(h, { size: 20 }), "Preview") },
      { value: "code", label: iconOnly(h, ui, CodeIcon(h, { size: 20 }), "Code") },
      { value: "export", label: iconOnly(h, ui, ArrowSquareOutIcon(h, { size: 20 }), "Export") }
    ]
  })
