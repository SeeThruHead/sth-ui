import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { setStyle } from "@sth-ui/core/styles/StylesApi.ts"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { schedule } from "../../Schedule.ts"
import { monthEvents } from "./events.ts"

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
      schedule.MonthView(h, {
        date: "2025-01-15",
        events: [
          ...monthEvents,
          { id: "kickoff", title: "Kickoff", start: "2025-01-27 00:00:00", end: "2025-01-27 23:59:59", color: "lime" },
          {
            id: "workshop",
            title: "Workshop",
            start: "2025-01-27 10:00:00",
            end: "2025-01-29 18:00:00",
            color: "violet"
          },
          { id: "demo", title: "Demo day", start: "2025-01-29 09:00:00", end: "2025-01-29 10:00:00", color: "yellow" }
        ],
        mode: "static",
        firstDayOfWeek: 0,
        withWeekendDays: false,
        withOutsideDays: false,
        consistentWeeks: false,
        maxEventsPerDay: 1,
        weekdayFormat: "dddd",
        headerFormat: (value) => `Month of ${value.slice(0, 7)}`,
        radius: "lg",
        locale: "en",
        recurrenceExpansionLimit: 10,
        withWeekNumbers: true,
        renderEventBody: (event) => `• ${event.title}`,
        getDayProps: (date) => [h.DataAttribute("day", date)],
        getWeekNumberProps: (start) => [h.DataAttribute("week-start", start)],
        styles: { monthViewDay: setStyle(["letterSpacing", "1px"]) },
        attributes: { monthViewWeekday: { "data-tone": "quiet" } },
        previousControlProps: [h.DataAttribute("hint", "back")],
        nextControlProps: [h.DataAttribute("hint", "forward")],
        todayControlProps: [h.DataAttribute("hint", "now")],
        viewSelectProps: [h.DataAttribute("hint", "views")]
      }),
      schedule.MonthView(h, {
        date: "2025-02-10",
        withHeader: false,
        withWeekDays: false,
        highlightToday: false,
        now: "2025-02-10 08:00:00",
        renderEvent: (event, { attributes, children }) =>
          h.div([...attributes, h.DataAttribute("custom", String(event.id))], children),
        events: [
          { id: "x", title: "Planning", start: "2025-02-10 09:00:00", end: "2025-02-10 10:00:00", color: "blue" }
        ]
      }),
      schedule.MonthView(h, { date: "2025-03-10", withHeader: false })
    ]
  })
