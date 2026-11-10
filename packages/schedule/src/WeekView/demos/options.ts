import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { setStyle } from "@sth-ui/core/styles/StylesApi.ts"
import { schedule } from "../../Schedule.ts"
import { weekEvents } from "./events.ts"

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
      schedule.WeekView(h, {
        date: "2025-01-15",
        events: weekEvents,
        now: "2025-01-20 13:00:00",
        mode: "static",
        firstDayOfWeek: 0,
        withWeekendDays: false,
        withWeekNumber: false,
        forceCurrentTimeIndicator: true,
        withCurrentTimeBubble: false,
        eventOverlapMode: "cascade",
        eventOverlapRaiseDelay: 200,
        weekdayFormat: "dddd",
        startTime: "09:00:00",
        endTime: "14:00:00",
        radius: "md",
        slotHeight: 40,
        allDaySlotHeight: 40,
        locale: "en",
        recurrenceExpansionLimit: 10,
        renderWeekLabel: ({ weekStart, weekEnd }) => `${weekStart} to ${weekEnd}`,
        labels: { week: "Wk" },
        previousControlProps: [h.DataAttribute("hint", "back")],
        nextControlProps: [h.DataAttribute("hint", "forward")],
        todayControlProps: [h.DataAttribute("hint", "now")],
        viewSelectProps: [h.DataAttribute("hint", "views")]
      }),
      schedule.WeekView(h, {
        date: "2025-01-15",
        withHeader: false,
        withAllDaySlots: false,
        withCurrentTimeIndicator: false,
        weekLabelFormat: "D MMM",
        styles: { weekViewDayLabel: setStyle(["letterSpacing", "1px"]) },
        attributes: { weekViewDayLabel: { "data-tone": "quiet" } },
        maxHeight: 200
      })
    ]
  })
