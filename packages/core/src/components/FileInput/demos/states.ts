import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { FileTextIcon } from "@sth-ui/icons/icons/FileTextIcon.ts"
import * as FileInput from "../FileInput.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({
  first: FileInput.Model,
  firstFiles: Schema.Array(Schema.instanceOf(File)),
  second: FileInput.Model,
  secondFiles: Schema.Array(Schema.instanceOf(File)),
  third: FileInput.Model,
  thirdFiles: Schema.Array(Schema.instanceOf(File))
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotFirst: { message: FileInput.Message },
  GotSecond: { message: FileInput.Message },
  GotThird: { message: FileInput.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  first: FileInput.init({ id: "locked-files" }),
  firstFiles: [],
  second: FileInput.init({ id: "modes-files" }),
  secondFiles: [],
  third: FileInput.init({ id: "only-clear-files" }),
  thirdFiles: []
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotFirst: ({ message: inner }) => {
      const result = FileInput.update(model.first, inner)

      return {
        model: {
          ...model,
          first: result.model,
          firstFiles: result.outMessage === undefined ? model.firstFiles : result.outMessage.files
        },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotFirst({ message: lifted }))
        )
      }
    },
    GotSecond: ({ message: inner }) => {
      const result = FileInput.update(model.second, inner)

      return {
        model: {
          ...model,
          second: result.model,
          secondFiles: result.outMessage === undefined ? model.secondFiles : result.outMessage.files
        },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotSecond({ message: lifted }))
        )
      }
    },
    GotThird: ({ message: inner }) => {
      const result = FileInput.update(model.third, inner)

      return {
        model: {
          ...model,
          third: result.model,
          thirdFiles: result.outMessage === undefined ? model.thirdFiles : result.outMessage.files
        },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotThird({ message: lifted }))
        )
      }
    }
  })

const first = (model: Model) => ({
  model: model.first,
  value: model.firstFiles,
  toParentMessage: (message: FileInput.Message) => Message.GotFirst({ message })
})

const second = (model: Model) => ({
  model: model.second,
  value: model.secondFiles,
  toParentMessage: (message: FileInput.Message) => Message.GotSecond({ message })
})

const third = (model: Model) => ({
  model: model.third,
  value: model.thirdFiles,
  toParentMessage: (message: FileInput.Message) => Message.GotThird({ message })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    w: "100%",
    maw: 340,
    children: [
      ui.FileInput(h, { ...first(model), label: "Disabled", placeholder: "Disabled", disabled: true, clearable: true }),
      ui.FileInput(h, {
        ...second(model),
        label: "Right section only",
        clearable: true,
        clearSectionMode: "rightSection",
        rightSection: FileTextIcon(h, { size: 18 }),
        name: "cv",
        form: "cv-form",
        capture: "user"
      }),
      ui.FileInput(h, {
        ...third(model),
        label: "Clear only",
        clearable: true,
        clearSectionMode: "clear",
        rightSection: FileTextIcon(h, { size: 18 }),
        readOnly: false
      })
    ]
  })
