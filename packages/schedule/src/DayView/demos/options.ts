import * as stylex from "@stylexjs/stylex"
import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { schedule } from "../../Schedule.ts"
import { day, dayEvents } from "./events.ts"

const custom = stylex.create({ control: { letterSpacing: "1px" } })

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
    cols: 2,
    children: [
      schedule.DayView(h, {
        date: day,
        events: dayEvents,
        now: `${day} 14:00:00`,
        mode: "static",
        eventOverlapMode: "cascade",
        intervalMinutes: 30,
        slotLabelInterval: 120,
        slotLabelFormat: "h A",
        startTime: "08:00:00",
        endTime: "18:00:00",
        withSubHourGridLines: false,
        withCurrentTimeBubble: false,
        headerFormat: (value) => `Static ${value.slice(0, 10)}`,
        labels: { today: "Now" },
        radius: "lg",
        slotHeight: 48,
        allDaySlotHeight: 32,
        renderEventBody: (event) => `★ ${event.title}`,
        styles: { headerControl: custom.control },
        attributes: { event: { "data-tone": "soft" }, moreEventsButton: { "data-tone": "quiet" } },
        previousControlProps: [h.DataAttribute("hint", "back")],
        nextControlProps: [h.DataAttribute("hint", "forward")],
        todayControlProps: [h.DataAttribute("hint", "now")],
        viewSelectProps: [h.DataAttribute("hint", "views")]
      }),
      schedule.DayView(h, {
        date: day,
        events: [],
        withHeader: false,
        now: "2025-01-15 07:00:00",
        startTime: "09:30:00",
        intervalMinutes: 60,
        withSubHourGridLines: false,
        withAllDaySlot: false,
        highlightBusinessHours: true,
        businessHours: ["09:30:00", "11:00:00"],
        locale: "en",
        recurrenceExpansionLimit: 10
      }),
      schedule.DayView(h, {
        date: day,
        events: dayEvents,
        withHeader: false,
        maxHeight: 200,
        startScrollTime: "23:59:00",
        renderEvent: (event, { attributes, children }) =>
          h.div([...attributes, h.DataAttribute("custom", String(event.id))], children),
        getTimeSlotProps: ({ start }) => [h.DataAttribute("slot-hour", start.slice(11, 13))]
      })
    ]
  })
