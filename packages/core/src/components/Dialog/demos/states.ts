import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Dialog from "../Dialog.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ open: Dialog.Model, hidden: Dialog.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Ignored: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({
  open: Dialog.init({ id: "already-open", opened: true }),
  hidden: Dialog.init({ id: "kept-mounted" })
})

export const update = (
  model: Model,
  _message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => ({ model, commands: [] })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  h.div(
    [],
    [
      ui.Dialog(h, {
        model: model.open,
        toParentMessage: () => Message.Ignored(),
        size: 260,
        radius: "lg",
        shadow: "xl",
        withBorder: false,
        withinPortal: false,
        zIndex: 30,
        position: { top: 20, right: 20 },
        transitionProps: { transition: "fade", duration: 0 },
        attributes: { root: { "aria-label": "Saved" } },
        children: [ui.Text(h, { size: "sm", children: ["Your changes were saved"] })]
      }),
      ui.Dialog(h, {
        model: model.hidden,
        toParentMessage: () => Message.Ignored(),
        keepMounted: true,
        children: [ui.Text(h, { size: "sm", children: ["Kept in the page while closed"] })]
      })
    ]
  )
