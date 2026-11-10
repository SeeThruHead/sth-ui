import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"
import * as Modals from "../model.ts"

export const Model = Schema.Struct({ modals: Modals.Model, log: Schema.Array(Schema.String) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotModals: { message: Modals.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({ modals: Modals.init({ id: "modals" }), log: [] })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
  const result = Modals.update(model.modals, message.message)

  return {
    model: {
      modals: result.model,
      log: [...model.log, ...result.outMessages.map((out) => `${out._tag} ${out.modalId}`)].slice(-4)
    },
    commands: result.commands.map((command) =>
      Command.mapMessage(command, (inner) => Message.GotModals({ message: inner }))
    )
  }
}

const send = (message: Modals.Message) => Message.GotModals({ message })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "flex-start",
    children: [
      ui.Group(h, {
        children: [
          ui.Button(h, {
            onClick: send(
              Modals.openModal("terms", {
                settings: {
                  title: "Terms of service",
                  centered: true,
                  size: "lg",
                  fullScreen: false,
                  withCloseButton: true,
                  closeOnClickOutside: true,
                  closeOnEscape: true
                }
              })
            ),
            children: ["Open content modal"]
          }),
          ui.Button(h, {
            color: "red",
            onClick: send(
              Modals.openConfirmModal({
                modalId: "delete",
                settings: { title: "Delete your profile" },
                confirm: { body: "This cannot be undone.", confirmLabel: "Delete account", cancelLabel: "No, keep it" }
              })
            ),
            children: ["Open confirm modal"]
          }),
          ui.Button(h, {
            variant: "light",
            onClick: send(
              Modals.openContextModal("steps", {
                modalId: "steps",
                settings: { title: "Step 1" },
                innerProps: { step: 1 }
              })
            ),
            children: ["Open context modal"]
          }),
          ui.Button(h, {
            variant: "default",
            onClick: send(
              Modals.openConfirmModal({ modalId: "plain", key: "notice", confirm: { closeOnConfirm: false } })
            ),
            children: ["Open plain confirm"]
          }),
          ui.Button(h, {
            variant: "outline",
            onClick: send(Modals.openConfirmModal({ modalId: "bare" })),
            children: ["Open bare confirm"]
          })
        ]
      }),
      ui.Text(h, { size: "sm", children: [model.log.join("; ") || "No events yet"] }),
      ui.ModalsManager(h, {
        model: model.modals,
        toParentMessage: send,
        labels: { confirm: "Confirm", cancel: "Cancel" },
        confirmProps: { color: "red" },
        cancelProps: { variant: "subtle" },
        modalProps: { radius: "md" },
        contents: {
          terms: (hh, context) => [
            ui.Text(hh, { children: ["By continuing you agree to the terms."] }),
            ui.Button(hh, { mt: "md", onClick: context.close, children: ["I agree"] })
          ],
          notice: () => ["Stays open after confirming."]
        },
        modals: {
          steps: (hh, context) => {
            const step = Number(context.innerProps["step"])

            return [
              ui.Text(hh, { children: [`You are on step ${step}`] }),
              ui.Group(hh, {
                mt: "md",
                children: [
                  ui.Button(hh, {
                    onClick: send(
                      Modals.updateModal(context.id, {
                        settings: { title: `Step ${step + 1}` },
                        innerProps: { step: step + 1 }
                      })
                    ),
                    children: ["Next step"]
                  }),
                  ui.Button(hh, { variant: "default", onClick: send(Modals.closeAllModals()), children: ["Close all"] })
                ]
              })
            ]
          }
        }
      })
    ]
  })
