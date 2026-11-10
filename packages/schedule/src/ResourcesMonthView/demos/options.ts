import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { setStyle } from "@sth-ui/core/styles/StylesApi.ts"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { schedule } from "../../Schedule.ts"
import { rooms } from "../../ResourcesDayView/demos/data.ts"
import { monthBookings } from "./usage.ts"

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
      schedule.ResourcesMonthView(h, {
        date: "2025-01-15",
        resources: rooms,
        events: monthBookings,
        mode: "static",
        withWeekendDays: false,
        maxEventsPerTimeSlot: 1,
        weekdayFormat: "dd",
        headerFormat: (value) => `Bookings in ${value.slice(0, 7)}`,
        radius: "md",
        rowHeight: 48,
        groupLabelWidth: 90,
        maxHeight: 300,
        locale: "en",
        recurrenceExpansionLimit: 3,
        renderEventBody: (event) => `• ${event.title}`,
        renderResourceLabel: (resource) => `Room ${resource.label}`,
        renderGroupLabel: (group) => group.label.toUpperCase(),
        groups: [{ label: "Upstairs", resourceIds: ["orion"] }],
        styles: { resourcesMonthViewResourceLabel: setStyle(["letterSpacing", "1px"]) },
        attributes: { resourcesMonthViewRow: { "data-tone": "quiet" } },
        previousControlProps: [h.DataAttribute("hint", "back")],
        nextControlProps: [h.DataAttribute("hint", "forward")],
        todayControlProps: [h.DataAttribute("hint", "now")],
        viewSelectProps: [h.DataAttribute("hint", "views")],
        onEventClick: () => Message.Noop()
      }),
      schedule.ResourcesMonthView(h, {
        date: "2025-02-10",
        resources: rooms.slice(0, 1),
        withHeader: false,
        highlightToday: false,
        now: "2025-02-10 09:00:00",
        renderEvent: (event, { attributes, children }) =>
          h.div([...attributes, h.DataAttribute("custom", String(event.id))], children),
        events: [
          {
            id: "x",
            title: "Planning",
            start: "2025-02-10 09:00:00",
            end: "2025-02-10 10:00:00",
            color: "blue",
            resourceId: "orion"
          }
        ]
      }),
      schedule.ResourcesMonthView(h, { date: "2025-03-10", resources: rooms.slice(0, 1), withHeader: false })
    ]
  })
