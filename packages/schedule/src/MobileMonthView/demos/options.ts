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
  ui.SimpleGrid(h, {
    cols: 3,
    children: [
      schedule.MobileMonthView(h, {
        date: "2025-01-15",
        selectedDate: "2025-01-20",
        events: monthEvents,
        mode: "static",
        withOutsideDays: false,
        withWeekendDays: false,
        consistentWeeks: false,
        firstDayOfWeek: 0,
        withWeekNumbers: true,
        weekdayFormat: "ddd",
        eventsHeaderFormat: (value) => `Events on ${value.slice(0, 10)}`,
        radius: "md",
        locale: "en",
        recurrenceExpansionLimit: 10,
        labels: { noEvents: "Free day" },
        getDayProps: (date) => [h.DataAttribute("day", date)],
        getWeekNumberProps: (start) => [h.DataAttribute("week-start", start)],
        styles: { mobileMonthViewHeaderLabel: setStyle(["letterSpacing", "1px"]) },
        attributes: { mobileMonthViewWeek: { "data-tone": "quiet" } },
        onEventClick: () => Message.Noop()
      }),
      schedule.MobileMonthView(h, {
        date: "2025-01-15",
        now: "2025-01-13 08:00:00",
        events: monthEvents,
        withWeekDays: false,
        highlightToday: false,
        renderHeader: ({ date }) => `Custom header for ${date}`,
        renderEvent: (event, { attributes, children }) =>
          h.div([...attributes, h.DataAttribute("custom", String(event.id))], children)
      }),
      schedule.MobileMonthView(h, { date: "2025-03-10", selectedDate: "2025-03-12" })
    ]
  })
