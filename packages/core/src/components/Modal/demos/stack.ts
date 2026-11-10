import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Modal from "../Modal.ts"
import type { Ui } from "../../../Ui.ts"

const ids = ["delete-page", "confirm-action", "really-confirm-action"] as const

const Id = Schema.Literals(ids)

type Id = typeof Id.Type

export const Model = Schema.Struct({
  modals: Schema.Struct({
    "delete-page": Modal.Model,
    "confirm-action": Modal.Model,
    "really-confirm-action": Modal.Model
  }),
  stack: Schema.Array(Schema.String)
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotModal: { id: Id, message: Modal.Message },
  Opened: { id: Id },
  ClosedAll: {}
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  modals: {
    "delete-page": Modal.init({ id: "delete-page" }),
    "confirm-action": Modal.init({ id: "confirm-action" }),
    "really-confirm-action": Modal.init({ id: "really-confirm-action" })
  },
  stack: []
})

type Step = { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> }

const settled = (model: Model, id: Id, result: Modal.Result): Step => ({
  model: {
    modals: { ...model.modals, [id]: result.model },
    stack: result.outMessages.reduce<ReadonlyArray<string>>((stack, out) => {
      if (out._tag === "Opened") return Modal.stackOpened(stack, id)
      if (out._tag === "Closed") return Modal.stackClosed(stack, id)

      return stack
    }, model.stack)
  },
  commands: result.commands.map((command) =>
    Command.mapMessage(command, (message) => Message.GotModal({ id, message }))
  )
})

const closedAll = (model: Model): Step =>
  ids.reduce<Step>(
    (step, id) => {
      const next = settled(step.model, id, Modal.close(step.model.modals[id]))

      return { model: next.model, commands: [...step.commands, ...next.commands] }
    },
    { model, commands: [] }
  )

export const update = (model: Model, message: Message): Step =>
  Message.match(message, {
    GotModal: ({ id, message: inner }) => settled(model, id, Modal.update(model.modals[id], inner)),
    Opened: ({ id }) => settled(model, id, Modal.open(model.modals[id])),
    ClosedAll: () => closedAll(model)
  })

const texts: Readonly<Record<Id, { readonly title: string; readonly text: string; readonly action: string }>> = {
  "delete-page": {
    title: "Delete this page?",
    text: "Are you sure you want to delete this page? This action cannot be undone.",
    action: "Delete"
  },
  "confirm-action": {
    title: "Confirm action",
    text: "Are you sure you want to perform this action? This action cannot be undone. If you are sure, press confirm button below.",
    action: "Confirm"
  },
  "really-confirm-action": {
    title: "Really confirm action",
    text: "Jokes aside. You have confirmed this action. This is your last chance to cancel it. After you press confirm button below, action will be performed and cannot be undone. For real this time. Are you sure you want to proceed?",
    action: "Confirm"
  }
}

const next: Readonly<Record<Id, Message>> = {
  "delete-page": Message.Opened({ id: "confirm-action" }),
  "confirm-action": Message.Opened({ id: "really-confirm-action" }),
  "really-confirm-action": Message.ClosedAll()
}

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    children: [
      ...ids.map((id) =>
        ui.Modal(h, {
          model: model.modals[id],
          stack: model.stack,
          toParentMessage: (message) => Message.GotModal({ id, message }),
          title: texts[id].title,
          children: [
            texts[id].text,
            ui.Group(h, {
              mt: "lg",
              justify: "flex-end",
              children: [
                ui.Button(h, { variant: "default", onClick: Message.ClosedAll(), children: ["Cancel"] }),
                ui.Button(h, { color: "red", onClick: next[id], children: [texts[id].action] })
              ]
            })
          ]
        })
      ),
      ui.Button(h, { variant: "default", onClick: Message.Opened({ id: "delete-page" }), children: ["Open modal"] })
    ]
  })
