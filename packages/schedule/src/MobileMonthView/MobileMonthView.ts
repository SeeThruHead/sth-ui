import * as stylex from "@stylexjs/stylex"
import { Array as Arr, Function, Option } from "effect"
import type { Attribute, Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "@sth-ui/core/content.ts"
import { shared } from "@sth-ui/core/styles/shared.ts"
import { radiusValue } from "@sth-ui/core/styles/styleProps.ts"
import type { StyleValue } from "@sth-ui/core/styles/styleProps.ts"
import { setDefinedVars, stylesApi, sx, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { accentStyle } from "@sth-ui/core/theme/accent.ts"
import { customAccent } from "@sth-ui/core/theme/customAccent.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { accent, colors, fontSize, fontWeight, radius, space } from "@sth-ui/core/theme/tokens.stylex.ts"
import { dayOfWeek, endOfMonth, isSameMonth, startOfMonth, weekNumber } from "@sth-ui/dates/date/date.ts"
import type { DateString, DayOfWeek } from "@sth-ui/dates/date/date.ts"
import { agendaGroups } from "../AgendaView/agenda.ts"
import { isAllDayEvent, isMultidayEvent } from "../dayLayout.ts"
import { dateOf } from "../datetime.ts"
import type { DateTimeString } from "../datetime.ts"
import type { ScheduleEvent as EventData } from "../events.ts"
import { formatDateTime } from "../format.ts"
import type { DateLabelFormat } from "../format.ts"
import { scheduleLabels } from "../labels.ts"
import type { ScheduleLabels } from "../labels.ts"
import { monthWeeks } from "../monthLayout.ts"
import { expandRecurringEvents } from "../recurrence.ts"
import type { RenderEvent } from "../ScheduleEvent/ScheduleEvent.ts"
import { GridBehaviour } from "../TimeGrid/TimeGrid.ts"
import { mobileMonthViewVars } from "./MobileMonthView.stylex.ts"

export type MobileMonthViewPart =
  | "mobileMonthView"
  | "mobileMonthViewHeader"
  | "mobileMonthViewHeaderBackButton"
  | "mobileMonthViewHeaderLabel"
  | "mobileMonthViewCalendar"
  | "mobileMonthViewWeekdays"
  | "mobileMonthViewWeekdaysCorner"
  | "mobileMonthViewWeekday"
  | "mobileMonthViewWeek"
  | "mobileMonthViewWeekNumber"
  | "mobileMonthViewDay"
  | "mobileMonthViewDayIndicators"
  | "mobileMonthViewDayIndicator"
  | "mobileMonthViewEventsList"
  | "mobileMonthViewEventsHeader"
  | "mobileMonthViewEvent"
  | "mobileMonthViewEventBody"
  | "mobileMonthViewEventColor"
  | "mobileMonthViewEventTitle"
  | "mobileMonthViewEventTime"
  | "mobileMonthViewNoEvents"

export type MobileMonthViewOptions = {
  readonly withWeekNumbers?: boolean
  readonly withWeekDays?: boolean
  readonly locale?: string
  readonly firstDayOfWeek?: DayOfWeek
  readonly weekdayFormat?: DateLabelFormat
  readonly weekendDays?: ReadonlyArray<DayOfWeek>
  readonly withWeekendDays?: boolean
  readonly consistentWeeks?: boolean
  readonly highlightToday?: boolean
  readonly radius?: StyleValue
  readonly withOutsideDays?: boolean
  readonly mode?: "default" | "static"
  readonly eventsHeaderFormat?: DateLabelFormat
  readonly recurrenceExpansionLimit?: number
}

export type MobileMonthViewProps<M> = MobileMonthViewOptions &
  StylesApiProps<MobileMonthViewPart> & {
    readonly date: DateString
    readonly selectedDate?: DateString
    readonly events?: ReadonlyArray<EventData>
    readonly now?: DateTimeString
    readonly labels?: Partial<ScheduleLabels>
    readonly renderEvent?: RenderEvent<M>
    readonly renderHeader?: (input: {
      readonly mode: "default" | "static"
      readonly date: DateString
      readonly defaultHeader: ReadonlyArray<Html>
    }) => Child
    readonly getDayProps?: (date: DateString) => ReadonlyArray<Attribute<M>>
    readonly getWeekNumberProps?: (weekStart: DateString) => ReadonlyArray<Attribute<M>>
    readonly onDayClick?: (date: DateString) => M
    readonly onWeekNumberClick?: (weekStart: DateString) => M
    readonly onYearClick?: M
    readonly onEventClick?: (event: EventData) => M
  }

export type MobileMonthViewConfig = ComponentConfig<MobileMonthViewOptions, MobileMonthViewPart>

const border = `1px solid light-dark(${palette.gray3}, ${palette.dark4})`
const shade = `light-dark(${palette.gray0}, ${palette.dark6})`

const styles = stylex.create({
  root: { [mobileMonthViewVars.radius]: radius.default, display: "flex", flexDirection: "column", height: "100%" },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: space.sm,
    borderBottom: border
  },
  back: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontWeight: fontWeight.medium,
    fontFamily: "inherit",
    fontSize: fontSize.sm,
    color: "inherit",
    background: "none",
    borderWidth: 0,
    padding: 0,
    cursor: "pointer",
    userSelect: "none"
  },
  label: { userSelect: "none", fontWeight: 600, textTransform: "capitalize", margin: 0 },
  calendar: { containerType: "inline-size", padding: space.sm, borderBottom: border },
  row: { display: "flex" },
  weekdays: { marginBottom: space.xs },
  corner: { flex: "0 0 32px" },
  weekday: {
    flex: 1,
    fontSize: "clamp(6px, 3.5cqw, 22px)",
    fontWeight: fontWeight.medium,
    textAlign: "center",
    textTransform: "capitalize",
    opacity: 0.5,
    paddingBlock: "4px",
    userSelect: "none"
  },
  weekNumber: {
    flex: "0 0 28px",
    marginInlineEnd: "4px",
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    fontFamily: "inherit",
    color: "inherit",
    opacity: 0.5,
    borderWidth: 0,
    borderRadius: mobileMonthViewVars.radius,
    cursor: "pointer",
    backgroundColor: { default: "transparent", ":hover": shade }
  },
  day: {
    flex: 1,
    height: "48px",
    padding: "4px",
    fontWeight: fontWeight.medium,
    fontFamily: "inherit",
    fontSize: "clamp(6px, 3.5cqw, 22px)",
    color: "inherit",
    borderWidth: 0,
    backgroundColor: { default: "transparent", ":hover": shade },
    cursor: "pointer",
    userSelect: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  number: {
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "100%"
  },
  hidden: { visibility: "hidden", pointerEvents: "none" },
  weekend: { color: palette.red6 },
  outside: { opacity: 0.5 },
  today: { backgroundColor: `light-dark(${palette.gray2}, ${palette.dark5})` },
  selected: { backgroundColor: accent.filled, color: accent.contrast },
  still: { cursor: "default", pointerEvents: "none" },
  indicators: {
    position: "absolute",
    bottom: "2px",
    insetInline: 0,
    display: "flex",
    justifyContent: "center",
    gap: "1px"
  },
  indicator: { width: "5px", height: "5px", borderRadius: "100%", backgroundColor: accent.filled },
  list: { flexGrow: 1, display: "flex", flexDirection: "column", minHeight: 0, padding: space.sm },
  listHeader: { marginTop: 0, marginBottom: space.sm, fontWeight: 600, textTransform: "capitalize" },
  event: {
    display: "block",
    width: "100%",
    textAlign: "start",
    cursor: "pointer",
    padding: 0,
    borderWidth: 0,
    borderBottom: { default: border, ":last-child": "none" },
    backgroundColor: { default: "transparent", ":hover": shade },
    color: "inherit",
    fontFamily: "inherit"
  },
  eventBody: { display: "flex", gap: space.sm, padding: `${space.xs} 0` },
  color: { width: "4px", borderRadius: "2px", flexShrink: 0, backgroundColor: accent.filled },
  title: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  time: { marginTop: "2px", fontSize: fontSize.xs, color: colors.dimmed },
  noEvents: { color: colors.dimmed, textAlign: "center", padding: `${space.xl} 0`, margin: 0 }
})

const chevron = <M>(h: HtmlBuilder<M>): Html =>
  h.svg(
    [h.Attribute("viewBox", "0 0 15 15"), h.Attribute("width", "20"), h.Attribute("height", "20"), h.AriaHidden(true)],
    [
      h.path(
        [
          h.Attribute(
            "d",
            "M8.84182 3.13514C9.04327 3.32401 9.05348 3.64042 8.86462 3.84188L5.43521 7.49991L8.86462 11.1579C9.05348 11.3594 9.04327 11.6758 8.84182 11.8647C8.64036 12.0535 8.32394 12.0433 8.13508 11.8419L4.38508 7.84188C4.20477 7.64955 4.20477 7.35027 4.38508 7.15794L8.13508 3.15794C8.32394 2.95648 8.64036 2.94628 8.84182 3.13514Z"
          ),
          h.Attribute("fill", "currentColor")
        ],
        []
      )
    ]
  )

export const MobileMonthView =
  (config: { readonly MobileMonthView?: MobileMonthViewConfig }) =>
  <M>(h: HtmlBuilder<M>, input: MobileMonthViewProps<M>): Html => {
    const props = withDefaults(config.MobileMonthView, input)
    const getStyles = stylesApi<M, MobileMonthViewPart>(h, props, config.MobileMonthView, "mobileMonthView")
    const labels = scheduleLabels(props.labels)
    const date = props.date
    const locale = props.locale ?? "en"
    const mode = props.mode ?? "default"
    const isStatic = mode === "static"
    const withOutsideDays = props.withOutsideDays ?? true
    const week = {
      firstDayOfWeek: props.firstDayOfWeek ?? 1,
      withWeekendDays: props.withWeekendDays ?? true,
      weekendDays: props.weekendDays ?? [0, 6],
      consistentWeeks: props.consistentWeeks ?? true
    }
    const monthStart = startOfMonth(date)
    const monthEnd = endOfMonth(date)
    const expanded = expandRecurringEvents({
      events: props.events,
      rangeStart: `${monthStart} 00:00:00`,
      rangeEnd: `${monthEnd} 23:59:59`,
      ...(props.recurrenceExpansionLimit === undefined ? {} : { expansionLimit: props.recurrenceExpansionLimit })
    })
    const byDay = new Map(agendaGroups(expanded, monthStart, monthEnd).map((group) => [group.date, group.events]))
    const eventsOn = (day: DateString) => byDay.get(day) ?? []
    const today = Option.getOrElse(Option.map(Option.fromNullishOr(props.now), dateOf), () => date)
    const selected = props.selectedDate ?? today
    const weeks = monthWeeks(date, week)
    const withWeekNumbers = props.withWeekNumbers === true
    const firstShown = weeks.flat().find((day) => withOutsideDays || isSameMonth(day, date))

    const dayNode = (day: DateString) => {
      const outside = !isSameMonth(day, date)
      const shown = withOutsideDays || !outside
      const weekend = week.weekendDays.includes(dayOfWeek(day))
      const isToday = (props.highlightToday ?? true) && props.now !== undefined && day === today
      const isSelected = shown && day === selected
      const interactive = shown && !isStatic

      return h.keyed("button")(
        day,
        [
          ...getStyles(
            "mobileMonthViewDay",
            styles.day,
            weekend && styles.weekend,
            outside && styles.outside,
            !shown && styles.hidden,
            isStatic && styles.still,
            shared.focusRing
          ),
          h.Type("button"),
          h.DataAttribute("day-cell", ""),
          h.AriaLabel(formatDateTime(`${day} 00:00:00`, "MMMM D, YYYY", locale)),
          h.Tabindex(interactive && day === firstShown ? 0 : -1),
          ...(isSelected ? [h.AriaSelected(true), h.DataAttribute("selected", "")] : []),
          ...(outside ? [h.DataAttribute("outside", "")] : []),
          ...(weekend ? [h.DataAttribute("weekend", "")] : []),
          ...(isToday ? [h.DataAttribute("today", "")] : []),
          ...(shown ? [] : [h.DataAttribute("hidden", ""), h.Disabled(true)]),
          ...(props.onDayClick === undefined || !interactive ? [] : [h.OnClick(props.onDayClick(day))]),
          ...(props.getDayProps?.(day) ?? [])
        ],
        shown
          ? [
              h.span(sx(h, styles.number, isToday && !isSelected && styles.today, isSelected && styles.selected), [
                String(Number(day.slice(8, 10)))
              ]),
              h.span(
                getStyles("mobileMonthViewDayIndicators", styles.indicators),
                eventsOn(day)
                  .slice(0, 3)
                  .map((event) =>
                    h.keyed("span")(
                      String(event.id),
                      getStyles(
                        "mobileMonthViewDayIndicator",
                        ...accentStyle(event.color, customAccent),
                        styles.indicator
                      ),
                      []
                    )
                  )
              )
            ]
          : []
      )
    }

    const weekNode = (days: Arr.NonEmptyReadonlyArray<DateString>) => {
      const start = Arr.headNonEmpty(days)

      return h.keyed("div")(
        start,
        [...getStyles("mobileMonthViewWeek", styles.row), h.DataAttribute("month-week", "")],
        [
          ...(withWeekNumbers
            ? [
                h.button(
                  [
                    ...getStyles(
                      "mobileMonthViewWeekNumber",
                      styles.weekNumber,
                      isStatic && styles.still,
                      shared.focusRing
                    ),
                    h.Type("button"),
                    h.AriaLabel(`${labels.week} ${weekNumber(days)}`),
                    ...(props.onWeekNumberClick === undefined || isStatic
                      ? []
                      : [h.OnClick(props.onWeekNumberClick(start))]),
                    ...(props.getWeekNumberProps?.(start) ?? [])
                  ],
                  [String(weekNumber(days))]
                )
              ]
            : []),
          ...days.map(dayNode)
        ]
      )
    }

    const eventNode = (event: EventData) => {
      const allDay = isMultidayEvent(event) || isAllDayEvent(event, selected)
      const attributes = [
        ...getStyles(
          "mobileMonthViewEvent",
          ...accentStyle(event.color, customAccent),
          styles.event,
          isStatic && styles.still,
          shared.focusRing
        ),
        h.Type("button"),
        h.Tabindex(isStatic ? -1 : 0),
        ...(props.onEventClick === undefined || isStatic ? [] : [h.OnClick(props.onEventClick(event))])
      ]
      const children = [
        h.div(getStyles("mobileMonthViewEventBody", styles.eventBody), [
          h.div(getStyles("mobileMonthViewEventColor", styles.color), []),
          h.div(
            [],
            [
              h.div(getStyles("mobileMonthViewEventTitle", styles.title), [event.title]),
              h.div(getStyles("mobileMonthViewEventTime", styles.time), [
                allDay
                  ? labels.allDay
                  : `${formatDateTime(event.start, "HH:mm")} – ${formatDateTime(event.end, "HH:mm")}`
              ])
            ]
          )
        ])
      ]

      return props.renderEvent === undefined
        ? h.keyed("button")(String(event.id), attributes, children)
        : props.renderEvent(event, { attributes, children })
    }

    const defaultHeader = [
      h.button(
        [
          ...getStyles("mobileMonthViewHeaderBackButton", styles.back, isStatic && styles.still, shared.focusRing),
          h.Type("button"),
          h.Tabindex(isStatic ? -1 : 0),
          ...(props.onYearClick === undefined || isStatic ? [] : [h.OnClick(props.onYearClick)])
        ],
        [chevron(h), date.slice(0, 4)]
      ),
      h.p(getStyles("mobileMonthViewHeaderLabel", styles.label), [
        formatDateTime(`${date} 00:00:00`, "MMMM YYYY", locale)
      ])
    ]

    const dayEvents = eventsOn(selected)

    return h.div(
      [
        ...getStyles(
          "mobileMonthView",
          styles.root,
          setDefinedVars([
            mobileMonthViewVars.radius,
            props.radius === undefined ? undefined : radiusValue(props.radius)
          ])
        ),
        ...(withWeekNumbers ? [h.DataAttribute("with-week-numbers", "")] : []),
        h.OnMount(Mount.mapMessage(GridBehaviour({ startScrollTime: "", layout: "rows" }), Function.absurd<M>))
      ],
      [
        h.div(
          getStyles("mobileMonthViewHeader", styles.header),
          props.renderHeader === undefined ? defaultHeader : [props.renderHeader({ mode, date, defaultHeader })]
        ),
        h.div(getStyles("mobileMonthViewCalendar", styles.calendar), [
          ...((props.withWeekDays ?? true)
            ? [
                h.div(getStyles("mobileMonthViewWeekdays", styles.row, styles.weekdays), [
                  ...(withWeekNumbers ? [h.div(getStyles("mobileMonthViewWeekdaysCorner", styles.corner), [])] : []),
                  ...Arr.headNonEmpty(weeks).map((day) =>
                    h.keyed("div")(`weekday-${day}`, getStyles("mobileMonthViewWeekday", styles.weekday), [
                      formatDateTime(`${day} 00:00:00`, props.weekdayFormat ?? "dd", locale)
                    ])
                  )
                ])
              ]
            : []),
          ...weeks.map(weekNode)
        ]),
        h.div(getStyles("mobileMonthViewEventsList", styles.list), [
          h.p(getStyles("mobileMonthViewEventsHeader", styles.listHeader), [
            formatDateTime(`${selected} 00:00:00`, props.eventsHeaderFormat ?? "dddd, MMMM D", locale)
          ]),
          ...(dayEvents.length > 0
            ? dayEvents.map(eventNode)
            : [h.p(getStyles("mobileMonthViewNoEvents", styles.noEvents), [labels.noEvents])])
        ])
      ]
    )
  }
