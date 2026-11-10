import { Array as Arr, Option, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import * as ModalBase from "../Modal/model.ts"

export const ModalSettings = Schema.Struct({
  title: Schema.optional(Schema.String),
  size: Schema.optional(Schema.String),
  centered: Schema.optional(Schema.Boolean),
  fullScreen: Schema.optional(Schema.Boolean),
  withCloseButton: Schema.optional(Schema.Boolean),
  closeOnClickOutside: Schema.optional(Schema.Boolean),
  closeOnEscape: Schema.optional(Schema.Boolean)
})
export type ModalSettings = typeof ModalSettings.Type

export const ConfirmSettings = Schema.Struct({
  body: Schema.optional(Schema.String),
  confirmLabel: Schema.optional(Schema.String),
  cancelLabel: Schema.optional(Schema.String),
  closeOnConfirm: Schema.optional(Schema.Boolean),
  closeOnCancel: Schema.optional(Schema.Boolean)
})
export type ConfirmSettings = typeof ConfirmSettings.Type

export const Kind = Schema.Literals(["content", "confirm", "context"])
export type Kind = typeof Kind.Type

export const Entry = Schema.Struct({
  id: Schema.String,
  kind: Kind,
  key: Schema.String,
  settings: ModalSettings,
  confirm: ConfirmSettings,
  innerProps: Schema.Record(Schema.String, Schema.Unknown),
  modal: ModalBase.Model
})
export type Entry = typeof Entry.Type

export const Model = Schema.Struct({ id: Schema.String, entries: Schema.Array(Entry), counter: Schema.Int })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Opened: {
    modalId: Schema.optional(Schema.String),
    kind: Kind,
    key: Schema.String,
    settings: ModalSettings,
    confirm: ConfirmSettings,
    innerProps: Schema.Record(Schema.String, Schema.Unknown)
  },
  Closed: { modalId: Schema.String, canceled: Schema.Boolean },
  ClosedAll: { canceled: Schema.Boolean },
  Updated: {
    modalId: Schema.String,
    settings: ModalSettings,
    confirm: ConfirmSettings,
    innerProps: Schema.Record(Schema.String, Schema.Unknown)
  },
  Confirmed: { modalId: Schema.String },
  Cancelled: { modalId: Schema.String },
  GotModal: { modalId: Schema.String, message: ModalBase.Message }
})
export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  ModalOpened: { modalId: Schema.String },
  ModalClosed: { modalId: Schema.String },
  ModalConfirmed: { modalId: Schema.String },
  ModalCancelled: { modalId: Schema.String }
})
export type OutMessage = typeof OutMessage.Type

export type Result = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

export const init = (config: { readonly id: string }): Model => ({ id: config.id, entries: [], counter: 0 })

type OpenInput = {
  readonly modalId?: string
  readonly settings?: ModalSettings
}

export const openModal = (key: string, input: OpenInput = {}): Message =>
  Message.Opened({
    ...(input.modalId === undefined ? {} : { modalId: input.modalId }),
    kind: "content",
    key,
    settings: input.settings ?? {},
    confirm: {},
    innerProps: {}
  })

export const openConfirmModal = (
  input: OpenInput & { readonly confirm?: ConfirmSettings; readonly key?: string } = {}
): Message =>
  Message.Opened({
    ...(input.modalId === undefined ? {} : { modalId: input.modalId }),
    kind: "confirm",
    key: input.key ?? "",
    settings: input.settings ?? {},
    confirm: input.confirm ?? {},
    innerProps: {}
  })

export const openContextModal = (
  modal: string,
  input: OpenInput & { readonly innerProps?: Readonly<Record<string, unknown>> } = {}
): Message =>
  Message.Opened({
    ...(input.modalId === undefined ? {} : { modalId: input.modalId }),
    kind: "context",
    key: modal,
    settings: input.settings ?? {},
    confirm: {},
    innerProps: input.innerProps ?? {}
  })

export const closeModal = (modalId: string, canceled = false): Message => Message.Closed({ modalId, canceled })

export const closeAllModals = (canceled = false): Message => Message.ClosedAll({ canceled })

export const updateModal = (
  modalId: string,
  input: {
    readonly settings?: ModalSettings
    readonly confirm?: ConfirmSettings
    readonly innerProps?: Readonly<Record<string, unknown>>
  }
): Message =>
  Message.Updated({
    modalId,
    settings: input.settings ?? {},
    confirm: input.confirm ?? {},
    innerProps: input.innerProps ?? {}
  })

export const gotModal =
  (modalId: string) =>
  (message: ModalBase.Message): Message =>
    Message.GotModal({ modalId, message })

const lift = (modalId: string) => (command: Command.Command<ModalBase.Message>) =>
  Command.mapMessage(command, gotModal(modalId))

const find = (model: Model, modalId: string) => Arr.findFirst(model.entries, (entry) => entry.id === modalId)

const replaced = (model: Model, entry: Entry): Model => ({
  ...model,
  entries: model.entries.map((item) => (item.id === entry.id ? entry : item))
})

const quiet = (model: Model): Result => ({ model, commands: [], outMessages: [] })

const closing = (model: Model, entry: Entry, canceled: boolean): Result => {
  const result = ModalBase.close(entry.modal)
  const cancelled = canceled && entry.kind === "confirm" ? [OutMessage.ModalCancelled({ modalId: entry.id })] : []

  return {
    model: replaced(model, { ...entry, modal: result.model }),
    commands: result.commands.map(lift(entry.id)),
    outMessages: [...cancelled, OutMessage.ModalClosed({ modalId: entry.id })]
  }
}

const opened = (model: Model, message: Extract<Message, { readonly _tag: "Opened" }>): Result => {
  const id = message.modalId ?? `${model.id}-${model.counter}`
  if (Option.isSome(find(model, id))) return quiet(model)
  const result = ModalBase.open(ModalBase.init({ id, opened: false }))
  const entry: Entry = {
    id,
    kind: message.kind,
    key: message.key,
    settings: message.settings,
    confirm: message.confirm,
    innerProps: message.innerProps,
    modal: result.model
  }

  return {
    model: { ...model, entries: [...model.entries, entry], counter: model.counter + 1 },
    commands: result.commands.map(lift(id)),
    outMessages: [OutMessage.ModalOpened({ modalId: id })]
  }
}

const merge = <A extends object>(base: A, extra: A): A => ({ ...base, ...extra })

const answered = (model: Model, modalId: string, confirmed: boolean): Result =>
  Option.match(find(model, modalId), {
    onNone: () => quiet(model),
    onSome: (entry) => {
      const out = confirmed ? OutMessage.ModalConfirmed({ modalId }) : OutMessage.ModalCancelled({ modalId })
      const closes = (confirmed ? entry.confirm.closeOnConfirm : entry.confirm.closeOnCancel) !== false
      if (!closes) return { model, commands: [], outMessages: [out] }
      const result = closing(model, entry, false)

      return { ...result, outMessages: [out, ...result.outMessages] }
    }
  })

const fromModal = (model: Model, modalId: string, message: ModalBase.Message): Result =>
  Option.match(find(model, modalId), {
    onNone: () => quiet(model),
    onSome: (entry) => {
      const result = ModalBase.update(entry.modal, message)
      const exited = result.outMessages.some((out) => out._tag === "ExitedTransition")
      const closed = result.outMessages.some((out) => out._tag === "Closed")
      const next = exited
        ? { ...model, entries: model.entries.filter((item) => item.id !== modalId) }
        : replaced(model, { ...entry, modal: result.model })

      return {
        model: next,
        commands: result.commands.map(lift(modalId)),
        outMessages: closed ? [OutMessage.ModalClosed({ modalId })] : []
      }
    }
  })

export const update = (model: Model, message: Message): Result =>
  Message.match(message, {
    Opened: (open) => opened(model, open),
    Closed: ({ modalId, canceled }) =>
      Option.match(find(model, modalId), {
        onNone: () => quiet(model),
        onSome: (entry) => closing(model, entry, canceled)
      }),
    ClosedAll: ({ canceled }) =>
      model.entries.toReversed().reduce<Result>((state, entry) => {
        const result = closing(state.model, entry, canceled)

        return {
          model: result.model,
          commands: [...state.commands, ...result.commands],
          outMessages: [...state.outMessages, ...result.outMessages]
        }
      }, quiet(model)),
    Updated: ({ modalId, settings, confirm, innerProps }) =>
      Option.match(find(model, modalId), {
        onNone: () => quiet(model),
        onSome: (entry) =>
          quiet(
            replaced(model, {
              ...entry,
              settings: merge(entry.settings, settings),
              confirm: merge(entry.confirm, confirm),
              innerProps: merge(entry.innerProps, innerProps)
            })
          )
      }),
    Confirmed: ({ modalId }) => answered(model, modalId, true),
    Cancelled: ({ modalId }) => answered(model, modalId, false),
    GotModal: ({ modalId, message: inner }) => fromModal(model, modalId, inner)
  })

export const current = (model: Model): Option.Option<Entry> => Arr.last(model.entries)
