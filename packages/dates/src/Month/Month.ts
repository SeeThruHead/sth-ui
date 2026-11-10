import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "@sth-ui/core/content.ts"
import { stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { colors, fontWeight } from "@sth-ui/core/theme/tokens.stylex.ts"
import { dayOfWeek, formatDate, isInRange, isSameDay, isSameMonth, monthDays, weekNumber } from "../date/date.ts"
import type { DateString, DayOfWeek } from "../date/date.ts"
import { Day } from "../Day/Day.ts"
import type { DayConfig, DayPart, DaySize, DayState } from "../Day/Day.ts"
import { dayVars } from "../Day/day.stylex.ts"
import { WeekdaysRow } from "../WeekdaysRow/WeekdaysRow.ts"
import type { WeekdaysRowConfig, WeekdaysRowPart } from "../WeekdaysRow/WeekdaysRow.ts"

export type MonthPart =
  | "month"
  | "monthThead"
  | "monthTbody"
  | "monthRow"
  | "monthCell"
  | "weekNumber"
  | DayPart
  | WeekdaysRowPart

export type MonthOptions = {
  readonly locale?: string
  readonly firstDayOfWeek?: DayOfWeek
  readonly weekdayFormat?: string
  readonly weekendDays?: ReadonlyArray<DayOfWeek>
  readonly size?: DaySize
  readonly withCellSpacing?: boolean
  readonly highlightToday?: boolean
  readonly withWeekNumbers?: boolean
  readonly hideOutsideDates?: boolean
  readonly hideWeekdays?: boolean
  readonly fullWidth?: boolean
  readonly consistentWeeks?: boolean
}

export type MonthSettings<M> = MonthOptions & {
  readonly today?: DateString
  readonly minDate?: DateString
  readonly maxDate?: DateString
  readonly excludeDate?: (date: DateString) => boolean
  readonly getDayProps?: (date: DateString) => DayState
  readonly renderDay?: (date: DateString) => Child
  readonly getDayAriaLabel?: (date: DateString) => string
  readonly onDayClick?: (date: DateString) => M
  readonly onDayMouseEnter?: (date: DateString) => M
  readonly focusableDate?: DateString
}

export type MonthProps<M> = MonthSettings<M> &
  StylesApiProps<MonthPart> & {
    readonly month: DateString
    readonly static?: boolean
  }

export type MonthConfig = ComponentConfig<MonthOptions, MonthPart>

const styles = stylex.create({
  month: { borderCollapse: "collapse", tableLayout: "fixed" },
  fullWidth: { width: "100%" },
  cell: { padding: 0 },
  spacing: { padding: "0.5px" },
  weekNumber: {
    color: colors.dimmed,
    fontWeight: fontWeight.regular,
    fontSize: `calc(${dayVars.size} / 2.8)`,
    textAlign: "center",
    width: dayVars.size
  }
})

const tabTarget = <M>(
  props: MonthProps<M>,
  dates: ReadonlyArray<DateString>,
  enabled: (date: DateString) => boolean
) => {
  const usable = dates.filter(enabled)
  const selected = usable.find((date) => props.getDayProps?.(date).selected === true)
  const focusable = usable.find((date) => props.focusableDate !== undefined && isSameDay(date, props.focusableDate))
  const today = usable.find((date) => props.today !== undefined && isSameDay(date, props.today))

  return focusable ?? selected ?? today ?? usable[0]
}

export const Month =
  (config: { readonly Month?: MonthConfig; readonly Day?: DayConfig; readonly WeekdaysRow?: WeekdaysRowConfig }) =>
  <M>(h: HtmlBuilder<M>, input: MonthProps<M>): Html => {
    const props = withDefaults(config.Month, input)
    const getStyles = stylesApi<M, MonthPart>(h, props, config.Month, "month")
    const locale = props.locale ?? "en"
    const weeks = monthDays({
      month: props.month,
      firstDayOfWeek: props.firstDayOfWeek ?? 1,
      consistentWeeks: props.consistentWeeks === true
    })
    const weekend = props.weekendDays ?? [0, 6]
    const outside = (date: DateString) => !isSameMonth(date, props.month)
    const disabledDate = (date: DateString) => {
      if (props.excludeDate?.(date) === true) return true
      if (!isInRange(date, props.minDate, props.maxDate)) return true

      return props.getDayProps?.(date).disabled === true
    }
    const enabled = (date: DateString) => {
      if (disabledDate(date)) return false

      return props.hideOutsideDates !== true || !outside(date)
    }
    const inTabOrder = tabTarget(props, weeks.flat(), enabled)
    const day = Day(config)
    const forwarded = {
      ...(props.styles === undefined ? {} : { styles: props.styles }),
      ...(props.unstyled === undefined ? {} : { unstyled: props.unstyled })
    }
    const cell = (date: DateString) =>
      h.td(getStyles("monthCell", styles.cell, props.withCellSpacing !== false && styles.spacing), [
        day(h, {
          ...forwarded,
          ...props.getDayProps?.(date),
          date,
          size: props.size ?? "sm",
          weekend: weekend.includes(dayOfWeek(date)),
          outside: outside(date),
          hidden: props.hideOutsideDates === true && outside(date),
          disabled: disabledDate(date),
          static: props.static === true,
          fullWidth: props.fullWidth === true,
          highlightToday: props.highlightToday === true,
          ariaLabel: props.getDayAriaLabel?.(date) ?? formatDate(date, "D MMMM YYYY", locale),
          tabIndex: inTabOrder !== undefined && isSameDay(date, inTabOrder) ? 0 : -1,
          ...(props.today === undefined ? {} : { today: props.today }),
          ...(props.renderDay === undefined ? {} : { renderDay: props.renderDay }),
          ...(props.onDayClick === undefined ? {} : { onClick: props.onDayClick(date) }),
          ...(props.onDayMouseEnter === undefined ? {} : { onMouseEnter: props.onDayMouseEnter(date) })
        })
      ])

    return h.table(
      [
        ...getStyles("month", styles.month, props.fullWidth === true && styles.fullWidth),
        ...(props.fullWidth === true ? [h.DataAttribute("full-width", "")] : [])
      ],
      [
        ...(props.hideWeekdays === true
          ? []
          : [
              h.thead(getStyles("monthThead"), [
                WeekdaysRow(config)(h, {
                  locale,
                  firstDayOfWeek: props.firstDayOfWeek ?? 1,
                  weekdayFormat: props.weekdayFormat ?? "dd",
                  size: props.size ?? "sm",
                  withWeekNumbers: props.withWeekNumbers === true,
                  ...forwarded
                })
              ])
            ]),
        h.tbody(
          getStyles("monthTbody"),
          weeks.map((week) =>
            h.tr(getStyles("monthRow"), [
              ...(props.withWeekNumbers === true
                ? [h.td(getStyles("weekNumber", styles.weekNumber), [String(weekNumber(week))])]
                : []),
              ...week.map(cell)
            ])
          )
        )
      ]
    )
  }
