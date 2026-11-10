import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { setStyle } from "@sth-ui/core/styles/StylesApi.ts"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { monthEvents } from "../../MonthView/demos/events.ts"
import { schedule } from "../../Schedule.ts"

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
      schedule.YearView(h, {
        date: "2025-06-01",
        events: monthEvents,
        mode: "static",
        withWeekNumbers: true,
        withOutsideDays: false,
        withWeekendDays: false,
        firstDayOfWeek: 0,
        weekdayFormat: "ddd",
        monthLabelFormat: "MMM",
        headerFormat: (value) => `Year ${value.slice(0, 4)}`,
        radius: "md",
        locale: "en",
        recurrenceExpansionLimit: 10,
        getDayProps: (date) => [h.DataAttribute("day", date)],
        getWeekNumberProps: (start) => [h.DataAttribute("week-start", start)],
        styles: { yearViewMonthCaption: setStyle(["letterSpacing", "1px"]) },
        attributes: { yearViewMonth: { "data-tone": "quiet" } },
        previousControlProps: [h.DataAttribute("hint", "back")],
        nextControlProps: [h.DataAttribute("hint", "forward")],
        todayControlProps: [h.DataAttribute("hint", "now")],
        viewSelectProps: [h.DataAttribute("hint", "views")]
      }),
      schedule.YearView(h, {
        date: "2026-03-01",
        withHeader: false,
        withWeekDays: false,
        highlightToday: false,
        now: "2026-03-02 09:00:00",
        renderDay: (date, events) => `${Number(date.slice(8, 10))}${events.length > 0 ? "*" : ""}`,
        events: [
          { id: "x", title: "Planning", start: "2026-03-02 09:00:00", end: "2026-03-02 10:00:00", color: "blue" }
        ]
      }),
      schedule.YearView(h, { date: "2027-01-01", withHeader: false })
    ]
  })
