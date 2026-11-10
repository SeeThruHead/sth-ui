import * as stylex from "@stylexjs/stylex"
import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { addYears, formatDate } from "../../date/date.ts"
import { dates } from "../../Dates.ts"

export const Model = Schema.Struct({
  year: Schema.String,
  level: Schema.Literals(["year", "decade"]),
  month: Schema.String,
  picked: Schema.String,
  hovered: Schema.String
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Previous: {},
  Next: {},
  Up: {},
  PickedMonth: { month: Schema.String },
  PickedYear: { year: Schema.String },
  Hovered: { value: Schema.String }
})
export type Message = typeof Message.Type

export const init = (): Model => ({ year: "2024-01-01", level: "year", month: "2024-03-01", picked: "", hovered: "" })

const step = (model: Model) => (model.level === "year" ? 1 : 10)

export const update = (model: Model, message: Message): { readonly model: Model } =>
  Message.match(message, {
    Previous: () => ({ model: { ...model, year: addYears(model.year, -step(model)) } }),
    Next: () => ({ model: { ...model, year: addYears(model.year, step(model)) } }),
    Up: () => ({ model: { ...model, level: "decade" as const } }),
    PickedMonth: ({ month }) => ({ model: { ...model, month, picked: month } }),
    PickedYear: ({ year }) => ({ model: { ...model, year, level: "year" as const, picked: year } }),
    Hovered: ({ value }) => ({ model: { ...model, hovered: value } })
  })

const custom = stylex.create({ bold: { fontWeight: 700 } })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      h.div(
        [],
        [
          dates.CalendarHeader(h, {
            label: model.level === "year" ? formatDate(model.year, "YYYY") : "2020 – 2029",
            levelLabel: "Change level",
            hasNextLevel: model.level === "year",
            onPrevious: Message.Previous(),
            onNext: Message.Next(),
            onLevelClick: Message.Up(),
            nextDisabled: model.year >= "2026-01-01"
          }),
          model.level === "year"
            ? dates.MonthsList(h, {
                year: model.year,
                today: "2024-07-15",
                minDate: "2024-02-10",
                getMonthControlProps: (month) => ({ selected: month === model.month }),
                onMonthClick: (month) => Message.PickedMonth({ month }),
                onMonthMouseEnter: (month) => Message.Hovered({ value: month })
              })
            : dates.YearsList(h, {
                decade: model.year,
                maxDate: "2027-06-01",
                onYearClick: (year) => Message.PickedYear({ year }),
                onYearMouseEnter: (year) => Message.Hovered({ value: year }),
                getYearControlProps: (year) => ({
                  inRange: year >= "2021-01-01" && year <= "2023-01-01",
                  firstInRange: year === "2021-01-01",
                  lastInRange: year === "2023-01-01"
                })
              })
        ]
      ),
      ui.Text(h, {
        size: "sm",
        children: [`Picked ${model.picked || "nothing"}; hovering ${model.hovered || "nothing"}`]
      }),
      h.div(
        [h.Style({ width: "320px" })],
        [
          dates.CalendarHeader(h, {
            label: "Static",
            hasNextLevel: false,
            headerControlsOrder: ["level", "previous", "next"],
            withNext: false,
            previousDisabled: true,
            previousIcon: "‹",
            previousLabel: "Back",
            fullWidth: true,
            size: "lg",
            styles: { calendarHeaderLevel: custom.bold }
          }),
          dates.MonthsList(h, {
            year: "2024-01-01",
            monthsListFormat: "MMMM",
            locale: "fr",
            withCellSpacing: false,
            fullWidth: true,
            size: "xs",
            focusableDate: "2024-05-01",
            unstyled: false
          }),
          dates.YearsList(h, {
            decade: "2030-01-01",
            today: "2034-02-02",
            focusableDate: "2036-03-01",
            yearsListFormat: "YY",
            styles: { pickerControl: custom.bold }
          }),
          dates.PickerControl(h, { children: ["Solo"] }),
          dates.YearsList(h, {
            decade: "2040-01-01",
            minDate: "2045-01-01",
            getYearControlProps: (year) => ({ selected: year === "2047-01-01", disabled: year === "2046-01-01" })
          }),
          dates.CalendarHeader(h, { label: "Next only", withPrevious: false, nextIcon: "›" })
        ]
      )
    ]
  })
