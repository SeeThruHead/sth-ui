import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { setStyle } from "@sth-ui/core/styles/StylesApi.ts"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { schedule } from "../../Schedule.ts"
import { rooms } from "../../ResourcesDayView/demos/data.ts"
import { weekBookings } from "./usage.ts"

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
      schedule.ResourcesWeekView(h, {
        date: "2025-01-15",
        resources: rooms.slice(0, 3),
        events: weekBookings,
        mode: "static",
        firstDayOfWeek: 0,
        startTime: "09:00:00",
        endTime: "13:00:00",
        intervalMinutes: 120,
        weekdayFormat: "dd D",
        weekLabelFormat: "D MMM",
        locale: "en",
        recurrenceExpansionLimit: 2,
        renderWeekLabel: ({ weekStart, weekEnd }) => `${weekStart} to ${weekEnd}`,
        styles: { resourcesWeekViewDayLabel: setStyle(["letterSpacing", "1px"]) },
        attributes: { resourcesWeekViewRow: { "data-tone": "quiet" } },
        previousControlProps: [h.DataAttribute("hint", "back")],
        nextControlProps: [h.DataAttribute("hint", "forward")],
        todayControlProps: [h.DataAttribute("hint", "now")],
        viewSelectProps: [h.DataAttribute("hint", "views")]
      }),
      schedule.ResourcesWeekView(h, {
        date: "2025-01-15",
        resources: rooms.slice(0, 1),
        withHeader: false,
        slotWidth: 12
      })
    ]
  })
