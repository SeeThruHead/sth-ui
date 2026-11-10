import { Effect, Function, Schema, Stream } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Mount from "foldkit/mount"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { addMinutes } from "../../datetime.ts"
import { ScheduleEvent } from "../../events.ts"
import { schedule } from "../../Schedule.ts"
import * as Interaction from "../interaction.ts"
import * as DayView from "../model.ts"
import type { InteractionContext } from "../interaction.ts"
import { day } from "./events.ts"

export const Model = Schema.Struct({
  events: Schema.Array(ScheduleEvent),
  day: DayView.Model,
  log: Schema.String
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotDayView: { message: DayView.Message } })
export type Message = typeof Message.Type

const settings = { startTime: "08:00:00", endTime: "14:00:00", intervalMinutes: 30 } as const

export const init = (): Model => ({
  events: [
    { id: "focus", title: "Focus time", start: `${day} 09:00:00`, end: `${day} 10:30:00`, color: "teal" },
    { id: 7, title: "Interview", start: `${day} 11:00:00`, end: `${day} 12:00:00`, color: "orange" },
    { id: "locked", title: "Locked", start: `${day} 12:30:00`, end: `${day} 13:30:00`, color: "gray" }
  ],
  day: DayView.init({ id: "dragging" }),
  log: "Drag, resize or select"
})

const context = (model: Model): InteractionContext => ({
  events: model.events,
  preventEventOverlap: true,
  ...settings
})

const moveTo = (model: Model, id: string | number, start: string, end: string) =>
  model.events.map((event) => (event.id === id ? { ...event, start, end } : event))

const apply = (model: Model, out: Interaction.OutMessage): Model =>
  Interaction.OutMessage.match(out, {
    EventDropped: ({ eventId, newStart, newEnd }) => ({
      ...model,
      events: moveTo(model, eventId, newStart, newEnd),
      log: `Moved to ${newStart.slice(11, 16)}`
    }),
    EventResized: ({ eventId, newStart, newEnd }) => ({
      ...model,
      events: moveTo(model, eventId, newStart, newEnd),
      log: `Now ${newStart.slice(11, 16)} to ${newEnd.slice(11, 16)}`
    }),
    SlotsSelected: ({ rangeStart, rangeEnd }) => ({
      ...model,
      events: [
        ...model.events,
        { id: `new-${rangeStart}`, title: "New event", start: rangeStart, end: rangeEnd, color: "grape" }
      ],
      log: `Created ${rangeStart.slice(11, 16)} to ${rangeEnd.slice(11, 16)}`
    }),
    DropRejected: ({ conflicts }) => ({ ...model, log: `Drop rejected: overlaps ${conflicts.join(", ")}` }),
    ExternalEventDropped: ({ data, start }) => ({
      ...model,
      events: [
        ...model.events,
        {
          id: `call-${start}`,
          title: data["text/plain"] ?? "Dropped",
          start,
          end: addMinutes(start, 30),
          color: "blue"
        }
      ],
      log: `Dropped at ${start.slice(11, 16)}`
    }),
    ResizeRejected: ({ conflicts }) => ({ ...model, log: `Resize rejected: overlaps ${conflicts.join(", ")}` })
  })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
  const result = DayView.update(model.day, message.message, context(model))

  return {
    model: result.outMessages.reduce(apply, { ...model, day: result.model }),
    commands: result.commands.map((command) =>
      Command.mapMessage(command, (inner) => Message.GotDayView({ message: inner }))
    )
  }
}

const setText = (text: string) => (event: Event) => {
  if (event instanceof DragEvent) event.dataTransfer?.setData("text/plain", text)
}

const DragData = Mount.defineStream("DemoDragData", {
  args: { text: Schema.String },
  messages: [Schema.Never],
  execute: ({ element, text }) =>
    Stream.callback<never>(() =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const listener = setText(text)
          element.addEventListener("dragstart", listener)

          return () => element.removeEventListener("dragstart", listener)
        }),
        (release) => Effect.sync(release)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      h.div(
        [
          h.Attribute("draggable", "true"),
          h.Style({
            alignSelf: "flex-start",
            padding: "4px 10px",
            borderRadius: "16px",
            border: "1px dashed currentColor",
            cursor: "grab"
          }),
          h.OnMount(Mount.mapMessage(DragData({ text: "Call Sam" }), Function.absurd<Message>))
        ],
        ["Call Sam"]
      ),
      schedule.DayView(h, {
        date: day,
        events: model.events,
        ...settings,
        withHeader: false,
        withAllDaySlot: false,
        withEventsDragAndDrop: true,
        withEventResize: true,
        withDragSlotSelect: true,
        withExternalEventDrop: true,
        eventOverlapMode: "cascade",
        eventOverlapRaiseDelay: 300,
        canDragEvent: (event) => event.id !== "locked",
        canResizeEvent: (event) => event.id !== "locked",
        model: model.day,
        toParentMessage: (message) => Message.GotDayView({ message })
      }),
      ui.Text(h, { size: "sm", children: [model.log] })
    ]
  })
