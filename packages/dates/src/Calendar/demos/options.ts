import * as stylex from "@stylexjs/stylex"
import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { dates } from "../../Dates.ts"
import * as Calendar from "../model.ts"

const bold = stylex.create({ level: { fontWeight: 700 } })

const context = { numberOfColumns: 2, maxLevel: "year" as const }

export const Model = Schema.Struct({ calendar: Calendar.Model, decades: Calendar.Model, hovered: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotCalendar: { message: Calendar.Message },
  GotDecades: { message: Calendar.Message },
  Hovered: { value: Schema.String }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  calendar: Calendar.init({ id: "two", date: "2024-05-01" }, context),
  decades: Calendar.init({ id: "decades", date: "2024-05-01", level: "decade" }, { minLevel: "year" }),
  hovered: ""
})

export const update = (model: Model, message: Message): { readonly model: Model } =>
  Message.match(message, {
    GotCalendar: ({ message: inner }) => ({
      model: { ...model, calendar: Calendar.update(model.calendar, inner, context).model }
    }),
    GotDecades: ({ message: inner }) => ({
      model: { ...model, decades: Calendar.update(model.decades, inner, { minLevel: "year" }).model }
    }),
    Hovered: ({ value }) => ({ model: { ...model, hovered: value } })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.Text(h, { size: "sm", children: [`Hovering ${model.hovered || "nothing"}`] }),
      dates.Calendar(h, {
        ...context,
        model: model.calendar,
        toParentMessage: (inner) => Message.GotCalendar({ message: inner }),
        minDate: "2024-04-10",
        maxDate: "2024-08-20",
        monthLabelFormat: "MMM YYYY",
        monthsListFormat: "MMMM",
        yearLabelFormat: "[Year] YYYY",
        ariaLabels: {
          nextMonth: "Next month",
          previousMonth: "Previous month",
          monthLevelControl: "Pick a month",
          nextYear: "Next year",
          previousYear: "Previous year",
          yearLevelControl: "Pick a year"
        },
        firstDayOfWeek: 0,
        getMonthControlProps: (month) => ({ selected: month === "2024-06-01" }),
        onMonthMouseEnter: (month) => Message.Hovered({ value: month }),
        unstyled: false
      }),
      dates.Calendar(h, {
        model: model.decades,
        toParentMessage: (inner) => Message.GotDecades({ message: inner }),
        minLevel: "year",
        decadeLabelFormat: "YY",
        yearsListFormat: "YYYY",
        nextLabel: "Later",
        previousLabel: "Earlier",
        ariaLabels: { nextDecade: "Next decade", previousDecade: "Previous decade" },
        getYearControlProps: (year) => ({ selected: year === "2026-01-01" }),
        onYearMouseEnter: (year) => Message.Hovered({ value: year }),
        styles: { calendarHeaderLevel: bold.level },
        enableKeyboardNavigation: false,
        size: "xs"
      }),
      ui.Group(h, {
        children: (["year", "decade"] as const).map((level) =>
          dates.Calendar(h, {
            model: Calendar.init({ id: `static-${level}`, date: "1990-02-01", level }),
            toParentMessage: (inner) => Message.GotCalendar({ message: inner }),
            static: true,
            size: "xs"
          })
        )
      }),
      dates.Calendar(h, {
        model: Calendar.init({ id: "static", date: "2024-02-01" }),
        toParentMessage: (inner) => Message.GotCalendar({ message: inner }),
        static: true,
        fullWidth: true,
        headerControlsOrder: ["previous", "next", "level"],
        nextIcon: "›",
        previousIcon: "‹"
      })
    ]
  })
