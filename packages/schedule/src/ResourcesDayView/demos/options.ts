import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { setStyle } from "@sth-ui/core/styles/StylesApi.ts"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { schedule } from "../../Schedule.ts"
import { day, floors, roomEvents, rooms } from "./data.ts"

export const Model = Schema.Struct({})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Noop: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({})

export const update = (
  model: Model
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => ({ model, commands: [] })

export const view = (_model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      schedule.ResourcesDayView(h, {
        date: day,
        resources: rooms,
        groups: floors,
        events: roomEvents,
        mode: "static",
        highlightBusinessHours: true,
        businessHours: ["09:15:00", "13:45:00"],
        now: `${day} 21:00:00`,
        startTime: "09:00:00",
        endTime: "14:00:00",
        maxEventsPerTimeSlot: 3,
        minEventSize: 24,
        slotLabelFormat: "h A",
        headerFormat: (value) => `Rooms on ${value.slice(0, 10)}`,
        radius: "md",
        rowHeight: 48,
        groupLabelWidth: 100,
        maxHeight: 300,
        locale: "en",
        recurrenceExpansionLimit: 10,
        renderEventBody: (event) => `• ${event.title}`,
        renderResourceLabel: (resource) => `Room ${resource.label}`,
        renderGroupLabel: (group) => group.label.toUpperCase(),
        styles: { resourcesDayViewResourceLabel: setStyle(["letterSpacing", "1px"]) },
        attributes: { resourcesDayViewRow: { "data-tone": "quiet" } },
        previousControlProps: [h.DataAttribute("hint", "back")],
        nextControlProps: [h.DataAttribute("hint", "forward")],
        todayControlProps: [h.DataAttribute("hint", "now")],
        viewSelectProps: [h.DataAttribute("hint", "views")],
        onEventClick: () => Message.Noop()
      }),
      schedule.ResourcesDayView(h, {
        date: day,
        resources: rooms.slice(0, 2),
        events: roomEvents,
        withHeader: false,
        withCurrentTimeIndicator: false,
        renderEvent: (event, { attributes, children }) =>
          h.div([...attributes, h.DataAttribute("custom", String(event.id))], children)
      })
    ]
  })
