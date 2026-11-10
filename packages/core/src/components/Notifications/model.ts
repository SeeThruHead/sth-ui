import { Option, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import * as Transition from "../Transition/model.ts"
import { autoCloseOf, distribute, positions, shouldDismiss } from "./queue.ts"
import type { NotificationPosition } from "./queue.ts"
import { Wait } from "./wait.ts"

export const Position = Schema.Literals(positions)

export const NotificationData = Schema.Struct({
  id: Schema.optional(Schema.String),
  position: Schema.optional(Position),
  priority: Schema.optional(Schema.Finite),
  title: Schema.optional(Schema.String),
  message: Schema.String,
  icon: Schema.optional(Schema.String),
  color: Schema.optional(Schema.String),
  radius: Schema.optional(Schema.String),
  withBorder: Schema.optional(Schema.Boolean),
  withCloseButton: Schema.optional(Schema.Boolean),
  loading: Schema.optional(Schema.Boolean),
  autoClose: Schema.optional(Schema.Union([Schema.Finite, Schema.Literal(false)])),
  allowClose: Schema.optional(Schema.Boolean),
  withAutoCloseProgress: Schema.optional(Schema.Boolean)
})
export type NotificationData = typeof NotificationData.Type

export const Entry = Schema.Struct({
  ...NotificationData.fields,
  id: Schema.String,
  sequence: Schema.Int,
  transition: Transition.Model,
  timer: Schema.Int,
  running: Schema.Boolean,
  hovered: Schema.Boolean,
  offset: Schema.Finite,
  dismissed: Schema.Boolean,
  closing: Schema.Boolean,
  dragging: Schema.Boolean,
  height: Schema.Option(Schema.Finite)
})
export type Entry = typeof Entry.Type

export const Model = Schema.Struct({
  id: Schema.String,
  entries: Schema.Array(Entry),
  sequence: Schema.Int,
  groupHovered: Schema.Array(Position),
  pinned: Schema.Option(Position)
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Showed: { notification: NotificationData },
  Hid: { id: Schema.String },
  Updated: { notification: NotificationData },
  Cleaned: {},
  CleanedQueue: {},
  GotTransition: { id: Schema.String, message: Transition.Message },
  TimerElapsed: { id: Schema.String, timer: Schema.Int },
  HoverStarted: { id: Schema.String },
  HoverEnded: { id: Schema.String },
  GroupHovered: { position: Position, hovered: Schema.Boolean },
  Pinned: { position: Schema.Option(Position) },
  DragMoved: { id: Schema.String, offset: Schema.Finite },
  DragEnded: { id: Schema.String, movement: Schema.Finite, velocity: Schema.Finite, width: Schema.Finite },
  DismissElapsed: { id: Schema.String },
  Measured: { id: Schema.String, height: Schema.Finite }
})
export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({ Opened: { id: Schema.String }, Closed: { id: Schema.String } })
export type OutMessage = typeof OutMessage.Type

export type NotificationsContext = {
  readonly position?: NotificationPosition
  readonly limit?: number
  readonly autoClose?: number | false
  readonly transitionDuration?: number
  readonly pauseResetOnHover?: "all" | "notification"
}

export type Result = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

export const timerElapsed = (id: string, timer: number) => (): Message => Message.TimerElapsed({ id, timer })

export const dismissElapsed = (id: string) => (): Message => Message.DismissElapsed({ id })

export const init = (config: { readonly id: string }): Model => ({
  id: config.id,
  entries: [],
  sequence: 0,
  groupHovered: [],
  pinned: Option.none()
})

const defaultPositionOf = (context: NotificationsContext): NotificationPosition => context.position ?? "bottom-right"

export const visibleEntries = (model: Model, context: NotificationsContext = {}): ReadonlyArray<Entry> =>
  distribute(
    model.entries.filter((entry) => !entry.closing),
    defaultPositionOf(context),
    context.limit ?? 5
  ).visible

export const renderedEntries = (model: Model, context: NotificationsContext = {}): ReadonlyArray<Entry> => {
  const visible = new Set(visibleEntries(model, context).map((entry) => entry.id))

  return model.entries.filter((entry) => entry.closing || visible.has(entry.id))
}

export const gotTransition =
  (id: string) =>
  (message: Transition.Message): Message =>
    Message.GotTransition({ id, message })

const paused = (model: Model, entry: Entry, context: NotificationsContext) =>
  context.pauseResetOnHover === "notification" ? entry.hovered : model.entries.some((item) => item.hovered)

const durationOf = (entry: Entry, context: NotificationsContext) =>
  autoCloseOf(context.autoClose === undefined ? 4000 : context.autoClose, entry.autoClose)

type Step = { readonly entry: Entry; readonly commands: ReadonlyArray<Command.Command<Message>> }

const startTimer = (entry: Entry, context: NotificationsContext): Step => {
  const millis = durationOf(entry, context)
  if (typeof millis !== "number") return { entry: { ...entry, running: false }, commands: [] }
  const timer = entry.timer + 1

  return {
    entry: { ...entry, timer, running: true },
    commands: [Command.mapMessage(Wait({ millis }), timerElapsed(entry.id, timer))]
  }
}

const stopTimer = (entry: Entry): Entry =>
  entry.running ? { ...entry, timer: entry.timer + 1, running: false } : entry

const showing = (entry: Entry) => entry.transition.isShowing

const reconcile = (
  model: Model,
  context: NotificationsContext,
  outMessages: ReadonlyArray<OutMessage> = []
): Result => {
  const visible = new Set(visibleEntries(model, context).map((entry) => entry.id))
  const steps = model.entries.map((entry): Step & { readonly opened: boolean } => {
    if (!visible.has(entry.id) || showing(entry) || entry.dismissed) return { entry, commands: [], opened: false }
    const shown = Transition.mounted(entry.transition, true)
    const timed = paused(model, entry, context)
      ? { entry: { ...entry, transition: shown.model }, commands: [] }
      : startTimer({ ...entry, transition: shown.model }, context)

    return {
      entry: timed.entry,
      commands: [...Transition.liftCommands(shown.commands, gotTransition(entry.id)), ...timed.commands],
      opened: true
    }
  })

  return {
    model: { ...model, entries: steps.map((step) => step.entry) },
    commands: steps.flatMap((step) => step.commands),
    outMessages: [
      ...outMessages,
      ...steps.filter((step) => step.opened).map((step) => OutMessage.Opened({ id: step.entry.id }))
    ]
  }
}

const withEntry = (model: Model, id: string, change: (entry: Entry) => Result): Result =>
  Option.match(Option.fromNullishOr(model.entries.find((entry) => entry.id === id)), {
    onNone: () => ({ model, commands: [], outMessages: [] }),
    onSome: change
  })

const replaced = (model: Model, entry: Entry): Model => ({
  ...model,
  entries: model.entries.map((item) => (item.id === entry.id ? entry : item))
})

const hide = (model: Model, id: string, context: NotificationsContext): Result =>
  withEntry(model, id, (entry) => {
    if (entry.closing) return { model, commands: [], outMessages: [] }
    if (!showing(entry))
      return reconcile({ ...model, entries: model.entries.filter((item) => item.id !== id) }, context, [
        OutMessage.Closed({ id })
      ])
    const leaving = Transition.mounted(entry.transition, false)
    const next = reconcile(
      replaced(model, { ...stopTimer(entry), closing: true, transition: leaving.model }),
      context,
      [OutMessage.Closed({ id })]
    )

    return { ...next, commands: [...Transition.liftCommands(leaving.commands, gotTransition(id)), ...next.commands] }
  })

const shown = (model: Model, notification: NotificationData, context: NotificationsContext): Result => {
  const id = notification.id ?? `${model.id}-${model.sequence}`
  if (model.entries.some((entry) => entry.id === id)) return { model, commands: [], outMessages: [] }
  const entry: Entry = {
    ...notification,
    id,
    sequence: model.sequence,
    transition: Transition.init({ id: `${model.id}-${id}`, mounted: false }),
    timer: 0,
    running: false,
    hovered: false,
    offset: 0,
    dismissed: false,
    closing: false,
    dragging: false,
    height: Option.none()
  }

  return reconcile({ ...model, entries: [...model.entries, entry], sequence: model.sequence + 1 }, context)
}

const restartAll = (model: Model, context: NotificationsContext): Result => {
  const steps = model.entries.map((entry): Step => {
    if (!showing(entry) || entry.dismissed) return { entry, commands: [] }
    if (paused(model, entry, context)) return { entry: stopTimer(entry), commands: [] }
    if (entry.running) return { entry, commands: [] }

    return startTimer(entry, context)
  })

  return {
    model: { ...model, entries: steps.map((step) => step.entry) },
    commands: steps.flatMap((step) => step.commands),
    outMessages: []
  }
}

const hovering = (model: Model, id: string, hovered: boolean, context: NotificationsContext): Result =>
  withEntry(model, id, (entry) =>
    restartAll(replaced(model, { ...entry, hovered, offset: hovered ? entry.offset : 0 }), context)
  )

const fromTransition = (model: Model, id: string, message: Transition.Message): Result =>
  withEntry(model, id, (entry) => {
    const result = Transition.update(entry.transition, message)
    const commands = Transition.liftCommands(result.commands, gotTransition(id))
    if (!result.outMessages.some((out) => out._tag === "Exited"))
      return { model: replaced(model, { ...entry, transition: result.model }), commands, outMessages: [] }

    return { model: { ...model, entries: model.entries.filter((item) => item.id !== id) }, commands, outMessages: [] }
  })

const dragEnded = (
  model: Model,
  message: Extract<Message, { readonly _tag: "DragEnded" }>,
  context: NotificationsContext
): Result =>
  withEntry(model, message.id, (entry) => {
    if (!shouldDismiss(message.movement, message.velocity, message.width)) {
      return restartAll(replaced(model, { ...entry, dragging: false, offset: 0 }), context)
    }
    const direction = message.movement < 0 ? -1 : 1

    return {
      model: replaced(model, {
        ...stopTimer(entry),
        dragging: false,
        dismissed: true,
        offset: direction * (message.width + 40)
      }),
      commands: [Command.mapMessage(Wait({ millis: context.transitionDuration ?? 250 }), dismissElapsed(entry.id))],
      outMessages: []
    }
  })

const cleaned = (model: Model): Result => {
  const leaving = model.entries
    .filter((entry) => showing(entry) && !entry.closing)
    .map((entry) => ({ entry, step: Transition.mounted(entry.transition, false) }))
  const closing = new Map(
    leaving.map(({ entry, step }) => [entry.id, { ...stopTimer(entry), closing: true, transition: step.model }])
  )

  return {
    model: {
      ...model,
      entries: model.entries.flatMap((entry) =>
        entry.closing ? [entry] : Option.toArray(Option.fromNullishOr(closing.get(entry.id)))
      )
    },
    commands: leaving.flatMap(({ entry, step }) => Transition.liftCommands(step.commands, gotTransition(entry.id))),
    outMessages: model.entries.filter((entry) => !entry.closing).map((entry) => OutMessage.Closed({ id: entry.id }))
  }
}

const merged = (entry: Entry, notification: NotificationData): Entry => ({ ...entry, ...notification, id: entry.id })

export const update = (model: Model, message: Message, context: NotificationsContext = {}): Result =>
  Message.match(message, {
    Showed: ({ notification }) => shown(model, notification, context),
    Hid: ({ id }) => hide(model, id, context),
    Updated: ({ notification }) =>
      withEntry(model, notification.id ?? "", (entry) => {
        const next = merged(stopTimer(entry), notification)

        return restartAll(replaced(model, next), context)
      }),
    Cleaned: () => cleaned(model),
    CleanedQueue: () => {
      const visible = new Set(visibleEntries(model, context).map((entry) => entry.id))

      return {
        model: { ...model, entries: model.entries.filter((entry) => visible.has(entry.id)) },
        commands: [],
        outMessages: []
      }
    },
    GotTransition: ({ id, message: inner }) => fromTransition(model, id, inner),
    TimerElapsed: ({ id, timer }) =>
      withEntry(model, id, (entry) =>
        entry.timer === timer && entry.running ? hide(model, id, context) : { model, commands: [], outMessages: [] }
      ),
    HoverStarted: ({ id }) => hovering(model, id, true, context),
    HoverEnded: ({ id }) => hovering(model, id, false, context),
    GroupHovered: ({ position, hovered }) => ({
      model: {
        ...model,
        groupHovered: hovered
          ? [...model.groupHovered.filter((item) => item !== position), position]
          : model.groupHovered.filter((item) => item !== position)
      },
      commands: [],
      outMessages: []
    }),
    Pinned: ({ position }) => ({ model: { ...model, pinned: position }, commands: [], outMessages: [] }),
    DragMoved: ({ id, offset }) =>
      withEntry(model, id, (entry) => ({
        model: replaced(model, { ...stopTimer(entry), dragging: true, offset }),
        commands: [],
        outMessages: []
      })),
    DragEnded: (ended) => dragEnded(model, ended, context),
    DismissElapsed: ({ id }) => hide(model, id, context),
    Measured: ({ id, height }) =>
      withEntry(model, id, (entry) => ({
        model: replaced(model, { ...entry, height: Option.some(height) }),
        commands: [],
        outMessages: []
      }))
  })

export const show = (notification: NotificationData): Message => Message.Showed({ notification })

export const hideNotification = (id: string): Message => Message.Hid({ id })

export const updateNotification = (notification: NotificationData & { readonly id: string }): Message =>
  Message.Updated({ notification })

export const clean = (): Message => Message.Cleaned()

export const cleanQueue = (): Message => Message.CleanedQueue()

export const expanded = (model: Model, position: NotificationPosition, context: NotificationsContext = {}): boolean => {
  if (model.groupHovered.includes(position) || Option.contains(model.pinned, position)) return true
  const defaultPosition = defaultPositionOf(context)

  return model.entries.some((entry) => entry.hovered && (entry.position ?? defaultPosition) === position)
}
