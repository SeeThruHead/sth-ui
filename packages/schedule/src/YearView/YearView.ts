import * as stylex from "@stylexjs/stylex"
import { Array as Arr, Function, Option } from "effect"
import type { Attribute, Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "@sth-ui/core/content.ts"
import { shared } from "@sth-ui/core/styles/shared.ts"
import { radiusValue } from "@sth-ui/core/styles/styleProps.ts"
import type { StyleValue } from "@sth-ui/core/styles/styleProps.ts"
import { setDefinedVars, stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { accentStyle } from "@sth-ui/core/theme/accent.ts"
import { customAccent } from "@sth-ui/core/theme/customAccent.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { accent, fontSize, fontWeight, radius, space } from "@sth-ui/core/theme/tokens.stylex.ts"
import { addMonths, dayOfWeek, isSameMonth, weekNumber } from "@sth-ui/dates/date/date.ts"
import type { DateString, DayOfWeek } from "@sth-ui/dates/date/date.ts"
import { agendaGroups } from "../AgendaView/agenda.ts"
import { dateOf } from "../datetime.ts"
import type { DateTimeString } from "../datetime.ts"
import type { ScheduleEvent as EventData, ScheduleViewLevel } from "../events.ts"
import { formatDateTime } from "../format.ts"
import type { DateLabelFormat } from "../format.ts"
import { scheduleLabels } from "../labels.ts"
import type { ScheduleLabels } from "../labels.ts"
import { monthWeeks } from "../monthLayout.ts"
import { expandRecurringEvents } from "../recurrence.ts"
import { ScheduleHeader } from "../ScheduleHeader/ScheduleHeader.ts"
import type { ScheduleHeaderPart } from "../ScheduleHeader/ScheduleHeader.ts"
import { GridBehaviour } from "../TimeGrid/TimeGrid.ts"
import { yearViewVars } from "./YearView.stylex.ts"

export type YearViewPart =
  | ScheduleHeaderPart
  | "yearView"
  | "yearViewMonths"
  | "yearViewMonth"
  | "yearViewMonthCaption"
  | "yearViewWeekdays"
  | "yearViewWeekdaysCorner"
  | "yearViewWeekday"
  | "yearViewWeek"
  | "yearViewWeekNumber"
  | "yearViewDay"
  | "yearViewDayIndicators"
  | "yearViewDayIndicator"

export type YearViewOptions = {
  readonly monthLabelFormat?: DateLabelFormat
  readonly withWeekNumbers?: boolean
  readonly withWeekDays?: boolean
  readonly locale?: string
  readonly firstDayOfWeek?: DayOfWeek
  readonly weekdayFormat?: DateLabelFormat
  readonly weekendDays?: ReadonlyArray<DayOfWeek>
  readonly withWeekendDays?: boolean
  readonly highlightToday?: boolean
  readonly withOutsideDays?: boolean
  readonly radius?: StyleValue
  readonly withHeader?: boolean
  readonly headerFormat?: DateLabelFormat
  readonly mode?: "default" | "static"
  readonly recurrenceExpansionLimit?: number
}

export type YearViewProps<M> = YearViewOptions &
  StylesApiProps<YearViewPart> & {
    readonly date: DateString
    readonly events?: ReadonlyArray<EventData>
    readonly now?: DateTimeString
    readonly labels?: Partial<ScheduleLabels>
    readonly renderDay?: (date: DateString, events: ReadonlyArray<EventData>) => Child
    readonly getDayProps?: (date: DateString) => ReadonlyArray<Attribute<M>>
    readonly getWeekNumberProps?: (weekStart: DateString) => ReadonlyArray<Attribute<M>>
    readonly previousControlProps?: ReadonlyArray<Attribute<M>>
    readonly nextControlProps?: ReadonlyArray<Attribute<M>>
    readonly todayControlProps?: ReadonlyArray<Attribute<M>>
    readonly viewSelectProps?: ReadonlyArray<Attribute<M>>
    readonly onDateChange?: (date: DateString) => M
    readonly onViewChange?: (view: ScheduleViewLevel) => M
    readonly onDayClick?: (date: DateString) => M
    readonly onWeekNumberClick?: (weekStart: DateString) => M
    readonly onMonthClick?: (monthStart: DateString) => M
  }

export type YearViewConfig = ComponentConfig<YearViewOptions, YearViewPart>

const border = `1px solid light-dark(${palette.gray3}, ${palette.dark4})`
const shade = `light-dark(${palette.gray0}, ${palette.dark6})`

const styles = stylex.create({
  root: { [yearViewVars.radius]: radius.default, containerType: "inline-size" },
  months: {
    display: "grid",
    gridTemplateColumns: {
      default: "repeat(3, 1fr)",
      "@container (width <= 750px)": "repeat(2, 1fr)",
      "@container (width <= 420px)": "1fr"
    }
  },
  month: { minWidth: 0, border, marginTop: "-1px", marginInlineStart: "-1px", padding: space.md },
  caption: {
    display: "block",
    width: "100%",
    marginBottom: space.xs,
    padding: "4px",
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    fontFamily: "inherit",
    color: "inherit",
    textAlign: "center",
    textTransform: "capitalize",
    borderWidth: 0,
    borderRadius: yearViewVars.radius,
    cursor: "pointer",
    backgroundColor: { default: "transparent", ":hover": shade }
  },
  row: { display: "flex" },
  corner: { flex: "0 0 28px" },
  weekday: {
    flex: 1,
    height: "36px",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textTransform: "capitalize",
    opacity: 0.65,
    userSelect: "none"
  },
  weekNumber: {
    flex: "0 0 24px",
    marginInlineEnd: "4px",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    fontFamily: "inherit",
    color: "inherit",
    opacity: 0.65,
    padding: "4px",
    borderWidth: 0,
    borderRadius: yearViewVars.radius,
    cursor: "pointer",
    backgroundColor: { default: "transparent", ":hover": shade }
  },
  day: {
    flex: 1,
    padding: "4px",
    fontSize: fontSize.sm,
    fontFamily: "inherit",
    color: "inherit",
    borderWidth: 0,
    borderRadius: "100%",
    aspectRatio: "1",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    userSelect: "none",
    backgroundColor: { default: "transparent", ":hover": shade }
  },
  placeholder: { pointerEvents: "none" },
  weekend: { color: palette.red6 },
  outside: { opacity: 0.35 },
  today: { backgroundColor: { default: accent.filled, ":hover": accent.filledHover }, color: accent.contrast },
  still: { cursor: "default", pointerEvents: "none" },
  indicators: {
    position: "absolute",
    bottom: "2px",
    insetInline: 0,
    display: "flex",
    justifyContent: "center",
    gap: "2px"
  },
  indicator: { width: "4px", height: "4px", borderRadius: "100%", backgroundColor: accent.filled }
})

const monthsOf = (date: DateString): Arr.NonEmptyReadonlyArray<DateString> =>
  Arr.makeBy(12, (index) => addMonths(`${date.slice(0, 4)}-01-01`, index))

export const YearView =
  (config: { readonly YearView?: YearViewConfig }) =>
  <M>(h: HtmlBuilder<M>, input: YearViewProps<M>): Html => {
    const props = withDefaults(config.YearView, input)
    const getStyles = stylesApi<M, YearViewPart>(h, props, config.YearView, "yearView")
    const labels = scheduleLabels(props.labels)
    const date = props.date
    const locale = props.locale ?? "en"
    const isStatic = props.mode === "static"
    const months = monthsOf(date)
    const yearStart = Arr.headNonEmpty(months)
    const yearEnd = `${date.slice(0, 4)}-12-31`
    const week = {
      firstDayOfWeek: props.firstDayOfWeek ?? 1,
      withWeekendDays: props.withWeekendDays ?? true,
      weekendDays: props.weekendDays ?? [0, 6],
      consistentWeeks: false
    }
    const expanded = expandRecurringEvents({
      events: props.events,
      rangeStart: `${yearStart} 00:00:00`,
      rangeEnd: `${yearEnd} 23:59:59`,
      ...(props.recurrenceExpansionLimit === undefined ? {} : { expansionLimit: props.recurrenceExpansionLimit })
    })
    const byDay = new Map(agendaGroups(expanded, yearStart, yearEnd).map((group) => [group.date, group.events]))
    const eventsOn = (day: DateString) => byDay.get(day) ?? []
    const today = Option.getOrElse(Option.map(Option.fromNullishOr(props.now), dateOf), () => date)
    const isToday = (day: DateString) => (props.highlightToday ?? true) && props.now !== undefined && day === today
    const withWeekNumbers = props.withWeekNumbers === true
    const firstFocus = yearStart

    const dayContent = (day: DateString) =>
      props.renderDay === undefined
        ? [
            String(Number(day.slice(8, 10))),
            h.span(
              getStyles("yearViewDayIndicators", styles.indicators),
              eventsOn(day)
                .slice(0, 3)
                .map((event) =>
                  h.keyed("span")(
                    String(event.id),
                    getStyles("yearViewDayIndicator", ...accentStyle(event.color, customAccent), styles.indicator),
                    []
                  )
                )
            )
          ]
        : [props.renderDay(day, eventsOn(day))]

    const dayNode = (month: DateString) => (day: DateString) => {
      const outside = !isSameMonth(day, month)
      if (outside && props.withOutsideDays === false) {
        return h.keyed("div")(
          day,
          [...getStyles("yearViewDay", styles.day, styles.placeholder), h.DataAttribute("day-placeholder", "")],
          []
        )
      }
      const weekend = week.weekendDays.includes(dayOfWeek(day))

      return h.keyed("button")(
        day,
        [
          ...getStyles(
            "yearViewDay",
            styles.day,
            weekend && styles.weekend,
            outside && styles.outside,
            isToday(day) && styles.today,
            isStatic && styles.still,
            shared.focusRing
          ),
          h.Type("button"),
          h.DataAttribute("day-cell", ""),
          h.AriaLabel(formatDateTime(`${day} 00:00:00`, "MMMM D, YYYY", locale)),
          h.Tabindex(!isStatic && !outside && day === firstFocus ? 0 : -1),
          ...(outside ? [h.DataAttribute("outside", "")] : []),
          ...(weekend ? [h.DataAttribute("weekend", "")] : []),
          ...(isToday(day) ? [h.DataAttribute("today", "")] : []),
          ...(props.onDayClick === undefined || isStatic ? [] : [h.OnClick(props.onDayClick(day))]),
          ...(props.getDayProps?.(day) ?? [])
        ],
        dayContent(day)
      )
    }

    const weekNode = (month: DateString) => (days: Arr.NonEmptyReadonlyArray<DateString>) => {
      const start = Arr.headNonEmpty(days)

      return h.keyed("div")(
        `${month}-${start}`,
        [...getStyles("yearViewWeek", styles.row), h.DataAttribute("day-row", "")],
        [
          ...(withWeekNumbers
            ? [
                h.button(
                  [
                    ...getStyles("yearViewWeekNumber", styles.weekNumber, isStatic && styles.still, shared.focusRing),
                    h.Type("button"),
                    h.AriaLabel(`${labels.week} ${weekNumber(days)}`),
                    h.Title(`${labels.week} ${weekNumber(days)}`),
                    h.Tabindex(isStatic ? -1 : 0),
                    ...(props.onWeekNumberClick === undefined || isStatic
                      ? []
                      : [h.OnClick(props.onWeekNumberClick(start))]),
                    ...(props.getWeekNumberProps?.(start) ?? [])
                  ],
                  [String(weekNumber(days))]
                )
              ]
            : []),
          ...days.map(dayNode(month))
        ]
      )
    }

    const monthNode = (month: DateString) => {
      const weeks = monthWeeks(month, week)

      return h.keyed("div")(month, getStyles("yearViewMonth", styles.month), [
        h.button(
          [
            ...getStyles("yearViewMonthCaption", styles.caption, isStatic && styles.still, shared.focusRing),
            h.Type("button"),
            h.Tabindex(isStatic ? -1 : 0),
            ...(props.onMonthClick === undefined || isStatic ? [] : [h.OnClick(props.onMonthClick(month))])
          ],
          [formatDateTime(`${month} 00:00:00`, props.monthLabelFormat ?? "MMMM", locale)]
        ),
        ...((props.withWeekDays ?? true)
          ? [
              h.div(getStyles("yearViewWeekdays", styles.row), [
                ...(withWeekNumbers ? [h.div(getStyles("yearViewWeekdaysCorner", styles.corner), [])] : []),
                ...Arr.headNonEmpty(weeks).map((day) =>
                  h.keyed("div")(`weekday-${day}`, getStyles("yearViewWeekday", styles.weekday), [
                    formatDateTime(`${day} 00:00:00`, props.weekdayFormat ?? "dd", locale)
                  ])
                )
              ])
            ]
          : []),
        ...weeks.map(weekNode(month))
      ])
    }

    const header =
      (props.withHeader ?? true)
        ? [
            ScheduleHeader(h, {
              ...(props.styles === undefined ? {} : { styles: props.styles }),
              ...(props.attributes === undefined ? {} : { attributes: props.attributes }),
              view: "year",
              labels,
              title: formatDateTime(`${date} 00:00:00`, props.headerFormat ?? "YYYY", locale),
              ...(props.onDateChange === undefined
                ? {}
                : {
                    onPrevious: props.onDateChange(addMonths(date, -12)),
                    onNext: props.onDateChange(addMonths(date, 12)),
                    onToday: props.onDateChange(today)
                  }),
              ...(props.onViewChange === undefined ? {} : { onViewChange: props.onViewChange }),
              ...(props.previousControlProps === undefined ? {} : { previousControlProps: props.previousControlProps }),
              ...(props.nextControlProps === undefined ? {} : { nextControlProps: props.nextControlProps }),
              ...(props.todayControlProps === undefined ? {} : { todayControlProps: props.todayControlProps }),
              ...(props.viewSelectProps === undefined ? {} : { viewSelectProps: props.viewSelectProps })
            })
          ]
        : []

    return h.div(
      [
        ...getStyles(
          "yearView",
          styles.root,
          setDefinedVars([yearViewVars.radius, props.radius === undefined ? undefined : radiusValue(props.radius)])
        ),
        ...(isStatic ? [h.DataAttribute("static", "")] : []),
        h.OnMount(Mount.mapMessage(GridBehaviour({ startScrollTime: "", layout: "flow" }), Function.absurd<M>))
      ],
      [...header, h.div(getStyles("yearViewMonths", styles.months), months.map(monthNode))]
    )
  }
